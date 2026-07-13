import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService } from '../commonservice';

@Component({
  selector: 'app-psincomenotsave',
  standalone: true,
  templateUrl: './psincomenotsave.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    TextareaModule,
    ButtonModule,
    DividerModule,
    ProgressBarModule
  ]
})
export class Psincomenotsave implements OnInit {

  showForm = true;
  isSaving = signal(false);

  branchlist: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  branchschema: any;
  branchCode: any;
  groupCode: any;
  chitgroup_id: any;

  subscriberId: any;
  branch_id: any;

  pSIncomeForm!: FormGroup;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm(): void {
    this.pSIncomeForm = this.fb.group({
      cao: ['', Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],
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

    this.pSIncomeForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const sel = this.branchlist.find(x => x.branch_name === value);
          if (sel) this.onBranchSelect(sel);
        }
      }
    });

    this.pSIncomeForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const sel = this.branch_code.find(x => x.group_Code === value);
          if (sel) this.onGroupSelect(sel);
        }
      }
    });

    this.pSIncomeForm.get('ticket')?.valueChanges.subscribe(value => {
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

  // Branch changed -> reset branch-level + everything downstream
  resetFromBranch(): void {
    this.branchschema = null;
    this.branchCode = null;
    this.branch_id = null;
    this.subscriberId = null;

    this.pSIncomeForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();

    this.pSIncomeForm.get('group')?.disable();
    this.pSIncomeForm.get('ticket')?.disable();

    this.branch_code = [];
    this.tickets = [];
  }

  // Group changed -> reset group-level + everything downstream (branch_id NOT touched)
  resetFromGroup(): void {
    this.groupCode = null;
    this.chitgroup_id = null;

    this.pSIncomeForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.pSIncomeForm.get('ticket')?.disable();
    this.tickets = [];
  }

  // Ticket changed -> only subscriberId resets (branch_id NOT touched)
  resetFromTicket(): void {
    this.subscriberId = null;
  }

  get f() {
    return this.pSIncomeForm.controls;
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
    this.branch_id = event.tbl_mst_branch_configuration_id; // captured here, kept until branch changes again

    this.pSIncomeForm.get('group')?.enable();
    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(event: any): void {
    if (!event) return;
    this.groupCode = event.group_Code;
    this.chitgroup_id = event.chitgroup_id;
    this.pSIncomeForm.get('ticket')?.enable();
    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  onTicketSelect(event: any): void {
    if (!event) return;

    this.service.getSubscriberDetails(
      this.branchschema,
      this.groupCode,
      event.ticketno
    ).subscribe((res: any[]) => {
      if (!res || res.length === 0) return;
      const d = res[0];
      this.subscriberId = d.tbl_mst_subscriber_id;
    });
  }

  confirmSave(): void {
    this.pSIncomeForm.markAllAsTouched();

    if (this.pSIncomeForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!this.subscriberId || !this.branch_id) {
      alert('Subscriber details not loaded. Please re-select the ticket.');
      return;
    }

    if (!confirm('Do you want to save this record?')) return;

    this.isSaving.set(true);

    // Step 1: Insert subscriber income first
    this.service.insertSubscriberIncome(
      this.branchschema,
      this.subscriberId,
      this.branch_id
    ).subscribe({
      next: (result: any) => {

        // adjust this check based on what your API actually returns
        // e.g. result === true, result.success === true, result.status === 'OK', etc.
        if (!result) {
          this.isSaving.set(false);
          alert('Insert failed. Audit not saved.');
          return;
        }

        // Step 2: Build oldData/newData, then audit (matches Groupcodechange pattern)
        const oldData = {
          branchCode: this.branchCode,
          groupCode: this.f['group'].value,
          ticketNo: this.f['ticket'].value,
        };

        const newData = {
          subscriberId: this.subscriberId,
          branch_id: this.branch_id,
        };

        const audit = {
          schemaName: this.branchschema,
          loginName: 'admin',
          loginTime: new Date().toISOString(),
          changeType: 'ps_subscriber_income_CHANGE',
          oldData,
          newData,
          reason: this.f['reason'].value,
        };

        this.service.saveData([audit]).subscribe({
          next: () => {
            this.isSaving.set(false);
            alert('Successfully inserted subscriber income and saved audit.');
            this.clear();
          },
          error: (err: any) => {
            this.isSaving.set(false);
            console.error('Audit save failed:', err);
            alert('Income inserted, but audit save failed.');
            this.clear();
          }
        });
      },
      error: (err: any) => {
        this.isSaving.set(false);
        console.error('InsertSubscriberIncome failed:', err);
        alert('Insert failed. Please try again.');
      }
    });
  }

  clear(): void {
    this.branchschema = null;
    this.branchCode = null;
    this.groupCode = null;
    this.chitgroup_id = null;
    this.subscriberId = null;
    this.branch_id = null;

    this.branch_code = [];
    this.tickets = [];

    this.pSIncomeForm.reset({
      cao: '',
      group: '',
      ticket: '',
      reason: ''
    });

    this.pSIncomeForm.markAsUntouched();
    this.pSIncomeForm.markAsPristine();
    this.pSIncomeForm.get('group')?.disable();
    this.pSIncomeForm.get('ticket')?.disable();
  }
}