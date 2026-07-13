import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-cheque-issue',
  standalone: true,
  templateUrl: './cheque-issue.html',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressBarModule,
    TableModule
  ]
})
export class ChequeIssue implements OnInit {

  showForm = true;
  saving = signal(false);

  paymentForm: FormGroup;
  submitted    = false;
  isAnyChecked = false;
  showGrid     = false;

  branches: any[]        = [];
  paymentNumbers: any[]  = [];
  details: any[]         = [];
  oldDataSnapshot: any[] = [];

  loginName = 'admin';

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  pendingAudit: any = null;
  pendingBranchName = '';
  pendingReferenceNo = '';
  pendingSelectedCount = 0;
  pendingReason = '';

  private fb  = inject(FormBuilder);
  private service = inject(CommonService);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(Auth);

  constructor() {
    this.paymentForm = this.fb.group({
      branch:          [null, Validators.required],
      selectedPayment: [null, Validators.required],
      reason:          ['',   [Validators.required, Validators.minLength(10), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadBranches();

    // branch change → reload reference numbers, reset downstream
    this.paymentForm.get('branch')!.valueChanges.subscribe((branch: any) => {
      this.paymentForm.get('selectedPayment')!.setValue(null, { emitEvent: false });
      this.paymentNumbers = [];
      this.details        = [];
      this.showGrid       = false;
      this.isAnyChecked   = false;

      if (!branch) return;

      const branchschema: string = branch.branchCode;
      if (!branchschema) {
        console.error('[branch valueChanges] branchCode is undefined! Keys:', Object.keys(branch));
        return;
      }

      this.service.getChequenumbers(branchschema).subscribe({
        next: (res: any[]) => {
          this.paymentNumbers = res ?? [];
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('[getChequenumbers] error =', err)
      });
    });

    // reference change → hide grid until Get is clicked again
    this.paymentForm.get('selectedPayment')!.valueChanges.subscribe(() => {
      this.details      = [];
      this.showGrid     = false;
      this.isAnyChecked = false;
    });
  }

  get f() {
    return this.paymentForm.controls;
  }

  get reasonRequired(): boolean {
    const ctrl = this.f['reason'];
    return !!((ctrl.touched || this.submitted) && ctrl.errors?.['required']);
  }

  get reasonMinLength(): boolean {
    const ctrl = this.f['reason'];
    return !!((ctrl.touched || this.submitted) && ctrl.errors?.['minlength']);
  }

  loadBranches(): void {
    this.service.getbranchnames().subscribe({
      next: (res: any) => {
        const arr = Array.isArray(res) ? res : (res?.data ?? res?.result ?? res?.table ?? []);
        this.branches = arr;
      },
      error: (err: any) => console.error('[loadBranches] error =', err)
    });
  }

  // Get button — fetch and display the details grid
  loadDetails(): void {
    const payment = this.paymentForm.get('selectedPayment')?.value;
    if (!payment) return;

    const branchschema: string = this.paymentForm.get('branch')!.value?.branchCode;

    this.details      = [];
    this.showGrid     = false;
    this.isAnyChecked = false;

    this.service.getChequeDetails(
      branchschema,
      payment.payment_number,
      payment.reference_number,
      payment.clear_status
    ).subscribe({
      next: (res: any[]) => {
        this.details         = (res ?? []).map(d => ({ ...d, selected: false }));
        this.oldDataSnapshot = structuredClone(this.details);
        this.showGrid        = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('[getChequeDetails] error =', err);
        this.showGrid = true; // show "no records" message
        this.cdr.detectChanges();
      }
    });
  }

  onCheckboxChange(event: any, index: number): void {
    this.details[index].selected = event.target.checked;
    this.isAnyChecked = this.details.some(d => d.selected);
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal
  save(): void {
    this.submitted = true;
    this.paymentForm.markAllAsTouched();

    if (this.paymentForm.invalid) return;

    const selectedRows = this.details.filter(d => d.selected);
    if (selectedRows.length === 0) return;

    const payment = this.paymentForm.get('selectedPayment')?.value;
    const branch  = this.paymentForm.get('branch')?.value;
    const reason  = this.f['reason'].value;

    this.pendingBranchName    = branch?.branchName ?? '';
    this.pendingReferenceNo   = payment?.reference_number ?? '';
    this.pendingSelectedCount = selectedRows.length;
    this.pendingReason        = reason;

    const newData = structuredClone(this.details).map((item: any) => {
      const { selected, ...rest } = item;
      return {
        ...rest,
        clear_date:   item.selected ? null : item.clear_date,
        clear_status: item.selected ? 'N'  : item.clear_status
      };
    });

    this.pendingAudit = this.auth.buildAudit(
      'CHEQUE_ISSUE',
      {
        oldData: { rows: structuredClone(this.oldDataSnapshot) },
        newData: { rows: newData }
      },
      reason
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

    const payment = this.paymentForm.get('selectedPayment')?.value;
    const branchschema: string = this.paymentForm.get('branch')!.value?.branchCode;
    const selectedRows = this.details.filter(d => d.selected);

    this.showConfirmModal = false;
    this.saving.set(true);

    // Step 1: update clear date & status for each selected row
    const updateCalls = selectedRows.map(row =>
      this.service.clearDateAndStatus(
        branchschema,
        row.payment_number,
        row.reference_number,
        row.transaction_no            ?? '',
        row.tbl_trans_bank_entries_id ?? 0,
        payment.clear_status
      ).toPromise()
    );

    Promise.all(updateCalls)
      .then(() => {
        // Step 2: save audit log to backend
        this.service.saveData([this.pendingAudit]).subscribe({
          next: () => {
            this.saving.set(false);
            alert('Updated successfully & audit saved');
            this.clear();
          },
          error: (err: any) => {
            this.saving.set(false);
            console.error(err);
            alert('Updated but audit failed');
          }
        });
      })
      .catch(err => {
        this.saving.set(false);
        console.error(err);
        alert('Error updating ClearDate/ClearStatus');
      });
  }

  clear(): void {
    this.paymentForm.reset();
    this.paymentNumbers = [];
    this.details        = [];
    this.showGrid       = false;
    this.isAnyChecked   = false;
    this.submitted      = false;
    this.pendingAudit   = null;
  }
}



// import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { SelectModule } from 'primeng/select';
// import { TableModule } from 'primeng/table';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { ButtonModule } from 'primeng/button';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TagModule } from 'primeng/tag';
// import { CommonService } from '../commonservice';
// import { Auth } from '../auth';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { DividerModule } from 'primeng/divider';

// @Component({
//   selector: 'app-cheque-issue',
//   standalone: true,
//   templateUrl: './cheque-issue.html',
//   imports: [
//     ReactiveFormsModule,
//     CommonModule,
//     FormsModule,
//     SelectModule,
//     TableModule,
//     InputTextModule,
//     TextareaModule,
//     ButtonModule,
//     CheckboxModule,
//     ProgressBarModule,
//     DividerModule,
//     TagModule
//   ]
// })
// export class ChequeIssue implements OnInit {

//   paymentForm: FormGroup;
//   submitted    = false;
//   isAnyChecked = false;
//   showGrid     = false;
//   saving       = false;

//   branches: any[]        = [];
//   paymentNumbers: any[]  = [];
//   details: any[]         = [];
//   oldDataSnapshot: any[] = [];

//   private fb      = inject(FormBuilder);
//   private service = inject(CommonService);
//   private cdr     = inject(ChangeDetectorRef);
//   private auth    = inject(Auth);

//   constructor() {
//     this.paymentForm = this.fb.group({
//       branch:          [null, Validators.required],
//       selectedPayment: [null, Validators.required],
//       reason:          ['',   Validators.required]
//     });
//   }

//   ngOnInit(): void {
//     this.loadBranches();

//     // branch change → reload reference numbers, reset downstream
//     this.paymentForm.get('branch')!.valueChanges.subscribe((branch: any) => {
//       this.paymentForm.get('selectedPayment')!.setValue(null, { emitEvent: false });
//       this.paymentNumbers = [];
//       this.details        = [];
//       this.showGrid       = false;
//       this.isAnyChecked   = false;

//       if (!branch) return;

//       const branchschema: string = branch.branchCode;
//       if (!branchschema) {
//         console.error('[branch valueChanges] branchCode is undefined! Keys:', Object.keys(branch));
//         return;
//       }

//       this.service.getChequenumbers(branchschema).subscribe({
//         next: (res: any[]) => {
//           this.paymentNumbers = res ?? [];
//           this.cdr.detectChanges();
//         },
//         error: (err: any) => console.error('[getChequenumbers] error =', err)
//       });
//     });

//     // reference change → hide grid until Get is clicked again
//     this.paymentForm.get('selectedPayment')!.valueChanges.subscribe(() => {
//       this.details      = [];
//       this.showGrid     = false;
//       this.isAnyChecked = false;
//     });
//   }

//   loadBranches(): void {
//     this.service.getbranchnames().subscribe({
//       next: (res: any) => {
//         const arr = Array.isArray(res) ? res : (res?.data ?? res?.result ?? res?.table ?? []);
//         this.branches = arr;
//       },
//       error: (err: any) => console.error('[loadBranches] error =', err)
//     });
//   }

//   // Get button — fetch and display the details grid
//   loadDetails(): void {
//     const payment = this.paymentForm.get('selectedPayment')?.value;
//     if (!payment) return;

//     const branchschema: string = this.paymentForm.get('branch')!.value?.branchCode;

//     this.details      = [];
//     this.showGrid     = false;
//     this.isAnyChecked = false;

//     this.service.getChequeDetails(
//       branchschema,
//       payment.payment_number,
//       payment.reference_number,
//       payment.clear_status
//     ).subscribe({
//       next: (res: any[]) => {
//         this.details         = (res ?? []).map(d => ({ ...d, selected: false }));
//         this.oldDataSnapshot = structuredClone(this.details);
//         this.showGrid        = true;
//         this.cdr.detectChanges();
//       },
//       error: (err: any) => {
//         console.error('[getChequeDetails] error =', err);
//         this.showGrid = true; // show "no records" message
//         this.cdr.detectChanges();
//       }
//     });
//   }

//   onCheckboxChange(checked: boolean, index: number): void {
//     this.details[index].selected = checked;
//     this.isAnyChecked = this.details.some(d => d.selected);
//   }

//   saveForm(): void {
//     this.submitted = true;

//     const reason = this.paymentForm.get('reason')?.value;
//     if (!reason || reason.trim().length < 10) return;

//     const payment = this.paymentForm.get('selectedPayment')?.value;
//     if (!payment) return;

//     const branchschema: string = this.paymentForm.get('branch')!.value?.branchCode;

//     const selectedRows = this.details.filter(d => d.selected);
//     if (selectedRows.length === 0) return;

//     this.saving = true;

//     // Step 1: update clear date & status for each selected row
//     const updateCalls = selectedRows.map(row =>
//       this.service.clearDateAndStatus(
//         branchschema,
//         row.payment_number,
//         row.reference_number,
//         row.transaction_no            ?? '',
//         row.tbl_trans_bank_entries_id ?? 0,
//         payment.clear_status
//       ).toPromise()
//     );

//     Promise.all(updateCalls)
//       .then(() => {
//         alert('ClearDate and ClearStatus updated successfully!');

//         const newData = structuredClone(this.details).map((item: any) => {
//           const { selected, ...rest } = item;
//           return {
//             ...rest,
//             clear_date:   item.selected ? null : item.clear_date,
//             clear_status: item.selected ? 'N'  : item.clear_status
//           };
//         });

//         // Step 2: save audit log to backend (no UI display)
//         const payload = [{
//           schemaName: branchschema,
//           loginName:  this.auth.loginName(),
//           loginTime:  new Date().toISOString(),
//           oldData:    structuredClone(this.oldDataSnapshot),
//           newData,
//           reason,
//           changeType: 'CHEQUE_ISSUE'
//         }];

//         this.service.saveData(payload).subscribe({
//           next: () => {
//             this.saving = false;
//             alert('Audit log saved successfully!');
//             this.clearForm();
//           },
//           error: (err: any) => {
//             this.saving = false;
//             console.error(err);
//             alert('Error saving audit log');
//           }
//         });
//       })
//       .catch(err => {
//         this.saving = false;
//         console.error(err);
//         alert('Error updating ClearDate/ClearStatus');
//       });
//   }

//   clearForm(): void {
//     this.paymentForm.reset();
//     this.paymentNumbers = [];
//     this.details        = [];
//     this.showGrid       = false;
//     this.isAnyChecked   = false;
//     this.submitted      = false;
//   }
// }