import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule,
  Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { SelectModule }        from 'primeng/select';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { ButtonModule }        from 'primeng/button';
import { TagModule }           from 'primeng/tag';
import { TableModule }         from 'primeng/table';
import { DividerModule }       from 'primeng/divider';
import { TooltipModule }       from 'primeng/tooltip';
import { IconFieldModule }     from 'primeng/iconfield';
import { InputIconModule }     from 'primeng/inputicon';
import { ToastModule }         from 'primeng/toast';
import { ProgressBarModule }   from 'primeng/progressbar';
import { MessageService }      from 'primeng/api';

import { CommonService } from '../commonservice';
import { AuditLog }      from '../audit-log';

@Component({
  selector: 'app-agentbranchidchange',
  standalone: true,
  templateUrl: './agentbranchidchange.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ProgressBarModule,
    TableModule,
  ]
})
export class Agentbranchidchange implements OnInit {

  form!: FormGroup;
  isSaving = false;

  branches    : any[]      = [];
  tickets     : any[]      = [];
  auditLogs   : AuditLog[] = [];
  oldDataSnapshot: any[]   = [];
  variations: { field: string; oldValue: any; newValue: any; changed: boolean }[] = [];

  loginName  = 'admin';
  changeType = 'Agent branch id change';

  // ─── confirm modal state ───────────────────────────
  showConfirmModal    = false;
  pendingUpdatePayload: any = null;
  pendingOldBranch     = '';
  pendingNewBranch     = '';
  pendingReason         = '';

  private fb      = inject(FormBuilder);
  private http    = inject(HttpClient);
  private service = inject(CommonService);
  private msgSvc  = inject(MessageService);

  /* ─── lifecycle ─────────────────────────────────── */
  ngOnInit(): void {
    this.form = this.fb.group({
      referralCode:          ['', Validators.required],
      agentUniqueCode:       [{ value: '', disabled: true }],
      agentName:             [{ value: '', disabled: true }],
      mobileNo:              [{ value: '', disabled: true }],
      branchName:            [{ value: '', disabled: true }],
      reason:                ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      branchconfigurationid: [{ value: '', disabled: true }, Validators.required]
    });

    this.form.get('referralCode')?.valueChanges.subscribe(value => {
      if (!value) {
        this.clearAgentDetails();
      } else {
        this.form.get('branchconfigurationid')?.enable();
      }
    });

    // update variations when user selects a new branch
    this.form.get('branchconfigurationid')?.valueChanges.subscribe(val => {
      if (!val) {
        this.variations = [];
        return;
      }

      const selected = this.branches.find(b => b.branchconfigurationid === val) || {};
      const old = this.oldDataSnapshot[0] || {};

      // fields we want to compare — expand as needed
      const fields = ['branchName'];
      this.variations = fields.map(f => {
        const oldVal = old[f] ?? '';
        const newVal = selected[f] ?? '';
        return { field: f, oldValue: oldVal, newValue: newVal, changed: oldVal !== newVal };
      });
    });

    this.loadTickets();
  }

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  get reasonLen(): number { return (this.f['reason']?.value || '').length; }

