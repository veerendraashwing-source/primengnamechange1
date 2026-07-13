import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CommonService } from '../commonservice';

@Component({
  selector: 'app-memoreapproval',
  standalone: true,
  templateUrl: './memoreapproval.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
  ]
})
export class Memoreapproval implements OnInit {

  showForm = true;

  branchlist: any[] = [];
  approvedGroupCodes: any[] = [];
  tickets: any[] = [];

  branchschema: string = '';
  branchCode: string = '';
  groupCode: string = '';
  selectedTicketNo: number | null = null;

  memoApprovalForm!: FormGroup;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }


  initForm() {
    this.memoApprovalForm = this.fb.group({
      cao: [{ value: '', disabled: false }, Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],

      approvedDate: [{ value: '', disabled: true }],
      approvedFileName: [{ value: '', disabled: true }],

      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],

      ptypeofoperation: ['UPDATE']
    });
  }

  handleDependencies() {
    let prevCao: any = null;
    let prevGroup: any = null;
    let prevTicket: any = null;

    this.memoApprovalForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        prevCao = value;
        this.resetFromBranch();

        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.memoApprovalForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        prevGroup = value;
        this.resetFromGroup();

        if (value) this.onGroupSelect(value);
      }
    });

    this.memoApprovalForm.get('ticket')?.valueChanges.subscribe(value => {
      if (value !== prevTicket) {
        prevTicket = value;
        this.resetFromTicket();

        if (value) this.onTicketSelect(value);
      }
    });
  }


  resetFromBranch() {
    this.branchschema = '';
    this.branchCode = '';
    this.groupCode = '';
    this.selectedTicketNo = null;

    this.approvedGroupCodes = [];
    this.tickets = [];

    this.memoApprovalForm.patchValue({ group: '', ticket: '', approvedDate: '', approvedFileName: '' });
    this.memoApprovalForm.get('group')?.disable();
    this.memoApprovalForm.get('ticket')?.disable();
  }

  resetFromGroup() {
    this.groupCode = '';
    this.selectedTicketNo = null;
    this.tickets = [];

    this.memoApprovalForm.patchValue({ ticket: '', approvedDate: '', approvedFileName: '' });
    this.memoApprovalForm.get('ticket')?.disable();
  }

  resetFromTicket() {
    this.selectedTicketNo = null;
    this.memoApprovalForm.patchValue({ approvedDate: '', approvedFileName: '' });
  }

  get f() {
    return this.memoApprovalForm.controls;
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }


  onBranchSelect(selected: any) {
    this.branchschema = selected.branch_code;
    this.branchCode = selected.branch_code;
    this.memoApprovalForm.get('group')?.enable();
    this.service.getApprovedGroupCodes(this.branchschema, this.branchCode)
      .subscribe(res => {
        this.approvedGroupCodes = res || [];
      });
  }

  onGroupSelect(groupcode: string) {

    this.groupCode = groupcode;

    this.memoApprovalForm.get('ticket')?.enable();

    this.service.getTickets1(
      this.groupCode,
      this.branchCode,
      this.branchschema
    ).subscribe(res => {

      this.tickets = res || [];

    });

  }

  onTicketSelect(ticketno: number) {
    this.selectedTicketNo = ticketno;

    this.service.getApprovedDetails(this.branchCode,this.groupCode,ticketno).subscribe(res => {
      if (res && res.length > 0) {
        const detail = res[0];
        this.memoApprovalForm.patchValue({
          approvedDate: detail.approved_date
            ? new Date(detail.approved_date).toLocaleDateString('en-IN')
            : '',
          approvedFileName: detail.approved_file_name || ''
        });
      }
    });
  }

  confirmSave() {

    this.memoApprovalForm.markAllAsTouched();

    if (this.memoApprovalForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const groupcode = this.memoApprovalForm.get('group')?.value;
    const selectedTicketNo = this.memoApprovalForm.get('ticket')?.value;

    if (!groupcode || !selectedTicketNo) {
      alert('Please select a valid Group Code and Ticket No.');
      return;
    }

    this.service.removeFirstMemo(
      groupcode,
      Number(selectedTicketNo)
    ).subscribe({

      next: (res: any) => {

        console.log('RemoveFirstMemo Response:', res);

        if (res?.success) {

          const audit = {
            schemaName: this.branchschema,
            loginName: 'admin',
            loginTime: new Date().toISOString(),
            changeType: 'FIRST_MEMO_REAPPROVAL',
            oldData: {
              approvedDate: this.f['approvedDate'].value,
              approvedFileName: this.f['approvedFileName'].value
            },
            newData: {
              firstMemoStatus: null
            },
            reason: this.f['reason'].value
          };

          console.log('Audit Payload:', audit);

          this.service.saveData([audit]).subscribe({

            next: (auditRes: any) => {
              console.log('Audit Saved:', auditRes);

              alert('ReApproval processed and audit saved successfully.');
              this.clear();
            },

            error: (err: any) => {
              console.error('Audit save failed:', err);

              alert('ReApproval done, but audit log failed.');
              this.clear();
            }

          });

        } else {

          alert('ReApproval failed: ' + (res?.message || 'Unknown error'));
        }
      },

      error: (err: any) => {

        console.error('RemoveFirstMemo failed:', err);

        alert('ReApproval failed. Please try again.');
      }

    });
  }

  clear() {
    this.memoApprovalForm.reset({ ptypeofoperation: 'UPDATE' });
    this.resetFromBranch();
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