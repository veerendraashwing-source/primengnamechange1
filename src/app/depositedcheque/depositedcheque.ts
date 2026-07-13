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
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-depositedcheque',
  standalone: true,
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
    ProgressBarModule
  ],
  templateUrl: './depositedcheque.html'
})
export class Depositedcheque implements OnInit {

  showForm = true;
  isCaoDone = false;
  isCancelSaving = signal(false);

  branchList: any[] = [];
  receiptList: any[] = [];

  depositedChequeForm!: FormGroup;

  private selectedReceiptId: any = null;
  private branchCode: string = '';
  private cachedDebitRow: any = null;
  private cachedCreditRow: any = null;
  private contactId: number = 0;
  private interbranchId: number = 0;
  private chitgroupId: number = 0;
  private transactionNo: string = '';
  private bankEntriesId: number = 0;
  private receiptNumber: string = '';

  selectedbranchcode: any;
  selectedreciptno: any;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);
  selectedinterbranchid: any;

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
  }

  initForm(): void {
    const today = new Date();
    const formatted = this.formatDisplayDate(today);

    this.depositedChequeForm = this.fb.group({
      branchName: ['', Validators.required],
      receiptId: [{ value: '', disabled: true }, Validators.required],
      receiptDate: [{ value: formatted, disabled: false }],
      caoName: [''],
      groupCode: [''],
      ticketNo: [''],
      subscriberName: [''],
      chequeNo: [''],
      cramount: [''],
      dramount: [''],
      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200),
      ]],
    });
  }

  branch_change($event: any): void {
    if (!$event) return;

    this.selectedbranchcode = $event.branchCode;
    this.branchCode = $event.branchCode ?? '';
    this.isCaoDone = false;
    this.resetReceiptFields();

    this.service.getChequeGeneralReceiptNumbers($event.branchCode, $event.branchCode)
      .subscribe({
        next: (res: any[]) => {
          this.receiptList = res ?? [];
          this.depositedChequeForm.get('receiptId')?.enable();
        },
        error: () => {
          this.receiptList = [];
          this.depositedChequeForm.get('receiptId')?.disable();
        },
      });
  }

  reveiptnumber_change($event: any): void {
    if (!$event) {
      this.isCaoDone = false;
      this.resetReceiptFields();
      return;
    }

    this.selectedreciptno = $event.general_receipt_number;
    this.selectedReceiptId = $event.general_receipt_number;
    this.selectedinterbranchid = $event.interbranch_id;

    this.service
      .getChequeGeneralReceiptNumberDetails(this.selectedbranchcode, this.selectedreciptno)
      .subscribe({
        next: (detailsRes: any[]) => {
          if (!detailsRes || !detailsRes.length) return;

          const details = detailsRes[0];
          const depRefNo = details.reference_number ?? details.deposited_reference_no ?? '';
          const interbranchToUse = details.interbranch_id ?? 0;
          this.receiptNumber = String(details.receipt_number ?? '');

          this.service
            .getChequeLiveDetails(
              this.selectedreciptno,
              this.selectedbranchcode,
              interbranchToUse,
              depRefNo
            )
            .subscribe({
              next: (res: any[]) => {
                if (!res || !res.length) return;

                const d = res[0];

                this.cachedCreditRow = res.find((x: any) => x.account_type === 'C') ?? null;
                this.cachedDebitRow = res.find((x: any) => x.account_type === 'D') ?? null;
                this.contactId = d.contact_id ?? 0;
                this.interbranchId = d.interbranch_id ?? interbranchToUse;
                this.chitgroupId = Number(d.chitgroup_id ?? 0);
                this.transactionNo = String(d.transaction_no ?? '');
                this.bankEntriesId = Number(d.bank_entries_id ?? 0);

                const rNum = d.receipt_number ?? '';
                const rDate = d.receipt_date ?? '';
                this.isCaoDone = (rNum !== '' && rDate !== '');

                if (this.isCaoDone) {
                  alert('Receipt already done at CAO level. Please contact CAO.');
                  return;
                }

                this.depositedChequeForm.patchValue({
                  caoName: d.caoname ?? '',
                  groupCode: d.groupcode ?? '',
                  ticketNo: d.ticketno ?? '',
                  subscriberName: d.contact_name ?? '',
                  chequeNo: d.deposited_reference_no ?? depRefNo ?? '',
                  cramount: this.cachedCreditRow?.ledger_amount ?? this.cachedCreditRow?.total_paid_amount ?? '',
                  dramount: this.cachedDebitRow?.ledger_amount ?? this.cachedDebitRow?.total_paid_amount ?? '',
                });
              },
              error: () => { },
            });
        },
        error: () => { },
      });
  }

  getBranches(): void {
    this.service.getbranchnames()
      .subscribe((res: any) => (this.branchList = res || []));
  }

  saveGeneralReceiptCancel(): void {
    this.depositedChequeForm.markAllAsTouched();

    if (this.isCaoDone) {
      alert('Receipt Done in CAO level. Please contact CAO.');
      return;
    }

    if (this.depositedChequeForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!confirm('Do you want to cancel this receipt?')) return;

    this.isCancelSaving.set(true);

    const f = this.depositedChequeForm.controls;

    const caoschema = f['caoName'].value ?? '';
    const branchschema = this.branchCode;
    const chitgroupid = this.chitgroupId;
    const ticketno = Number(f['ticketNo'].value ?? 0);
    const contactid = this.contactId;
    const trimnumber = String(this.selectedReceiptId ?? '');
    const referencenumber = String(f['chequeNo'].value ?? '');
    const receiptnumber = this.receiptNumber;
    const bankentriesid = this.bankEntriesId;
    const transactionno = this.transactionNo;

    this.service
      .reverseChequeDeposit(
        caoschema,
        branchschema,
        chitgroupid,
        ticketno,
        contactid,
        trimnumber,
        referencenumber,
        receiptnumber,
        bankentriesid,
        transactionno
      )
      .subscribe({
        next: (res: any) => {
          this.isCancelSaving.set(false);

          const isSuccess =
            res?.success === true ||
            res === 'Success' ||
            (typeof res === 'string' && res.toLowerCase() === 'success');

          if (res?.success === false) {
            alert(res?.message ?? 'Cancel receipt failed. Please try again.');
            return;
          }

          if (isSuccess || res) {
            const audit = this.auth.buildAudit(
              'CHEQUE_LIVE_CANCEL',
              {
                oldData: {
                  general_receipt_number: this.selectedReceiptId,
                  receipt_date: f['receiptDate'].value,
                  branch_code: this.branchCode,
                  caoname: caoschema,
                  groupcode: f['groupCode'].value,
                  ticketno: f['ticketNo'].value,
                  contact_name: f['subscriberName'].value,
                  cheque_number: f['chequeNo'].value,
                  credit_amount: f['cramount'].value,
                  debit_amount: f['dramount'].value,
                  transaction_no: transactionno,
                  receiptnumber: receiptnumber,
                },
                newData: { status: 'CANCELLED', reason: f['reason'].value }
              },
              f['reason'].value
            );

            this.service.saveData([audit]).subscribe({
              next: () => {
                alert('Receipt cancelled successfully and audit saved.');
                this.clearFormFields();
              },
              error: (err: any) => {
                console.error('Audit save failed:', err);
                alert('Receipt cancelled, but audit save failed.');
                this.clearFormFields();
              },
            });
          }
        },
        error: (err: any) => {
          this.isCancelSaving.set(false);
          console.error('ReverseChequeDeposit error:', err);
          alert('Cancel receipt failed. Please try again.');
        },
      });
  }

  resetReceiptFields(): void {
    this.selectedReceiptId = null;
    this.isCaoDone = false;
    this.cachedDebitRow = null;
    this.cachedCreditRow = null;
    this.contactId = 0;
    this.interbranchId = 0;
    this.chitgroupId = 0;
    this.transactionNo = '';
    this.bankEntriesId = 0;
    this.receiptNumber = '';

    this.depositedChequeForm.patchValue({
      receiptId: null,
      caoName: '',
      groupCode: '',
      ticketNo: '',
      subscriberName: '',
      chequeNo: '',
      cramount: '',
      dramount: '',
      reason: '',
    });

    this.depositedChequeForm.get('reason')?.markAsUntouched();
    this.depositedChequeForm.get('receiptId')?.markAsUntouched();
  }

  clearFormFields(): void {
    const currentDate = this.formatDisplayDate(new Date());

    this.isCancelSaving.set(false);
    this.isCaoDone = false;
    this.selectedReceiptId = null;
    this.selectedbranchcode = null;
    this.selectedreciptno = null;
    this.branchCode = '';
    this.cachedDebitRow = null;
    this.cachedCreditRow = null;
    this.contactId = 0;
    this.interbranchId = 0;
    this.chitgroupId = 0;
    this.transactionNo = '';
    this.bankEntriesId = 0;
    this.receiptNumber = '';
    this.receiptList = [];

    this.depositedChequeForm.reset({
      branchName: '',
      receiptId: '',
      receiptDate: currentDate,
      caoName: '',
      groupCode: '',
      ticketNo: '',
      subscriberName: '',
      chequeNo: '',
      cramount: '',
      dramount: '',
      reason: '',
    });

    this.depositedChequeForm.markAsUntouched();
    this.depositedChequeForm.markAsPristine();
    this.depositedChequeForm.get('receiptId')?.disable();
  }

  get f() { return this.depositedChequeForm.controls; }

  isInvalid(name: string): boolean {
    const c = this.depositedChequeForm.get(name);
    return !!(c && c.touched && c.invalid);
  }

  hasError(name: string, error: string): boolean {
    const c = this.depositedChequeForm.get(name);
    return !!(c && c.touched && c.hasError(error));
  }

  preventExceedLength(event: KeyboardEvent, max: number): void {
    const input = event.target as HTMLInputElement;
    if (
      input.value.length >= max &&
      event.key !== 'Backspace' &&
      event.key !== 'Delete' &&
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Tab'
    ) {
      event.preventDefault();
    }
  }

  private formatDisplayDate(d: Date): string {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).replace(/ /g, '-');
  }
}