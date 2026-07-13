// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { CommonService } from '../commonservice';

// @Component({
//   selector: 'app-chequereturnchargespermission',
//   standalone: true,
//   templateUrl: './chequereturnchargespermission.html',
//   imports: [CommonModule, ReactiveFormsModule, NgSelectModule]
// })
// export class Chequereturnchargespermission implements OnInit {

//   showForm = true;

//   branchlist: any[] = [];
//   configId: number = 0;
//   company_code: string | null = null;
//   currentAmount: number = 0;

//   form!: FormGroup;

//   private fb = inject(FormBuilder);
//   private service = inject(CommonService);

//   ngOnInit(): void {
//     this.form = this.fb.group({
//       cao: ['', Validators.required],
//       charges: [{ value: '', disabled: true }],
//       isChecked: [false],
//       reason: ['', [
//         Validators.required,
//         Validators.minLength(10),
//         Validators.maxLength(200)
//       ]]
//     });

//     this.loadBranches();
//     this.onCaoChange();
//   }

//   get f() {
//     return this.form.controls;
//   }

//   get reasonRequired(): boolean {
//     const ctrl = this.f['reason'];
//     return !!(ctrl.touched && ctrl.errors?.['required']);
//   }

//   get reasonMinLength(): boolean {
//     const ctrl = this.f['reason'];
//     return !!(ctrl.touched && ctrl.errors?.['minlength']);
//   }

//   loadBranches() {
//     this.service.GetcompanyNames()
//       .subscribe(res => this.branchlist = res || []);
//   }

//   onCaoChange() {
//     this.f['cao'].valueChanges.subscribe(value => {

//       this.reset();

//       if (!value) return;

//       this.company_code = value;

//       this.service.getchequesreturncharges(this.company_code!)
//         .subscribe((res: any[]) => {
//           if (res?.length) {
//             const data = res[0];

//             this.configId = data.tbl_mst_chit_company_configuration_ID;
//             this.currentAmount = data.chequereturn_charges_amount;

//             this.form.patchValue({
//               charges: this.currentAmount,
//               isChecked: this.currentAmount === 250  
//             }, { emitEvent: false });
//           }
//         });
//     });
//   }

//  confirmSave() {

//   if (this.form.invalid || !this.configId) {
//     this.form.markAllAsTouched();
//     return;
//   }

//   const isChecked = this.f['isChecked'].value;
//   const newAmount = isChecked ? 250 : 0;  

//   const audit = {
//     schemaName: this.company_code,
//     loginName: 'admin',
//     loginTime: new Date().toISOString(),
//     changeType: 'ChequeReturnChargesPermission',
//     oldData: { chequereturn_charges_amount: this.currentAmount },
//     newData: { chequereturn_charges_amount: newAmount },
//     reason: this.f['reason'].value
//   };

//   // Backend toggles: send currentAmount so it flips to newAmount
//   this.service.updatechequesreturncharges(this.configId, this.currentAmount)
//     .subscribe({
//       next: () => {
//         this.service.saveData([audit]).subscribe({
//           next: () => {
//             alert('Updated successfully & audit saved');
//             this.clear();
//           },
//           error: () => alert('Updated but audit failed')
//         });
//       },
//       error: () => alert('Update failed')
//     });
// }

//   reset() {
//     this.configId = 0;
//     this.company_code = null;
//     this.currentAmount = 0;
//     this.form.patchValue({
//       charges: '',
//       isChecked: false
//     });
//   }

