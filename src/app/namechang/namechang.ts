

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-namechang',
  standalone: true,
  templateUrl: './namechang.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MessageModule,
    DividerModule,
    ProgressBarModule,
    TagModule
  ]
})
export class Namechang implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  contactId: any;
  branchschema: any;
  groupCode: any;
  chitgroup_id: any;
  chit_status: any;

  nameChangeForm!: FormGroup;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm() {
    this.nameChangeForm = this.fb.group({
      cao: ['', Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],

      oldName: [''],
      oldSurname: [''],
      oldMailingName: [''],
      oldStatus: [''],

      newName: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-z]*$/),
        Validators.maxLength(50)
      ]],

      newSurname: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-z]*$/),
        Validators.maxLength(20)
      ]],

      newMailingName: [''],

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

    this.nameChangeForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;

        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.nameChangeForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;

        if (value) {
          const selected = this.branch_code.find(x => x.group_Code === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });

    this.nameChangeForm.get('ticket')?.valueChanges.subscribe(value => {
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

    this.nameChangeForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();

    this.nameChangeForm.get('group')?.disable();
    this.nameChangeForm.get('ticket')?.disable();

    this.branch_code = [];
    this.tickets = [];
  }

  resetFromGroup() {
    this.groupCode = null;
    this.chitgroup_id = null;
    this.contactId = null;

    this.nameChangeForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.nameChangeForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket() {
    this.contactId = null;

    this.nameChangeForm.patchValue({
      oldName: '',
      oldSurname: '',
      oldMailingName: '',
      oldStatus: '',
      newName: '',
      newSurname: '',
      newMailingName: ''
    });
  }

  get f() {
    return this.nameChangeForm.controls;
  }

  onNameInput(controlName: string, maxLength: number) {
    let value = this.f[controlName].value || '';

    value = value.replace(/[^A-Za-z]/g, '');

    if (value.length > maxLength) {
      value = value.substring(0, maxLength);
    }

    this.f[controlName].setValue(value, { emitEvent: false });
  }

  concatmailing() {
    const name = this.f['newName'].value || '';
    const surname = this.f['newSurname'].value || '';
    this.f['newMailingName'].setValue(`${name} ${surname}`.trim());
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }

  onBranchSelect(event: any) {
    if (!event) return;

    this.branchschema = event.branch_code;
    this.nameChangeForm.get('group')?.enable();

    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(event: any) {
    if (!event) return;

    this.groupCode = event.group_Code;
    this.chitgroup_id = event.chitgroup_id;

    this.nameChangeForm.get('ticket')?.enable();

    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  onTicketSelect(event: any) {
    if (!event) return;

    this.service.getByTicket(this.branchschema, event.ticketno, this.chitgroup_id)
      .subscribe(res => {
        this.contactId = res.contactId;

        // TEMP: cast to any until we confirm the real field name on NameUpdateDTO
        // (send commonservice.ts and I'll replace this with the typed property)
        this.nameChangeForm.patchValue({
          oldName: res.oldName,
          oldSurname: res.oldSurname,
          oldMailingName: res.oldMailingName,
          oldStatus: (res as any).chit_status,
        });
      });
  }

  confirmSave() {
    this.nameChangeForm.markAllAsTouched();

    if (this.nameChangeForm.invalid || !this.contactId) {
      alert('Please fill all required fields correctly.');
      return;
    }

    this.saving.set(true);

    const updatePayload = {
      contact_id: this.contactId,
      newName: this.f['newName'].value,
      newSurname: this.f['newSurname'].value,
      newMailingName: this.f['newMailingName'].value,
      ptypeofoperation: 'UPDATE'
    };

    const oldData = {
      name: this.f['oldName'].value,
      surname: this.f['oldSurname'].value,
      mailingName: this.f['oldMailingName'].value,
      status: this.f['oldStatus'].value
    };

    const newData = {
      name: this.f['newName'].value,
      surname: this.f['newSurname'].value,
      mailingName: this.f['newMailingName'].value
    };

    const audit = {
      schemaName: this.branchschema,
      loginName: this.auth.loginName(),
      loginTime: new Date().toISOString(),
      changeType: 'NAME_CHANGE',
      oldData: oldData,
      newData: newData,
      reason: this.f['reason'].value
    };

    this.service.updateRecordsnamechange(updatePayload, this.branchschema)
      .subscribe({
        next: () => {
          this.service.saveData([audit]).subscribe({
            next: () => {
              this.saving.set(false);
              alert('Successfully updated and audit saved');
              this.clear();
            },
            error: (err: any) => {
              this.saving.set(false);
              console.error('Audit save failed:', err);
              alert('Updated, but audit failed');
            }
          });
        },
        error: (err: any) => {
          this.saving.set(false);
          console.error('Update failed:', err);
          alert('Update failed');
        }
      });
  }

  clear() {
    this.nameChangeForm.reset();
    this.resetFromBranch();
  }
}