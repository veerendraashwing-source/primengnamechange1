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
  selector: 'app-generalreceiptcancel',
  standalone: true,
  templateUrl: './generalreceiptcancel.html',
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
export class Generalreceiptcancel implements OnInit {

  showDetails = false;
  isCaoDone = false;
  isCancelSaving = signal(false);

  branchList: any[] = [];
  receiptList: any[] = [];

  generalReceiptCancelForm!: FormGroup;

  lstGridRows: {
    tbl_Trans_Payment_Voucher_Details_Id: number;
    payment_Voucher_Id: number;
    detail_Debit_Account_Id: number;
    detail_Contact_Id: number;
    contact_Id: number;
    ledger_Amount: number;
    payment_number: string;
    contact_name: string;
    selected: boolean;
    _raw: any;
  }[] = [];

  private selectedReceiptId: any = null;
  private branchCode: string = '';
  private commonReceiptNumber: number = 0;
  private cachedDebitRow: any = null;
  private cachedCreditRow: any = null;
  private contactId: number = 0;
  private interbranchId: number = 0;
  private caoName: string = '';

  private fb      = inject(FormBuilder);
  private service = inject(CommonService);

  selectedbranchcode: any;
  selectedreciptno: any;

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
  }

  initForm(): void {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');

    this.generalReceiptCancelForm = this.fb.group({
      branchName:     ['', Validators.required],
      receiptId:      [{ value: '', disabled: true }, Validators.required],
      receiptDate:    [{ value: formatted, disabled: false }],
      caoName:        [''],
      groupCode:      [''],
      ticketNo:       [''],
      subscriberName: [''],
      mvNo:           [''],
      amount:         [''],
      reason:         ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],
    });
  }

  branch_change($event: any): void {
    if (!$event) return;

    this.selectedbranchcode = $event.branchCode;
    this.branchCode         = $event.branchCode ?? '';
    this.isCaoDone          = false;
    this.resetReceiptFields();

    this.service.getGeneralReceiptNumbers($event.branchCode, $event.branchCode)
      .subscribe({
        next: (res: any[]) => {
          this.receiptList = res ?? [];
          this.generalReceiptCancelForm.get('receiptId')?.enable();
        },
        error: () => {
          this.receiptList = [];
          this.generalReceiptCancelForm.get('receiptId')?.disable();
        }
      });
  }

  reveiptnumber_change($event: any): void {
    if (!$event) {
      this.isCaoDone = false;
      this.resetReceiptFields();
      return;
    }

    this.selectedreciptno  = $event.general_receipt_number;
    this.selectedReceiptId = $event.general_receipt_number;
    this.interbranchId     = $event.interbranch_id ?? 0;

    this.generalReceiptCancelForm.patchValue({
      groupCode:      $event.groupcode              ?? '',
      ticketNo:       $event.ticketno               ?? '',
      subscriberName: $event.contact_name           ?? '',
      mvNo:           $event.deposited_reference_no ?? '',
      amount:         $event.total_paid_amount      ?? '',
    });

    // Reset grid and details until Get is clicked
    this.showDetails = false;
    this.lstGridRows = [];
    this.isCaoDone   = false;
  }

  getReceiptDetails(): void {
    if (!this.selectedreciptno || !this.selectedbranchcode) return;

    this.service.getGeneralReceiptDetails(
      this.selectedbranchcode,
      this.selectedreciptno,
      this.interbranchId
    ).subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          const d = res[0];

          this.commonReceiptNumber = d.comman_receipt_number ?? 0;
          this.contactId           = d.contact_id            ?? 0;
          this.caoName             = d.caoname               ?? '';

          const rNum  = d.receipt_number ?? '';
          const rDate = d.receipt_date   ?? '';
          this.isCaoDone = (rNum !== '' && rDate !== '');

          if (this.isCaoDone) {
            alert('Receipt already done at CAO level. Please contact CAO.');
            this.showDetails = false;
            return;
          }

          this.generalReceiptCancelForm.patchValue({
            caoName:        d.caoname                ?? '',
            groupCode:      d.groupcode              ?? '',
            ticketNo:       d.ticketno               ?? 0,
            subscriberName: d.contact_name           ?? '',
            mvNo:           d.deposited_reference_no ?? '',
          });

          const depRefNo = d.deposited_reference_no ?? '';
          if (depRefNo) {
            this.service.getGeneralReceiptAmount(this.selectedbranchcode, depRefNo)
              .subscribe({
                next: (amtRes: any[]) => {
                  if (amtRes && amtRes.length > 0) {
                    this.cachedDebitRow  = amtRes.find((r: any) => r.debitamount  > 0) ?? null;
                    this.cachedCreditRow = amtRes.find((r: any) => r.creditamount > 0) ?? null;

                    const totalDebit = amtRes
                      .filter((r: any) => r.debitamount > 0)
                      .reduce((sum: number, r: any) => sum + (r.debitamount ?? 0), 0);

                    this.generalReceiptCancelForm.patchValue({
                      amount: totalDebit > 0
                        ? totalDebit
                        : (amtRes[0].total_paid_amount ?? '')
                    });
                  }
                },
                error: () => {
                  this.cachedDebitRow  = null;
                  this.cachedCreditRow = null;
                }
              });
          }

          this.loadVoucherGrid(this.branchCode, this.selectedReceiptId, this.contactId);
          this.showDetails = true;
        }
      },
      error: () => {
        this.showDetails = false;
        this.lstGridRows = [];
      }
    });
  }

  private loadVoucherGrid(branchSchema: string, receiptNumber: string, contactId: number): void {
    this.service.getReceiptVoucherTransactions(this.selectedbranchcode, receiptNumber, contactId)
      .subscribe({
        next: (res: any[]) => {
          if (!res || !res.length) { this.lstGridRows = []; return; }

          const seen   = new Set<number>();
          const unique = res.filter((r: any) => {
            const id = r.tbl_Trans_Payment_Voucher_Details_Id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          this.lstGridRows = unique.map((r: any) => ({
            tbl_Trans_Payment_Voucher_Details_Id: r.tbl_Trans_Payment_Voucher_Details_Id ?? 0,
            payment_Voucher_Id:                  r.payment_Voucher_Id                   ?? 0,
            detail_Debit_Account_Id:             r.detail_Debit_Account_Id              ?? 0,
            detail_Contact_Id:                   r.detail_Contact_Id                    ?? 0,
            contact_Id:                          r.contact_Id                           ?? 0,
            ledger_Amount:                       r.ledger_Amount                        ?? 0,
            payment_number:                      r.payment_number                       ?? '',
            contact_name:                        r.contact_name                         ?? '',
            selected: false,
            _raw: r,
          }));
        },
        error: () => { this.lstGridRows = []; }
      });
  }

  getBranches(): void {
    this.service.getbranchnames()
      .subscribe((res: any) => this.branchList = res || []);
  }

  getSelectedDebitTotal(): number {
    return this.lstGridRows
      .filter(r => r.selected && r.ledger_Amount > 0)
      .reduce((sum, r) => sum + r.ledger_Amount, 0);
  }

  saveGeneralReceiptCancel(): void {
    this.generalReceiptCancelForm.markAllAsTouched();

    if (this.isCaoDone) {
      alert('Receipt Done in CAO level. Please contact CAO.');
      return;
    }

    if (!this.selectedReceiptId || this.generalReceiptCancelForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!confirm('Do you want to cancel this receipt?')) return;

    this.isCancelSaving.set(true);

    const f     = this.generalReceiptCancelForm.controls;
    const first = this.cachedDebitRow ?? this.cachedCreditRow ?? {};

    const formatDate = (d: any): string => {
      if (!d) return new Date().toISOString().split('T')[0];
      if (d instanceof Date) return d.toISOString().split('T')[0];
      const parts = String(d).split(' ')[0].split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        const monthMap: Record<string, string> = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        return `${parts[2]}-${monthMap[parts[1]] ?? parts[1]}-${parts[0]}`;
      }
      return String(d).split('T')[0];
    };

    const receiptDateFormatted = formatDate(
      first.payment_date ?? f['receiptDate'].value
    );

    this.service.reverseReceipt(
      this.branchCode,
      f['groupCode'].value ?? '',
      f['ticketNo'].value  ?? 0,
      first.contact_id ? Number(first.contact_id) : 0,
      String(this.selectedReceiptId ?? ''),
      this.commonReceiptNumber,
      this.cachedDebitRow?.payment_number                       ?? '',
      receiptDateFormatted,
      this.cachedDebitRow?.tbl_trans_payment_voucher_id         ?? 0,
      this.cachedDebitRow?.tbl_trans_payment_voucher_details_id ?? 0,
      this.caoName ?? ''
    ).subscribe({
      next: (res: any) => {
        this.isCancelSaving.set(false);

        if (res?.success === true) {
          alert(res.message ?? 'Receipt cancelled successfully.');
          this.clearFormFields();
        } else if (res?.success === false) {
          alert(res?.message ?? 'Cancel receipt failed. Please try again.');
        } else {
          alert('Receipt cancelled successfully.');
          this.clearFormFields();
        }
      },
      error: (err: any) => {
        this.isCancelSaving.set(false);
        console.error('saveReceiptCancel error:', err);
        alert('Cancel receipt failed. Please try again.');
      }
    });
  }

  resetReceiptFields(): void {
    this.selectedReceiptId   = null;
    this.selectedreciptno    = null;
    this.isCaoDone           = false;
    this.showDetails         = false;
    this.commonReceiptNumber = 0;
    this.cachedDebitRow      = null;
    this.cachedCreditRow     = null;
    this.lstGridRows         = [];
    this.contactId           = 0;
    this.interbranchId       = 0;
    this.caoName             = '';
    this.generalReceiptCancelForm.patchValue({
      receiptId: null, caoName: '', groupCode: '', ticketNo: '',
      subscriberName: '', mvNo: '', amount: '', reason: '',
    });
    this.generalReceiptCancelForm.get('reason')?.markAsUntouched();
    this.generalReceiptCancelForm.get('receiptId')?.markAsUntouched();
  }

  clearFormFields(): void {
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');

    this.isCancelSaving.set(false);
    this.isCaoDone           = false;
    this.showDetails         = false;
    this.selectedReceiptId   = null;
    this.selectedbranchcode  = null;
    this.selectedreciptno    = null;
    this.branchCode          = '';
    this.commonReceiptNumber = 0;
    this.cachedDebitRow      = null;
    this.cachedCreditRow     = null;
    this.contactId           = 0;
    this.interbranchId       = 0;
    this.caoName             = '';
    this.lstGridRows         = [];
    this.receiptList         = [];

    this.generalReceiptCancelForm.reset({
      branchName: '', receiptId: '', receiptDate: currentDate,
      caoName: '', groupCode: '', ticketNo: '',
      subscriberName: '', mvNo: '', amount: '', reason: '',
    });

    this.generalReceiptCancelForm.markAsUntouched();
    this.generalReceiptCancelForm.markAsPristine();
    this.generalReceiptCancelForm.get('receiptId')?.disable();
  }

  get f() { return this.generalReceiptCancelForm.controls; }

  isInvalid(name: string): boolean {
    const c = this.generalReceiptCancelForm.get(name);
    return !!(c && c.touched && c.invalid);
  }

  hasError(name: string, error: string): boolean {
    const c = this.generalReceiptCancelForm.get(name);
    return !!(c && c.touched && c.hasError(error));
  }

  preventExceedLength(event: KeyboardEvent, max: number): void {
    const input = event.target as HTMLInputElement;
    if (
      input.value.length >= max &&
      event.key !== 'Backspace' && event.key !== 'Delete' &&
      event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' &&
      event.key !== 'Tab'
    ) { event.preventDefault(); }
  }
}