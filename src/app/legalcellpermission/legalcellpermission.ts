import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonService } from '../commonservice';

@Component({
  selector: 'app-legalcellpermission',
  standalone: true,
  templateUrl: './legalcellpermission.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    CheckboxModule,
  ]
})
export class Legalcellpermission implements OnInit {

  showForm = true;

  branchlist: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  contactId: any;
  branchschema: any;
  groupCode: any;
  chitgroup_id: any;
  selectedTicketNo: any;
  selectedBranchCode: any;
  subscriberCount: number = 0;

  legalcellpermissionForm!: FormGroup;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm() {
    this.legalcellpermissionForm = this.fb.group({
      cao: ['', Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],
      subscriberName: [''],
      isChecked: [false],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
    });
  }

  get f() {
    return this.legalcellpermissionForm.controls;
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }

  handleDependencies() {
    let prevCao: any = null;
    let prevGroup: any = null;
    let prevTicket: any = null;

    this.legalcellpermissionForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.legalcellpermissionForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const selected = this.branch_code.find(x => x.group_Code === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });

    this.legalcellpermissionForm.get('ticket')?.valueChanges.subscribe(value => {
      if (value !== prevTicket) {
        this.resetFromTicket();
        prevTicket = value;
        if (value) {
          const selected = this.tickets.find(x => x.ticketno === value);
          if (selected) this.onTicketSelect(selected);
        }
      }
    });
  }

  resetFromBranch() {
    this.branchschema = null;
    this.contactId = null;
    this.selectedBranchCode = null;
    this.subscriberCount = 0;

    this.legalcellpermissionForm.patchValue({
      group: '', ticket: '', subscriberName: '', isChecked: false
    });
    this.resetFromGroup();

    this.legalcellpermissionForm.get('group')?.disable();
    this.legalcellpermissionForm.get('ticket')?.disable();

    this.branch_code = [];
    this.tickets = [];
  }

  resetFromGroup() {
    this.groupCode = null;
    this.chitgroup_id = null;
    this.contactId = null;
    this.subscriberCount = 0;

    this.legalcellpermissionForm.patchValue({
      ticket: '', subscriberName: '', isChecked: false
    });
    this.resetFromTicket();

    this.legalcellpermissionForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket() {
    this.contactId = null;
    this.selectedTicketNo = null;
    this.subscriberCount = 0;
    this.legalcellpermissionForm.patchValue({ subscriberName: '', isChecked: false });
  }

  onBranchSelect(event: any) {
    if (!event) return;
    this.branchschema = event.branch_code;
    this.selectedBranchCode = event.branch_code;
    this.legalcellpermissionForm.get('group')?.enable();
    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(event: any) {
    if (!event) return;
    this.groupCode = event.group_Code;
    this.chitgroup_id = event.chitgroup_id;
    this.legalcellpermissionForm.get('ticket')?.enable();
    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  onTicketSelect(event: any) {
    if (!event) return;
    this.selectedTicketNo = event.ticketno;

    this.service.getsubscribername(
      this.branchschema,
      event.ticketno,
      this.groupCode,
      this.selectedBranchCode
    ).subscribe((res: any[]) => {
      const name = res && res.length > 0 ? res[0].subscriber_name : '';
      this.legalcellpermissionForm.patchValue({ subscriberName: name });
    });

    // this.service.getsubscribercount(
    //   this.branchschema,
    //   event.ticketno,
    //   this.groupCode,
    //   this.selectedBranchCode
    // ).subscribe((res: any[]) => {
    //   const count = res && res.length > 0 ? res[0].count : 0;
    //   this.subscriberCount = count;
    //   this.legalcellpermissionForm.patchValue({ isChecked: count === 1 });
    // });

    this.service.getsubscribercount(
     
      event.ticketno,
      this.groupCode
    ).subscribe((res: any[]) => {
      const count = res && res.length > 0 ? res[0].total_count : 0;  
      this.subscriberCount = count;
      this.legalcellpermissionForm.patchValue({ isChecked: count === 1 });
    });
  }

  confirmSave() {
    this.legalcellpermissionForm.markAllAsTouched();

    if (this.legalcellpermissionForm.invalid || !this.selectedTicketNo) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (this.subscriberCount !== 1) {
      alert('Delete operation is only allowed when subscriber count is 1.');
      return;
    }

    const audit = {
      schemaName: this.branchschema,
      loginName: 'admin',
      loginTime: new Date().toISOString(),
      changeType: 'LEGALCELL_PERMISSION',
      reason: this.f['reason'].value
    };

    this.service.deletelegalcell(this.groupCode, this.selectedTicketNo)
      .subscribe({
        next: () => {
          this.service.saveData([audit]).subscribe({
            next: () => {
              alert('Successfully saved and audit recorded');
              this.clear();
            },
            error: (err: any) => {
              console.error('Audit save failed:', err);
              alert('Saved, but audit failed');
            }
          });
        },
        error: (err: any) => {
          console.error('Save failed:', err);
          alert('Save failed');
        }
      });
  }

  clear() {
    this.legalcellpermissionForm.reset();
    this.resetFromBranch();
  }
}