  /* ─── validators ────────────────────────────────── */
  agentCodeValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.form) return null;
    const referralCode = this.form.get('referralCode')?.value;
    return referralCode ? null : { agentCodeMissing: 'Enter AgentCode First' };
  }

  /* ─── API calls ─────────────────────────────────── */
  loadTickets(): void {
    this.http.get<any[]>('http://localhost:5000/api/Change/Agentcode').subscribe({
      next: res  => (this.tickets = res),
      error: ()  => (this.tickets = [])
    });
  }

  getAgentDetails(): void {
    const referralCode = this.form.get('referralCode')?.value;
    if (!referralCode) return;

    this.http
      .get<any>(`http://localhost:5000/api/Change/GetReferralDetails?referralCode=${referralCode}`)
      .subscribe({
        next: res => {
          const data = res[0];
          this.form.patchValue({
            agentUniqueCode: data.agentUniqueCode,
            agentName:       data.agentName,
            mobileNo:        data.businessEntityContactNo,
            branchName:      data.branchName
          });
          this.oldDataSnapshot = [{
            referralCode,
            agentUniqueCode: data.agentUniqueCode,
            agentName:       data.agentName,
            branchName:      data.branchName
          }];
          this.loadBranches();
        },
        error: () => {
          this.msgSvc.add({
            severity: 'error', summary: 'Not Found',
            detail: 'Referral Code not found.', life: 4000
          });
          this.clearAgentDetails();
        }
      });
  }

  loadBranches(): void {
    this.http.get<any[]>('http://localhost:5000/api/Change/GetChequeBranchName').subscribe({
      next: res  => (this.branches = res),
      error: ()  => this.msgSvc.add({
        severity: 'error', summary: 'Error',
        detail: 'Failed to load branch names.', life: 4000
      })
    });
  }

  /* ─── save flow ─────────────────────────────────── */
  // Step 1: validate + stage data, open confirm modal
  save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.msgSvc.add({
        severity: 'warn', summary: 'Incomplete',
        detail: 'Please fill all required fields correctly.', life: 4000
      });
      return;
    }

    const oldBranch    = this.f['branchName'].value;
    const newBranchId  = this.f['branchconfigurationid'].value;
    const newBranchObj = this.branches.find(b => b.branchconfigurationid === newBranchId);
    const newBranchName = newBranchObj?.branchName || newBranchId;

    this.pendingOldBranch = oldBranch;
    this.pendingNewBranch = newBranchName;
    this.pendingReason    = this.f['reason'].value;

    this.pendingUpdatePayload = {
      referralCode:     this.f['referralCode'].value,
      newBranchId:      newBranchId,
      ptypeofoperation: 'UPDATE'
    };

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal     = false;
    this.pendingUpdatePayload = null;
  }

  // Step 2: fires only after user clicks "Yes, Save" in the modal
  confirmSave(): void {
    if (!this.pendingUpdatePayload) return;

    this.showConfirmModal = false;
    this.isSaving = true;

    this.service.updateAgentBranch(this.pendingUpdatePayload).subscribe({
      next: () => {
        this.isSaving = false;
        this.msgSvc.add({
          severity: 'success', summary: 'Done',
          detail: 'Agent branch updated successfully.', life: 4000
        });
        this.clear();
      },
      error: err => {
        this.isSaving = false;
        console.error('Update failed', err);
        this.msgSvc.add({
          severity: 'error', summary: 'Error',
          detail: 'Update failed. Please try again.', life: 4000
        });
      }
    });
  }

  /* ─── helpers ───────────────────────────────────── */
  clearAgentDetails(): void {
    this.form.patchValue({
      agentUniqueCode:       '',
      agentName:             '',
      mobileNo:              '',
      branchName:            '',
      branchconfigurationid: ''
    });
    this.form.get('branchconfigurationid')?.disable();
  }

  clear(): void {
    this.form.reset();
    this.branches        = [];
    this.oldDataSnapshot = [];
    this.auditLogs       = [];
  }
}

// import { Component, OnInit, inject } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule,
//   Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpClientModule } from '@angular/common/http';

// import { SelectModule }        from 'primeng/select';
// import { InputTextModule }     from 'primeng/inputtext';
// import { TextareaModule }      from 'primeng/textarea';
// import { ButtonModule }        from 'primeng/button';
// import { TagModule }           from 'primeng/tag';
// import { DividerModule }       from 'primeng/divider';
// import { TooltipModule }       from 'primeng/tooltip';
// import { IconFieldModule }     from 'primeng/iconfield';
// import { InputIconModule }     from 'primeng/inputicon';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule }         from 'primeng/toast';
// import { ProgressBarModule }   from 'primeng/progressbar';
// import { ConfirmationService, MessageService } from 'primeng/api';

// import { CommonService } from '../commonservice';
// import { AuditLog }      from '../audit-log';

// @Component({
//   selector: 'app-agentbranchidchange',
//   standalone: true,
//   templateUrl: './agentbranchidchange.html',
//   providers: [ConfirmationService, MessageService],
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     HttpClientModule,
//     SelectModule,
//     InputTextModule,
//     TextareaModule,
//     ButtonModule,
//     TagModule,
//     DividerModule,
//     TooltipModule,
//     IconFieldModule,
//     InputIconModule,
//     ConfirmDialogModule,
//     ToastModule,
//     ProgressBarModule,
//   ]
// })
// export class Agentbranchidchange implements OnInit {

//   form!: FormGroup;
//   isSaving = false;

//   branches    : any[]      = [];
//   tickets     : any[]      = [];
//   auditLogs   : AuditLog[] = [];
//   oldDataSnapshot: any[]   = [];

//   loginName  = 'admin';
//   changeType = 'Agent branch id change';

//   private fb         = inject(FormBuilder);
//   private http       = inject(HttpClient);
//   private service    = inject(CommonService);
//   private confirmSvc = inject(ConfirmationService);
//   private msgSvc     = inject(MessageService);

//   /* ─── lifecycle ─────────────────────────────────── */
//   ngOnInit(): void {
//     this.form = this.fb.group({
//       referralCode:          ['', Validators.required],
//       agentUniqueCode:       [{ value: '', disabled: true }],
//       agentName:             [{ value: '', disabled: true }],
//       mobileNo:              [{ value: '', disabled: true }],
//       branchName:            [{ value: '', disabled: true }],
//       reason:                ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
//       branchconfigurationid: [{ value: '', disabled: true }, Validators.required]
//     });

