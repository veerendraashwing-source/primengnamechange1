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
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-reauctiondate',
  standalone: true,
  templateUrl: './reauctiondate.html',
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
    DatePickerModule,
    IconFieldModule,
    InputIconModule
  ]
})
export class Reauctiondate implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  contactId: any;
  branchschema: any;
  branchCode: any;
  groupCode: any;
  chitgroup_id: any;

  // captured from GetreauctionSubscriberDetails
  subscriberjvno: any;
  fromTicketNo: any;
  toTicketNo: any;
  oldReauctionDate: any;

  // captured from GetreauctionDetails
  bidjvTransactionNos: string[] = [];

  // captured from Getreauctiondivdenddetails
  dividendTransactionNos: string[] = [];

  reAuctionDateForm!: FormGroup;

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  pendingAudit: any = null;
  pendingPayload: any = null;
  pendingOldDate = '';
  pendingNewDate = '';
  pendingReason = '';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm(): void {
    this.reAuctionDateForm = this.fb.group({
      cao: ['', Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],

      subscriberName: [{ value: '', disabled: true }],
      reAuctionDate: [{ value: '', disabled: true }],

      newReAuctionDate: ['', Validators.required],

      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  handleDependencies(): void {
    let prevCao: any = null;
    let prevGroup: any = null;
    let prevTicket: any = null;

    this.reAuctionDateForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const sel = this.branchlist.find(x => x.branch_name === value);
          if (sel) this.onBranchSelect(sel);
        }
      }
    });

    this.reAuctionDateForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const sel = this.branch_code.find(x => x.group_Code === value);
          if (sel) this.onGroupSelect(sel);
        }
      }
    });

    this.reAuctionDateForm.get('ticket')?.valueChanges.subscribe(value => {
      if (value !== prevTicket) {
        this.resetFromTicket();
        prevTicket = value;
        if (value) {
          const sel = this.tickets.find(x => x.ticketno === value);
          if (sel) this.onTicketSelect(sel);
        }
      }
    });
  }

  resetFromBranch(): void {
    this.branchschema = null;
    this.branchCode = null;
    this.groupCode = null;
    this.chitgroup_id = null;

    this.reAuctionDateForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();

    this.reAuctionDateForm.get('group')?.disable();
    this.reAuctionDateForm.get('ticket')?.disable();

    this.branch_code = [];
    this.tickets = [];
  }

  resetFromGroup(): void {
    this.groupCode = null;
    this.chitgroup_id = null;

    this.reAuctionDateForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.reAuctionDateForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket(): void {
    this.contactId = null;
    this.subscriberjvno = null;
    this.fromTicketNo = null;
    this.toTicketNo = null;
    this.oldReauctionDate = null;
    this.bidjvTransactionNos = [];
    this.dividendTransactionNos = [];

    this.reAuctionDateForm.patchValue({
      subscriberName: '',
      reAuctionDate: '',
      newReAuctionDate: ''
    });
  }

  get f() {
    return this.reAuctionDateForm.controls;
  }

  get reasonRequired(): boolean {
    const ctrl = this.f['reason'];
    return !!(ctrl.touched && ctrl.errors?.['required']);
  }

  get reasonMinLength(): boolean {
    const ctrl = this.f['reason'];
    return !!(ctrl.touched && ctrl.errors?.['minlength']);
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

  getBranches(): void {
    this.service.getBranchNames()
      .subscribe(res => this.branchlist = res || []);
  }

  onBranchSelect(event: any): void {
    if (!event) return;

    this.branchschema = event.branch_code;
    this.branchCode = event.branch_code;

    this.reAuctionDateForm.get('group')?.enable();

    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(event: any): void {
    if (!event) return;

    this.groupCode = event.group_Code;
    this.chitgroup_id = event.chitgroup_id;

    this.reAuctionDateForm.get('ticket')?.enable();

    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  onTicketSelect(event: any): void {
    if (!event) return;

    this.service.getReauctionSubscriberDetails(
      this.branchschema,
      this.groupCode,
      event.ticketno,
      this.branchCode
    ).subscribe((res: any[]) => {
      if (!res || res.length === 0) return;

      const d = res[0];

      this.contactId = d.tbl_mst_contact_id;
      this.subscriberjvno = d.transaction_no;
      this.fromTicketNo = d.from_ticketno;
      this.toTicketNo = d.to_ticketno;
      this.oldReauctionDate = d.reauction_date;

      this.reAuctionDateForm.patchValue({
        subscriberName: d.subscriber_name ?? '',
        reAuctionDate: d.reauction_date ?? ''
      });

      this.loadReauctionDetails();
      this.loadDividendDetails();
    });
  }

  loadReauctionDetails(): void {
    this.service.getReauctionDetails(this.branchschema, this.fromTicketNo, this.toTicketNo)
      .subscribe((res: any[]) => {
        this.bidjvTransactionNos = (res || [])
          .map(x => x.bidjv_transaction_no)
          .filter((v, i, arr) => v && arr.indexOf(v) === i);
      });
  }

  loadDividendDetails(): void {
    this.service.getReauctionDividendDetails(this.branchschema, this.subscriberjvno)
      .subscribe((res: any[]) => {
        this.dividendTransactionNos = (res || [])
          .map(x => x.dividend_transaction_number)
          .filter((v, i, arr) => v && arr.indexOf(v) === i);
      });
  }

  private buildQuotedList(list: string[]): string {
    return list.map(v => `'${v}'`).join(',');
  }

  // p-datepicker binds a Date object to the form control; the backend/payload
  // still expects the same 'yyyy-MM-dd' string the native <input type="date"> used to send.
  private formatDate(value: any): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal (replaces the old native confirm())
  save(): void {
    this.reAuctionDateForm.markAllAsTouched();

    if (this.reAuctionDateForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!this.contactId || !this.subscriberjvno) {
      alert('Could not resolve subscriber details for the selected ticket. Please re-select.');
      return;
    }

    const newReAuctionDate = this.formatDate(this.f['newReAuctionDate'].value);
    const reason = this.f['reason'].value;

    this.pendingOldDate = this.oldReauctionDate;
    this.pendingNewDate = newReAuctionDate;
    this.pendingReason  = reason;

    this.pendingPayload = {
      branchschema: this.branchschema,
      chitgroupid: this.chitgroup_id,
      toticketno: this.toTicketNo,
      ticketno: Number(this.f['ticket'].value),
      reauctiondate: newReAuctionDate,
      oldtransactiondate: this.oldReauctionDate,
      createddate: new Date().toISOString(),
      subscriberjvno: this.subscriberjvno,
      dividendtransactionnos: this.buildQuotedList(this.dividendTransactionNos),
      bidjvtransactionnos: this.buildQuotedList(this.bidjvTransactionNos),
    };

    this.pendingAudit = this.auth.buildAudit(
      'REAUCTION_DATE_CHANGE',
      {
        oldData: {
          branchCode: this.branchCode,
          groupCode: this.groupCode,
          ticketNo: this.f['ticket'].value,
          subscriberName: this.f['subscriberName'].value,
          reAuctionDate: this.oldReauctionDate,
        },
        newData: {
          newReAuctionDate: newReAuctionDate,
        }
      },
      reason
    );

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.pendingAudit = null;
    this.pendingPayload = null;
  }

  // Step 2: fires only after user clicks "Yes, Save" in the modal
  confirmSave(): void {
    if (!this.pendingAudit || !this.pendingPayload) return;

    this.showConfirmModal = false;
    this.saving.set(true);

    this.service.updateReauctionTransactionDates(this.pendingPayload).subscribe({
      next: () => {
        this.service.saveData([this.pendingAudit]).subscribe({
          next: () => {
            this.saving.set(false);
            alert('Successfully updated and audit saved.');
            this.clear();
          },
          error: (err: any) => {
            console.error('Audit save failed:', err);
            this.saving.set(false);
            alert('Updated, but audit log failed.');
            this.clear();
          }
        });
      },
      error: (err: any) => {
        console.error('Update failed:', err);
        this.saving.set(false);
        alert('Update failed. Please try again.');
      }
    });
  }

  clear(): void {
    this.branchschema = null;
    this.branchCode = null;
    this.groupCode = null;
    this.chitgroup_id = null;
    this.contactId = null;
    this.subscriberjvno = null;
    this.fromTicketNo = null;
    this.toTicketNo = null;
    this.oldReauctionDate = null;
    this.bidjvTransactionNos = [];
    this.dividendTransactionNos = [];

    this.branch_code = [];
    this.tickets = [];

    this.pendingAudit = null;
    this.pendingPayload = null;

    this.reAuctionDateForm.reset({
      cao: '',
      group: '',
      ticket: '',
      subscriberName: '',
      reAuctionDate: '',
      newReAuctionDate: '',
      reason: ''
    });

    this.reAuctionDateForm.markAsUntouched();
    this.reAuctionDateForm.markAsPristine();
    this.reAuctionDateForm.get('group')?.disable();
    this.reAuctionDateForm.get('ticket')?.disable();
  }
}