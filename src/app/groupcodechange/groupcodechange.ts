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

@Component({
  selector: 'app-groupcodechange',
  standalone: true,
  templateUrl: './groupcodechange.html',
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
  ]
})
export class Groupcodechange implements OnInit {

  showForm = true;
  isSaving = signal(false);

  branchlist:      any[] = [];
  branch_code:     any[] = [];
  tickets:         any[] = [];
  newGroupTickets: any[] = [];

  paymentAdjustmentDetails: any = null;

  contactId:    any;
  branchschema: any;
  branchCode:   any;
  groupCode:    any;
  chitgroup_id: any;

  newChitgroupId:    any;
  newContactId:      any;
  newSubscriberName: string = '';
  newTicketNo:       any;
  bpoChequeInformationId:       any;
  bpoChequeInformationDetailId: any;
  chitPaymentAdjustmentId:      any;
  adjustmentAmount:             any;

  changForm!: FormGroup;

  private fb      = inject(FormBuilder);
  private service = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }


  initForm(): void {
    this.changForm = this.fb.group({
      cao:    ['', Validators.required],
      group:  [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],

      subscriberName:        [''],
      adjustmentAmount:      [''],
      paymentAdjustmentType: [''],
      otherAdjustmentTypeId: [''],
      chequeNumber:          [''],

      newGroup:  [{ value: '', disabled: true }, Validators.required],
      newTicket: [{ value: '', disabled: true }, Validators.required],

      newName: [''],

      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],

      ptypeofoperation: ['UPDATE']
    });
  }


  handleDependencies(): void {
    let prevCao:       any = null;
    let prevGroup:     any = null;
    let prevTicket:    any = null;
    let prevNewGroup:  any = null;
    let prevNewTicket: any = null;

    this.changForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const sel = this.branchlist.find(x => x.branch_name === value);
          if (sel) this.onBranchSelect(sel);
        }
      }
    });

    this.changForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const sel = this.branch_code.find(x => x.group_Code === value);
          if (sel) this.onGroupSelect(sel);
        }
      }
    });

    this.changForm.get('ticket')?.valueChanges.subscribe(value => {
      if (value !== prevTicket) {
        this.resetFromTicket();
        prevTicket = value;
        if (value) {
          const sel = this.tickets.find(x => x.ticketno === value);
          if (sel) this.onTicketSelect(sel);
        }
      }
    });

    this.changForm.get('newGroup')?.valueChanges.subscribe(value => {
      if (value !== prevNewGroup) {
        this.resetFromNewGroup();
        prevNewGroup = value;
        if (value) {
          const sel = this.branch_code.find(x => x.group_Code === value);
          if (sel) this.onNewGroupSelect(sel);
        }
      }
    });

    this.changForm.get('newTicket')?.valueChanges.subscribe(value => {
      if (value !== prevNewTicket) {
        this.resetFromNewTicket();
        prevNewTicket = value;
        if (value) {
          const sel = this.newGroupTickets.find(x => x.ticketno === value);
          if (sel) this.onNewTicketSelect(sel);
        }
      }
    });
  }


  resetFromBranch(): void {
    this.branchschema                 = null;
    this.branchCode                   = null;
    this.contactId                    = null;
    this.newChitgroupId               = null;
    this.newContactId                 = null;
    this.newSubscriberName            = '';
    this.newTicketNo                  = null;
    this.paymentAdjustmentDetails     = null;
    this.bpoChequeInformationId       = null;
    this.bpoChequeInformationDetailId = null;
    this.chitPaymentAdjustmentId      = null;
    this.adjustmentAmount             = null;

    this.changForm.patchValue({ group: '', ticket: '', newGroup: '', newTicket: '' });
    this.resetFromGroup();
    this.resetFromNewGroup();

    this.changForm.get('group')?.disable();
    this.changForm.get('ticket')?.disable();
    this.changForm.get('newGroup')?.disable();
    this.changForm.get('newTicket')?.disable();

    this.branch_code     = [];
    this.tickets         = [];
    this.newGroupTickets = [];
  }

  resetFromGroup(): void {
    this.groupCode    = null;
    this.chitgroup_id = null;
    this.contactId    = null;

    this.changForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.changForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket(): void {
    this.paymentAdjustmentDetails     = null;
    this.bpoChequeInformationId       = null;
    this.bpoChequeInformationDetailId = null;
    this.chitPaymentAdjustmentId      = null;
    this.adjustmentAmount             = null;

    this.changForm.patchValue({
      subscriberName:        '',
      adjustmentAmount:      '',
      paymentAdjustmentType: '',
      otherAdjustmentTypeId: '',
      chequeNumber:          '',
    });
  }

  resetFromNewGroup(): void {
    this.newChitgroupId    = null;
    this.newContactId      = null;
    this.newSubscriberName = '';
    this.newTicketNo       = null;

    this.changForm.patchValue({ newTicket: '', newName: '' });
    this.changForm.get('newTicket')?.disable();
    this.newGroupTickets = [];
  }

  resetFromNewTicket(): void {
    this.newContactId      = null;
    this.newSubscriberName = '';
    this.newTicketNo       = null;
    this.changForm.patchValue({ newName: '' });
  }

  get f() {
    return this.changForm.controls;
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
    this.branchCode   = event.branch_code;

    this.changForm.get('group')?.enable();
    this.changForm.get('newGroup')?.enable();

    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }


  onGroupSelect(event: any): void {
    if (!event) return;

    this.groupCode    = event.group_Code;
    this.chitgroup_id = event.chitgroup_id;

    this.changForm.get('ticket')?.enable();

    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  
  onTicketSelect(event: any): void {
    if (!event) return;

    this.service.getPaymentAdjustmentDetails(
      this.branchschema,
      this.groupCode,
      event.ticketno
    ).subscribe((res: any[]) => {
      if (!res || res.length === 0) return;

      const d = res[0];
      this.paymentAdjustmentDetails     = d;
      this.bpoChequeInformationId       = d.tbl_trans_bpo_cheques_information_details_id;
      this.bpoChequeInformationDetailId = d.tbl_trans_bpo_cheques_information_details_id;
      this.chitPaymentAdjustmentId      = d.tbl_trans_chit_payment_adjustments_id;
      this.adjustmentAmount             = d.adjustment_amount;

      this.changForm.patchValue({
        subscriberName:        d.subscriber_name          ?? '',
        adjustmentAmount:      d.adjustment_amount        ?? '',
        paymentAdjustmentType: d.payment_adjustment_type  ?? '',
        otherAdjustmentTypeId: d.other_adjustment_type_id ?? '',
        chequeNumber:          d.cheque_number             ?? '',
      });
    });
  }


  onNewGroupSelect(event: any): void {
    if (!event) return;

    this.newChitgroupId = event.chitgroup_id;

    this.changForm.get('newTicket')?.enable();

    this.service.getTickets(this.branchschema, event.group_Code)
      .subscribe(res => this.newGroupTickets = res || []);
  }

  onNewTicketSelect(event: any): void {
    if (!event) return;

    this.newTicketNo = event.ticketno;

    this.newContactId = event.tbl_mst_contact_id ?? event.tbl_mst_contact_id ?? event.tbl_mst_contact_id ?? null;

    this.service.getSubscriberDetails(
      this.branchschema,
      this.f['newGroup'].value,
      event.ticketno
    ).subscribe((res: any[]) => {
      if (!res || res.length === 0) return;

      const d = res[0];

      if (d.tbl_mst_contact_id && d.tbl_mst_contact_id !== 0) {
        this.newContactId = d.tbl_mst_contact_id;
      }

      this.newSubscriberName = d.subscriber_name ?? '';

      this.changForm.patchValue({
        newName: d.subscriber_name ?? '',
      });
    });
  }

  confirmSave(): void {
    this.changForm.markAllAsTouched();

    if (this.changForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!this.bpoChequeInformationDetailId || !this.chitPaymentAdjustmentId) {
      alert('No payment adjustment details found for the selected existing ticket.');
      return;
    }

    if (!this.newContactId) {
      alert('Could not resolve contact for the selected new ticket. Please re-select.');
      return;
    }

    if (!confirm('Do you want to save this Group Code change?')) return;

    this.isSaving.set(true);

    const payload = {
      branchschema:                  this.branchCode,
      adjustmentChitGroupId:         this.newChitgroupId,
      adjustmentTicketNo:            Number(this.newTicketNo),
      adjustmentContactId:           this.newContactId,
      bpoChequeInformationIds:       String(this.bpoChequeInformationId       ?? ''),
      bpoChequeInformationDetailIds: String(this.bpoChequeInformationDetailId ?? ''),
      adjustmentAmount:              this.adjustmentAmount,
      chitPaymentAdjustmentIds:      String(this.chitPaymentAdjustmentId      ?? ''),
    };

    this.service.updateAdjustmentDetails(payload)
      .subscribe({
        next: () => {

          const oldData = {
            branchCode:                   this.branchCode,
            groupCode:                    this.f['group'].value,
            ticketNo:                     this.f['ticket'].value,
            subscriberName:               this.f['subscriberName'].value,
            adjustmentAmount:             this.f['adjustmentAmount'].value,
            paymentAdjustmentType:        this.f['paymentAdjustmentType'].value,
            otherAdjustmentTypeId:        this.f['otherAdjustmentTypeId'].value,
            chequeNumber:                 this.f['chequeNumber'].value,
            bpoChequeInformationId:       this.bpoChequeInformationId,
            bpoChequeInformationDetailId: this.bpoChequeInformationDetailId,
            chitPaymentAdjustmentId:      this.chitPaymentAdjustmentId,
          };

          const newData = {
            groupCode:      this.f['newGroup'].value,
            ticketNo:       this.newTicketNo,
            subscriberName: this.newSubscriberName,
            contactId:      this.newContactId,
            chitgroupId:    this.newChitgroupId,
          };

          const audit = {
            schemaName: this.branchschema,
            loginName:  'admin',
            loginTime:  new Date().toISOString(),
            changeType: 'CHIT_PAYMENT_ADJUSTMENT_GROUP_CODE_CHANGE',
            oldData,
            newData,
            reason: this.f['reason'].value,
          };

          this.service.saveData([audit]).subscribe({
            next: () => {
              this.isSaving.set(false);
              alert('Successfully updated and audit saved.');
              this.clear();
            },
            error: (err: any) => {
              this.isSaving.set(false);
              console.error('Audit save failed:', err);
              alert('Updated, but audit log failed.');
              this.clear();
            }
          });
        },
        error: (err: any) => {
          this.isSaving.set(false);
          console.error('Update failed:', err);
          alert('Update failed. Please try again.');
        }
      });
  }

  clear(): void {
    this.branchschema                 = null;
    this.branchCode                   = null;
    this.groupCode                    = null;
    this.chitgroup_id                 = null;
    this.contactId                    = null;
    this.newChitgroupId               = null;
    this.newContactId                 = null;
    this.newSubscriberName            = '';
    this.newTicketNo                  = null;
    this.paymentAdjustmentDetails     = null;
    this.bpoChequeInformationId       = null;
    this.bpoChequeInformationDetailId = null;
    this.chitPaymentAdjustmentId      = null;
    this.adjustmentAmount             = null;

    this.branch_code     = [];
    this.tickets         = [];
    this.newGroupTickets = [];

    this.changForm.reset({
      cao:                   '',
      group:                 '',
      ticket:                '',
      subscriberName:        '',
      adjustmentAmount:      '',
      paymentAdjustmentType: '',
      otherAdjustmentTypeId: '',
      chequeNumber:          '',
      newGroup:              '',
      newTicket:             '',
      newName:               '',
      reason:                '',
      ptypeofoperation:      'UPDATE'
    });

    this.changForm.markAsUntouched();
    this.changForm.markAsPristine();
    this.changForm.get('group')?.disable();
    this.changForm.get('ticket')?.disable();
    this.changForm.get('newGroup')?.disable();
    this.changForm.get('newTicket')?.disable();
  }
}