//     this.form.get('referralCode')?.valueChanges.subscribe(value => {
//       if (!value) {
//         this.clearAgentDetails();
//       } else {
//         this.form.get('branchconfigurationid')?.enable();
//       }
//     });

//     this.loadTickets();
//   }

//   get f(): { [key: string]: AbstractControl } { return this.form.controls; }

//   get reasonLen(): number { return (this.f['reason']?.value || '').length; }

//   /* ─── validators ────────────────────────────────── */
//   agentCodeValidator(control: AbstractControl): ValidationErrors | null {
//     if (!this.form) return null;
//     const referralCode = this.form.get('referralCode')?.value;
//     return referralCode ? null : { agentCodeMissing: 'Enter AgentCode First' };
//   }

//   /* ─── API calls ─────────────────────────────────── */
//   loadTickets(): void {
//     this.http.get<any[]>('http://localhost:5000/api/Change/Agentcode').subscribe({
//       next: res  => (this.tickets = res),
//       error: ()  => (this.tickets = [])
//     });
//   }

//   getAgentDetails(): void {
//     const referralCode = this.form.get('referralCode')?.value;
//     if (!referralCode) return;

//     this.http
//       .get<any>(`http://localhost:5000/api/Change/GetReferralDetails?referralCode=${referralCode}`)
//       .subscribe({
//         next: res => {
//           const data = res[0];
//           this.form.patchValue({
//             agentUniqueCode: data.agentUniqueCode,
//             agentName:       data.agentName,
//             mobileNo:        data.businessEntityContactNo,
//             branchName:      data.branchName
//           });
//           this.oldDataSnapshot = [{
//             referralCode,
//             agentUniqueCode: data.agentUniqueCode,
//             agentName:       data.agentName,
//             branchName:      data.branchName
//           }];
//           this.loadBranches();
//         },
//         error: () => {
//           this.msgSvc.add({
//             severity: 'error', summary: 'Not Found',
//             detail: 'Referral Code not found.', life: 4000
//           });
//           this.clearAgentDetails();
//         }
//       });
//   }

//   loadBranches(): void {
//     this.http.get<any[]>('http://localhost:5000/api/Change/GetChequeBranchName').subscribe({
//       next: res  => (this.branches = res),
//       error: ()  => this.msgSvc.add({
//         severity: 'error', summary: 'Error',
//         detail: 'Failed to load branch names.', life: 4000
//       })
//     });
//   }

//   /* ─── save ──────────────────────────────────────── */
//   save(): void {
//     this.form.markAllAsTouched();

//     if (this.form.invalid) {
//       this.msgSvc.add({
//         severity: 'warn', summary: 'Incomplete',
//         detail: 'Please fill all required fields correctly.', life: 4000
//       });
//       return;
//     }

//     const oldBranch = this.f['branchName'].value;
//     const newBranchId = this.f['branchconfigurationid'].value;
//     const newBranchObj = this.branches.find(b => b.branchconfigurationid === newBranchId);
//     const newBranchName = newBranchObj?.branchName || newBranchId;

//     this.confirmSvc.confirm({
//       message: `Change branch from <strong>${oldBranch}</strong> to <strong>${newBranchName}</strong>?`,
//       header: 'Confirm Branch Change',
//       icon: 'pi pi-shield',
//       acceptLabel: 'Yes, Save',
//       rejectLabel: 'Cancel',
//       acceptButtonStyleClass: 'p-button-success',
//       rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
//       accept: () => {
//         this.isSaving = true;

//         const payload = {
//           referralCode:    this.f['referralCode'].value,
//           newBranchId:     newBranchId,
//           ptypeofoperation:'UPDATE'
//         };

//         this.service.updateAgentBranch(payload).subscribe({
//           next: () => {
//             this.isSaving = false;
//             this.msgSvc.add({
//               severity: 'success', summary: 'Done',
//               detail: 'Agent branch updated successfully.', life: 4000
//             });
//             this.clear();
//           },
//           error: err => {
//             this.isSaving = false;
//             console.error('Update failed', err);
//             this.msgSvc.add({
//               severity: 'error', summary: 'Error',
//               detail: 'Update failed. Please try again.', life: 4000
//             });
//           }
//         });
//       }
//     });
//   }

//   /* ─── helpers ───────────────────────────────────── */
//   clearAgentDetails(): void {
//     this.form.patchValue({
//       agentUniqueCode: '',
//       agentName:       '',
//       mobileNo:        '',
//       branchName:      '',
//       NewBranchId:     ''
//     });
//     this.form.get('branchconfigurationid')?.disable();
//   }

//   clear(): void {
//     this.form.reset();
//     this.branches        = [];
//     this.oldDataSnapshot = [];
//     this.auditLogs       = [];
//   }
// }