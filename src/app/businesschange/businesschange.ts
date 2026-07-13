// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { CommonService, BusinessRefDTO, BusinessRefUpdateDTO } from '../commonservice';

// @Component({
//   selector: 'app-businesschange',
//   standalone: true,
//   templateUrl: './businesschange.html',
//   imports: [CommonModule, ReactiveFormsModule, NgSelectModule]
// })
// export class Businesschange implements OnInit {

//   showForm = true;

//   branchlist: any[] = [];
//   branch_code: any[] = [];
//   tickets: any[] = [];

//   contactId: any;
//   subscriberId: any;
//   branchschema: any;
//   groupCode: any;
//   chitgroup_id: any;
//   ticketNo: any;

//   businessChangeForm!: FormGroup;

//   private fb = inject(FormBuilder);
//   private service = inject(CommonService);

//   ngOnInit(): void {
//     this.initForm();
//     this.getBranches();
//     this.handleDependencies();
//   }

//   initForm() {
//     this.businessChangeForm = this.fb.group({
//       cao: ['', Validators.required],
//       group: [{ value: '', disabled: true }, Validators.required],
//       ticket: [{ value: '', disabled: true }, Validators.required],

//       susbName: [''],
//       empName: [''],
//       oldBsID: [''],

//       newBsID: ['', [Validators.required, Validators.pattern(/^[0-9]*$/), Validators.maxLength(8)]],

//       reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],

//       ptypeofoperation: ['UPDATE']
//     });
//   }

//   handleDependencies() {
//     let prevCao: any = null;
//     let prevGroup: any = null;
//     let prevTicket: any = null;

//     this.businessChangeForm.get('cao')?.valueChanges.subscribe(value => {
//       if (value !== prevCao) {
//         this.resetFromBranch();
//         prevCao = value;
//         if (value) {
//           const selected = this.branchlist.find(x => x.branch_name === value);
//           if (selected) this.onBranchSelect(selected);
//         }
//       }
//     });

//     this.businessChangeForm.get('group')?.valueChanges.subscribe(value => {
//       if (value !== prevGroup) {
//         this.resetFromGroup();
//         prevGroup = value;
//         if (value) {
//           const selected = this.branch_code.find(x => x.group_Code === value);
//           if (selected) this.onGroupSelect(selected);
//         }
//       }
//     });

//     this.businessChangeForm.get('ticket')?.valueChanges.subscribe(value => {
//       if (value !== prevTicket) {
//         this.resetFromTicket();
//         prevTicket = value;
//         if (value) {
//           const selected = this.tickets.find(x => x.ticketno === value);
//           if (selected) this.onTicketSelect(selected);
//         }
//       }
//     });
//   }

//   resetFromBranch() {
//     this.branchschema = null;
//     this.contactId = null;
//     this.subscriberId = null;

//     this.businessChangeForm.patchValue({ group: '', ticket: '' });
//     this.resetFromGroup();

//     this.businessChangeForm.get('group')?.disable();
//     this.businessChangeForm.get('ticket')?.disable();

//     this.branch_code = [];
//     this.tickets = [];
//   }

//   resetFromGroup() {
//     this.groupCode = null;
//     this.chitgroup_id = null;
//     this.contactId = null;
//     this.subscriberId = null;

//     this.businessChangeForm.patchValue({ ticket: '' });
//     this.resetFromTicket();

//     this.businessChangeForm.get('ticket')?.disable();
//     this.tickets = [];
//   }

//   resetFromTicket() {
//     this.contactId = null;
//     this.subscriberId = null;
//     this.ticketNo = null;

//     this.businessChangeForm.patchValue({
//       susbName: '',
//       empName: '',
//       oldBsID: '',
//       newBsID: ''
//     });
//   }

//   get f() {
//     return this.businessChangeForm.controls;
//   }

//   // Strip non-digits on every keystroke
//   onNumberInput(controlName: string) {
//     let value: string = this.f[controlName].value || '';
//     value = value.replace(/[^0-9]/g, '');
//     this.f[controlName].setValue(value, { emitEvent: false });
//   }

//   getBranches() {
//     this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
//   }

//   onBranchSelect(event: any) {
//     if (!event) return;
//     this.branchschema = event.branch_code;
//     this.businessChangeForm.get('group')?.enable();
//     this.service.getGroupCode(this.branchschema)
//       .subscribe(res => this.branch_code = res || []);
//   }