//   clear() {
//     this.form.reset();
//     this.reset();
//   }
// }
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-chequereturnchargespermission',
  standalone: true,
  templateUrl: './chequereturnchargespermission.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressBarModule,
    TooltipModule
  ]
})
export class Chequereturnchargespermission implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  configId: number = 0;
  company_code: string | null = null;
  currentAmount: number = 0;

  // ─── edit-icon toggle for the "New Permission" field ───────────
  editingStatus = false;

  statusOptions = [
    { label: 'Allowed', value: true },
    { label: 'Not Allowed', value: false }
  ];

  form!: FormGroup;

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  pendingConfigId: number = 0;
  pendingCurrentAmount: number = 0;
  pendingNewAmount: number = 0;
  pendingCurrentStatusLabel = '';
  pendingNewStatusLabel = '';
  pendingAudit: any = null;
  pendingCompanyName = '';
  pendingReason = '';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.onCaoChange();
  }

  initForm() {
    this.form = this.fb.group({
      cao: ['', Validators.required],
      charges: [{ value: '', disabled: true }],
      currentStatus: [{ value: '', disabled: true }],
      newStatus: [{ value: false, disabled: true }, Validators.required],
      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  get f() {
    return this.form.controls;
  }

  get reasonRequired(): boolean {
    const ctrl = this.f['reason'];
    return !!(ctrl.touched && ctrl.errors?.['required']);
  }

  get reasonMinLength(): boolean {
    const ctrl = this.f['reason'];
    return !!(ctrl.touched && ctrl.errors?.['minlength']);
  }

  get selectedCompanyName(): string {
    const code = this.f['cao'].value;
    const match = this.branchlist.find(b => b.company_code === code);
    return match?.company_name || code || '';
  }

  get currentStatusLabel(): string {
    return this.currentAmount === 250 ? 'Allowed' : 'Not Allowed';
  }

  get newStatusLabel(): string {
    return this.f['newStatus'].value ? 'Allowed' : 'Not Allowed';
  }

  loadBranches() {
    this.service.GetcompanyNames()
      .subscribe(res => this.branchlist = res || []);
  }

  onCaoChange() {
    this.f['cao'].valueChanges.subscribe(value => {

      this.reset();

      if (!value) return;

      this.company_code = value;

      this.service.getchequesreturncharges(this.company_code!)
        .subscribe((res: any[]) => {
          if (res?.length) {
            const data = res[0];

            this.configId = data.tbl_mst_chit_company_configuration_ID;
            this.currentAmount = data.chequereturn_charges_amount;

            this.form.patchValue({
              charges: this.currentAmount,
              currentStatus: this.currentStatusLabel,
              newStatus: this.currentAmount === 250
            }, { emitEvent: false });
          }
        });
    });
  }

  // ── Edit-icon toggle (replaces the old checkbox) ────────────────
  toggleEditStatus(): void {
    if (!this.configId) return;

    this.editingStatus = !this.editingStatus;

    if (this.editingStatus) {
      this.f['newStatus'].enable();
    } else {
      // cancelled — revert to the current saved value & lock the field again
      this.f['newStatus'].setValue(this.currentAmount === 250);
      this.f['newStatus'].disable();
    }
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal
  save(): void {
    if (this.form.invalid || !this.configId) {
      this.form.markAllAsTouched();
      return;
    }

    const newAllowed = this.f['newStatus'].value;
    const newAmount = newAllowed ? 250 : 0;

    this.pendingConfigId           = this.configId;
    this.pendingCurrentAmount      = this.currentAmount;
    this.pendingNewAmount          = newAmount;
    this.pendingCurrentStatusLabel = this.currentStatusLabel;
    this.pendingNewStatusLabel     = newAllowed ? 'Allowed' : 'Not Allowed';
    this.pendingCompanyName        = this.selectedCompanyName;
    this.pendingReason             = this.f['reason'].value;

    this.pendingAudit = this.auth.buildAudit(
      'ChequeReturnChargesPermission',
      {
        oldData: { chequereturn_charges_amount: this.currentAmount },
        newData: { chequereturn_charges_amount: newAmount }
      },
      this.f['reason'].value
    );

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.pendingAudit = null;
  }

  // Step 2: fires only after user clicks "Yes, Save" in the modal
  confirmSave(): void {
    if (!this.pendingAudit) return;

    this.showConfirmModal = false;
    this.saving.set(true);

    // Backend toggles: send currentAmount so it flips to newAmount
    this.service.updatechequesreturncharges(this.pendingConfigId, this.pendingCurrentAmount)
      .subscribe({
        next: () => {
          this.service.saveData([this.pendingAudit]).subscribe({
            next: () => {
              this.saving.set(false);
              alert('Updated successfully & audit saved');
              this.clear();
            },
            error: () => {
              this.saving.set(false);
              alert('Updated but audit failed');
            }
          });
        },
        error: () => {
          this.saving.set(false);
          alert('Update failed');
        }
      });
  }

  reset() {
    this.configId = 0;
    this.company_code = null;
    this.currentAmount = 0;
    this.editingStatus = false;

    this.f['newStatus'].disable();
    this.form.patchValue({
      charges: '',
      currentStatus: '',
      newStatus: false
    }, { emitEvent: false });
  }

  clear() {
    this.form.reset();
    this.initForm();
    this.reset();
  }
}