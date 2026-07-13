import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonService } from '../commonservice';

@Component({
  selector: 'app-mvcancel',
  standalone: true,
  templateUrl: './mvcancel.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressBarModule,
    TableModule,
    CheckboxModule,
  ]
})
export class Mvcancel implements OnInit {

  showDetails = false;
  isCaoDone = false;

  branchList: any[] = [];
  mvList: any[] = [];

  mVCancelForm!: FormGroup;

  lstGridRows: {
    tbl_Trans_Payment_Voucher_Details_Id: number;
    payment_Voucher_Id: number;
    contact_Id: number;
    ledger_Amount: number;
    payment_number: string;
    contact_name: string;
    selected: boolean;
    _raw: any;
  }[] = [];

  private pendingGridRows: typeof this.lstGridRows = [];

  isMvSelected    = false;  
  isDetailsReady  = false;  
  isDetailsLoading = false; 

  isCancelSaving = signal(false);

  private selectedMvNumber: string = '';
  private selectedVoucherId: number = 0;
  private selectedPaymentDate: string = '';
  private branchCode: string = '';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  selectedbranchcode: any;
  selectedMvNo: any;

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  }

  private toInputDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  }

  initForm(): void {
    const today = this.formatDate(new Date());

    this.mVCancelForm = this.fb.group({
      branchName: ['', Validators.required],
      mvNoSelect: [{ value: null, disabled: true }, Validators.required],
      currentDate: [{ value: today, disabled: true }],
      paymentDate: [{ value: '', disabled: true }],
      amount:      [{ value: '', disabled: true }],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
    });
  }

  getBranches(): void {
    this.service.getbranchnames()
      .subscribe((res: any) => this.branchList = res || []);
  }

  branch_change($event: any): void {
    this.resetMvAndBelow();

    if (!$event) {
      this.selectedbranchcode = null;
      this.branchCode = '';
      return;
    }

    this.selectedbranchcode = $event.branchCode;
    this.branchCode = $event.branchCode ?? '';

    this.service.getMvNumbers(this.selectedbranchcode, this.branchCode)
      .subscribe({
        next: (res: any[]) => {
          this.mvList = res ?? [];
          this.mVCancelForm.get('mvNoSelect')?.enable();
        },
        error: () => {
          this.mvList = [];
          this.mVCancelForm.get('mvNoSelect')?.disable();
        }
      });
  }

  mvno_change($event: any): void {
    this.resetPaymentFields();

    if (!$event) {
      this.selectedMvNumber  = '';
      this.selectedVoucherId = 0;
      this.isMvSelected      = false;
      return;
    }

    // Mark MV as selected immediately so the button area appears
    this.isMvSelected      = true;
    this.isDetailsLoading  = true;
    this.isDetailsReady    = false;

    this.selectedMvNo      = $event.payment_number;
    this.selectedMvNumber  = $event.payment_number;
    this.selectedVoucherId = $event.tbl_trans_payment_voucher_id ?? 0;

    // Step 1: header — payment_date + total_paid_amount
    this.service.getMvDetails(this.selectedbranchcode, this.branchCode, this.selectedMvNumber)
      .subscribe({
        next: (res: any[]) => {
          if (!res || !res.length) {
            this.resetPaymentFields();
            return;
          }

          const header = res[0];

          // Always take payment_voucher_id from getMvDetails header
          this.selectedVoucherId = header.tbl_trans_payment_voucher_id ?? this.selectedVoucherId;

          this.selectedPaymentDate = header.payment_date
            ? new Date(header.payment_date).toISOString().split('T')[0]
            : '';

          this.mVCancelForm.patchValue({
            paymentDate: this.toInputDate(header.payment_date),
            amount:      header.total_paid_amount ?? '',
          });

          // Step 2: fetch line items in background, store in pendingGridRows
          this.service.getMvNumberDetails(
            this.selectedbranchcode,
            this.branchCode,
            this.selectedMvNumber,
            this.selectedVoucherId
          ).subscribe({
            next: (details: any[]) => {
              this.isDetailsLoading = false;

              if (!details || !details.length) {
                this.pendingGridRows = [];
                this.isDetailsReady  = false;
                return;
              }

              const seen = new Set<number>();
              const rows: typeof this.lstGridRows = [];

              details
                .filter((d: any) => d.tbl_trans_payment_voucher_details_id > 0 && d.ledger_amount > 0)
                .forEach((d: any) => {
                  const detailId = d.tbl_trans_payment_voucher_details_id;
                  if (seen.has(detailId)) return;
                  seen.add(detailId);
                  rows.push({
                    tbl_Trans_Payment_Voucher_Details_Id: detailId,
                    payment_Voucher_Id: d.tbl_trans_payment_voucher_id ?? this.selectedVoucherId,
                    contact_Id:    d.contact_id    ?? 0,
                    ledger_Amount: d.ledger_amount ?? 0,
                    payment_number: d.payment_number ?? this.selectedMvNumber,
                    contact_name:   d.contact_name   ?? '',
                    selected: false,
                    _raw: d,
                  });
                });

              // Store in pending — grid stays hidden until user clicks Show Details
              this.pendingGridRows = rows;
              this.isDetailsReady  = rows.length > 0;
            },
            error: () => {
              this.isDetailsLoading = false;
              this.pendingGridRows  = [];
              this.isDetailsReady   = false;
            }
          });
        },
        error: () => {
          this.isDetailsLoading = false;
          this.lstGridRows  = [];
          this.showDetails  = false;
        }
      });
  }

  /** Called by "Show Details" button — reveals the grid */
  showVoucherDetails(): void {
    this.lstGridRows = this.pendingGridRows;
    this.showDetails = this.lstGridRows.length > 0;
  }

  getSelectedDebitTotal(): number {
    return this.lstGridRows
      .filter(r => r.selected && r.ledger_Amount > 0)
      .reduce((sum, r) => sum + r.ledger_Amount, 0);
  }

  saveMvCancel(): void {
    this.mVCancelForm.markAllAsTouched();

    if (this.mVCancelForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const selectedRows = this.lstGridRows.filter(r => r.selected);
    if (!selectedRows.length) {
      alert('Please select at least one row to cancel.');
      return;
    }

    if (!confirm('Do you want to cancel this MV voucher?')) return;

    this.isCancelSaving.set(true);
    let completedCount = 0;
    let hasError = false;

    selectedRows.forEach(row => {
      this.service.reverseMvVoucher(
        this.branchCode,
        this.selectedMvNumber,
        this.selectedPaymentDate,
        this.selectedVoucherId,
        row.contact_Id,
        row.tbl_Trans_Payment_Voucher_Details_Id
      ).subscribe({
        next: (res: any) => {
          if (hasError) return;
          completedCount++;

          if (res?.success === false) {
            hasError = true;
            alert(res?.message ?? 'Cancel failed for: ' + row.payment_number);
            this.isCancelSaving.set(false);
            return;
          }

          if (completedCount === selectedRows.length) {
            const f = this.mVCancelForm.controls;
            const audit = {
              schemaName:  this.branchCode,
              loginName:   'admin',
              loginTime:   new Date().toISOString(),
              changeType:  'MV_CANCEL',
              oldData: {
                payment_number:    this.selectedMvNumber,
                payment_date:      this.selectedPaymentDate,
                branch_code:       this.branchCode,
                total_paid_amount: f['amount'].value,
                cancelled_rows: selectedRows.map(r => ({
                  contact_name:   r.contact_name,
                  payment_number: r.payment_number,
                  ledger_amount:  r.ledger_Amount,
                  tbl_trans_payment_voucher_details_id: r.tbl_Trans_Payment_Voucher_Details_Id,
                })),
              },
              newData: { status: 'CANCELLED' },
              reason: f['reason'].value,
            };

            this.service.saveData([audit]).subscribe({
              next: () => {
                this.isCancelSaving.set(false);
                alert('MV voucher cancelled successfully and audit saved.');
                this.clearFormFields();
              },
              error: (err: any) => {
                this.isCancelSaving.set(false);
                console.error('Audit save failed:', err);
                alert('MV voucher cancelled, but audit save failed.');
                this.clearFormFields();
              }
            });
          }
        },
        error: (err: any) => {
          if (hasError) return;
          hasError = true;
          this.isCancelSaving.set(false);
          console.error('ReverseMvVoucher error:', err);
          alert('Cancel failed. Please try again.');
        }
      });
    });
  }

  // ─── Reset helpers ────────────────────────────────────────────────────────────

  private resetMvAndBelow(): void {
    this.selectedMvNumber    = '';
    this.selectedVoucherId   = 0;
    this.selectedPaymentDate = '';
    this.selectedMvNo        = null;
    this.lstGridRows         = [];
    this.pendingGridRows     = [];
    this.showDetails         = false;
    this.isMvSelected        = false;
    this.isDetailsReady      = false;
    this.isDetailsLoading    = false;
    this.mvList              = [];

    const mvCtrl = this.mVCancelForm.get('mvNoSelect');
    mvCtrl?.setValue(null);
    mvCtrl?.markAsUntouched();
    mvCtrl?.disable();

    this.mVCancelForm.patchValue({ paymentDate: '', amount: '', reason: '' });
    this.mVCancelForm.get('reason')?.markAsUntouched();
  }

  private resetPaymentFields(): void {
    this.selectedPaymentDate = '';
    this.lstGridRows         = [];
    this.pendingGridRows     = [];
    this.showDetails         = false;
    this.isDetailsReady      = false;
    this.isDetailsLoading    = false;
    this.mVCancelForm.patchValue({ paymentDate: '', amount: '' });
  }

  clearFormFields(): void {
    const today = this.formatDate(new Date());

    this.isCancelSaving.set(false);
    this.isCaoDone           = false;
    this.showDetails         = false;
    this.isMvSelected        = false;
    this.isDetailsReady      = false;
    this.isDetailsLoading    = false;
    this.selectedMvNumber    = '';
    this.selectedVoucherId   = 0;
    this.selectedPaymentDate = '';
    this.selectedbranchcode  = null;
    this.selectedMvNo        = null;
    this.branchCode          = '';
    this.lstGridRows         = [];
    this.pendingGridRows     = [];
    this.mvList              = [];

    this.mVCancelForm.get('mvNoSelect')?.disable();

    this.mVCancelForm.reset({
      branchName:  null,
      mvNoSelect:  null,
      currentDate: today,
      paymentDate: '',
      amount:      '',
      reason:      '',
    });

    this.mVCancelForm.markAsUntouched();
    this.mVCancelForm.markAsPristine();
  }

  // ─── Template helpers ─────────────────────────────────────────────────────────

  get f() { return this.mVCancelForm.controls; }

  isInvalid(name: string): boolean {
    const c = this.mVCancelForm.get(name);
    return !!(c && c.touched && c.invalid);
  }

  hasError(name: string, error: string): boolean {
    const c = this.mVCancelForm.get(name);
    return !!(c && c.touched && c.hasError(error));
  }

  preventExceedLength(event: KeyboardEvent, max: number): void {
    const input = event.target as HTMLInputElement;
    if (
      input.value.length >= max &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)
    ) {
      event.preventDefault();
    }
  }
}