//   // onGroupSelect(event: any) {
//   //   if (!event) return;
//   //   this.groupCode = event.group_Code;
//   //   this.chitgroup_id = event.chitgroup_id;
//   //   this.businessChangeForm.get('ticket')?.enable();
//   //   this.service.getTickets(this.branchschema, this.groupCode)
//   //     .subscribe(res => this.tickets = res || []);
//   // }
//   onGroupSelect(event: any) {
//     if (!event) return;
//     this.groupCode = event.group_Code;
//     this.chitgroup_id = event.chitgroup_id != null ? Number(event.chitgroup_id) : null;
//     this.businessChangeForm.get('ticket')?.enable();
//     this.service.getTickets(this.branchschema, this.groupCode)
//       .subscribe(res => this.tickets = res || []);
//   }

//   onTicketSelect(event: any) {
//     if (!event) return;
//     this.ticketNo = event.ticketno;

//     this.service.getBusinessRefByTicket(this.branchschema, event.ticketno, this.chitgroup_id)
//       .subscribe(res => {
//         this.contactId = res.contactId;
//         this.subscriberId = res.subscriberId;

//         this.businessChangeForm.patchValue({
//           susbName: res.subscriberName,
//           empName: res.employeeName,
//           oldBsID: res.businessReferenceId
//         });
//       });
//   }

//   confirmSave() {
//     this.businessChangeForm.markAllAsTouched();

//     if (this.businessChangeForm.invalid || !this.contactId || !this.subscriberId) {
//       alert('Please fill all required fields correctly.');
//       return;
//     }

//     // const updatePayload: BusinessRefUpdateDTO = {
//     //   chitgroup_id: this.chitgroup_id,
//     //   ticketno: this.ticketNo,
//     //   subscriberId: this.subscriberId,
//     //   oldBusinessReferenceId: this.f['oldBsID'].value,
//     //   newBusinessReferenceId: this.f['newBsID'].value,
//     //   ptypeofoperation: 'UPDATE'
//     // };
//     const updatePayload: BusinessRefUpdateDTO = {
//       chitgroup_id: Number(this.chitgroup_id),
//       ticketno: this.ticketNo,
//       subscriberId: this.subscriberId,
//       oldBusinessReferenceId: this.f['oldBsID'].value,
//       newBusinessReferenceId: this.f['newBsID'].value,
//       ptypeofoperation: 'UPDATE'
//     };
//     const audit = {
//       schemaName: this.branchschema,
//       loginName: 'admin',
//       loginTime: new Date().toISOString(),
//       changeType: 'BUSINESS_REF_CHANGE',
//       oldData: { businessReferenceId: this.f['oldBsID'].value },
//       newData: { businessReferenceId: this.f['newBsID'].value },
//       reason: this.f['reason'].value
//     };

//     this.service.updateBusinessRef(updatePayload, this.branchschema)
//       .subscribe({
//         next: () => {
//           this.service.saveData([audit]).subscribe({
//             next: () => {
//               alert('Successfully updated and audit saved');
//               this.clear();
//             },
//             error: (err: any) => {
//               console.error('Audit save failed:', err);
//               alert('Updated, but audit save failed');
//             }
//           });
//         },
//         error: (err: any) => {
//           console.error('Update failed:', err);
//           alert('Update failed');
//         }
//       });
//   }

//   clear() {
//     this.businessChangeForm.reset();
//     this.initForm();
//     this.resetFromBranch();
//   }
// }



import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService, BusinessRefDTO, BusinessRefUpdateDTO } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-businesschange',
  standalone: true,
  templateUrl: './businesschange.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressBarModule
  ]
})
export class Businesschange implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  contactId: any;
  subscriberId: any;
  branchschema: any;
  groupCode: any;
  chitgroup_id: any;
  ticketNo: any;

  businessChangeForm!: FormGroup;

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  pendingUpdatePayload: BusinessRefUpdateDTO | null = null;
  pendingAudit: any = null;
  pendingOldBsID = '';
  pendingNewBsID = '';
  pendingReason  = '';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm() {
    this.businessChangeForm = this.fb.group({
      cao: ['', Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],

      susbName: [''],
      empName: [''],
      oldBsID: [''],

      newBsID: ['', [Validators.required, Validators.pattern(/^[0-9]*$/), Validators.maxLength(8)]],

      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],

      ptypeofoperation: ['UPDATE']
    });
  }

  handleDependencies() {
    let prevCao: any = null;
    let prevGroup: any = null;
    let prevTicket: any = null;

    this.businessChangeForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.businessChangeForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const selected = this.branch_code.find(x => x.group_Code === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });

    this.businessChangeForm.get('ticket')?.valueChanges.subscribe(value => {
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
    this.subscriberId = null;

    this.businessChangeForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();

    this.businessChangeForm.get('group')?.disable();
    this.businessChangeForm.get('ticket')?.disable();

    this.branch_code = [];
    this.tickets = [];
  }

  resetFromGroup() {
    this.groupCode = null;
    this.chitgroup_id = null;
    this.contactId = null;
    this.subscriberId = null;

    this.businessChangeForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.businessChangeForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket() {
    this.contactId = null;
    this.subscriberId = null;
    this.ticketNo = null;

    this.businessChangeForm.patchValue({
      susbName: '',
      empName: '',
      oldBsID: '',
      newBsID: ''
    });
  }

  get f() {
    return this.businessChangeForm.controls;
  }

  // Strip non-digits on every keystroke
  onNumberInput(controlName: string) {
    let value: string = this.f[controlName].value || '';
    value = value.replace(/[^0-9]/g, '');
    this.f[controlName].setValue(value, { emitEvent: false });
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }

  onBranchSelect(event: any) {
    if (!event) return;
    this.branchschema = event.branch_code;
    this.businessChangeForm.get('group')?.enable();
    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(event: any) {
    if (!event) return;
    this.groupCode = event.group_Code;
    this.chitgroup_id = event.chitgroup_id != null ? Number(event.chitgroup_id) : null;
    this.businessChangeForm.get('ticket')?.enable();
    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  onTicketSelect(event: any) {
    if (!event) return;
    this.ticketNo = event.ticketno;

    this.service.getBusinessRefByTicket(this.branchschema, event.ticketno, this.chitgroup_id)
      .subscribe(res => {
        this.contactId = res.contactId;
        this.subscriberId = res.subscriberId;

        this.businessChangeForm.patchValue({
          susbName: res.subscriberName,
          empName: res.employeeName,
          oldBsID: res.businessReferenceId
        });
      });
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal
  save(): void {
    this.businessChangeForm.markAllAsTouched();

    if (this.businessChangeForm.invalid || !this.contactId || !this.subscriberId) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const oldBsID = this.f['oldBsID'].value;
    const newBsID = this.f['newBsID'].value;
    const reason  = this.f['reason'].value;

    this.pendingOldBsID = oldBsID || '—';
    this.pendingNewBsID = newBsID;
    this.pendingReason  = reason;

    this.pendingUpdatePayload = {
      chitgroup_id: Number(this.chitgroup_id),
      ticketno: this.ticketNo,
      subscriberId: this.subscriberId,
      oldBusinessReferenceId: oldBsID,
      newBusinessReferenceId: newBsID,
      ptypeofoperation: 'UPDATE'
    };

    this.pendingAudit = this.auth.buildAudit(
      'BUSINESS_REF_CHANGE',
      {
        oldData: { businessReferenceId: oldBsID },
        newData: { businessReferenceId: newBsID }
      },
      reason
    );

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal     = false;
    this.pendingUpdatePayload = null;
    this.pendingAudit         = null;
  }

  // Step 2: fires only after user clicks "Yes, Save" in the modal
  confirmSave(): void {
    if (!this.pendingUpdatePayload || !this.pendingAudit) return;

    this.showConfirmModal = false;
    this.saving.set(true);

    this.service.updateBusinessRef(this.pendingUpdatePayload, this.branchschema)
      .subscribe({
        next: () => {
          this.service.saveData([this.pendingAudit]).subscribe({
            next: () => {
              this.saving.set(false);
              alert('Successfully updated and audit saved');
              this.clear();
            },
            error: (err: any) => {
              this.saving.set(false);
              console.error('Audit save failed:', err);
              alert('Updated, but audit save failed');
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
    this.businessChangeForm.reset();
    this.initForm();
    this.resetFromBranch();
  }
}