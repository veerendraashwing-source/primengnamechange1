import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-mobilenochange',
  standalone: true,
  templateUrl: './mobilenochange.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MessageModule,
    TagModule,
    DividerModule,
    ProgressBarModule
  ]
})
export class Mobilenochange implements OnInit {

  showForm = true;
  saving = signal(false);

  branch_name: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  contactChangeForm!: FormGroup;

  contactId: any;
  branchcode: any;
  groupcode: any;
  chit_groupid: any;
  chit_status: any;

  isMobileChange = false;
  isAddressChange = false;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm() {
    this.contactChangeForm = this.fb.group({
      cao:      ['', Validators.required],
      group:    [{ value: '', disabled: true }, Validators.required],
      ticket:   [{ value: '', disabled: true }, Validators.required],

      name:     [''],
      mobNo:    [''],
      address:  [''],
      area:     [''],
      city:     [''],
      pincode:  [''],
      oldStatus: [''],

      changeType: ['', Validators.required],

      newMobileNo: [''],
      newAddress:  [''],
      newArea:     [''],
      newCity:     [''],
      newPincode:  [''],

      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  handleDependencies() {
    let prevCao:    any = null;
    let prevGroup:  any = null;
    let prevTicket: any = null;

    this.contactChangeForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const selected = this.branch_name.find(x => x.branch_name === value);
          if (selected) this.loadGroups(selected);
        }
      }
    });

    this.contactChangeForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const selected = this.branch_code.find(x => x.group_Code === value);
          if (selected) this.loadTickets(selected);
        }
      }
    });

    this.contactChangeForm.get('ticket')?.valueChanges.subscribe(value => {
      if (value !== prevTicket) {
        this.resetFromTicket();
        prevTicket = value;
        if (value) {
          const selected = this.tickets.find(x => x.ticketno === value);
          if (selected) this.loadCustomer(selected);
        }
      }
    });

    this.contactChangeForm.get('changeType')?.valueChanges.subscribe(val => {
      this.isMobileChange  = val === 'MOBILE';
      this.isAddressChange = val === 'ADDRESS';

      this.contactChangeForm.patchValue({
        newMobileNo: '',
        newAddress:  '',
        newArea:     '',
        newCity:     '',
        newPincode:  ''
      });

      ['newMobileNo', 'newAddress', 'newArea', 'newCity', 'newPincode']
        .forEach(f => this.contactChangeForm.get(f)?.clearValidators());

      if (this.isMobileChange) {
        this.contactChangeForm.get('newMobileNo')?.setValidators([
          Validators.required,
          Validators.pattern(/^[6-9]\d{9}$/)
        ]);
      }

      if (this.isAddressChange) {
        this.contactChangeForm.get('newAddress')?.setValidators([Validators.required, Validators.maxLength(100)]);
        this.contactChangeForm.get('newArea')?.setValidators([Validators.required, Validators.maxLength(50)]);
        this.contactChangeForm.get('newCity')?.setValidators([Validators.required, Validators.maxLength(50)]);
        this.contactChangeForm.get('newPincode')?.setValidators([
          Validators.required,
          Validators.pattern(/^[1-9][0-9]{5}$/)
        ]);
      }

      ['newMobileNo', 'newAddress', 'newArea', 'newCity', 'newPincode']
        .forEach(f => this.contactChangeForm.get(f)?.updateValueAndValidity());
    });
  }

  preventExceedLength(event: KeyboardEvent, max: number) {
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

  allowOnlyDigits(control: string, max: number) {
    let val = this.f[control].value || '';
    val = val.replace(/[^0-9]/g, '');
    if (val.length > max) val = val.substring(0, max);
    this.f[control].setValue(val, { emitEvent: false });
  }

  resetFromBranch() {
    this.contactId  = null;
    this.branchcode = null;

    this.contactChangeForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();

    this.contactChangeForm.get('group')?.disable();
    this.contactChangeForm.get('ticket')?.disable();

    this.branch_code = [];
    this.tickets     = [];
  }

  resetFromGroup() {
    this.contactId = null;
    this.groupcode = null;
    this.chit_groupid = null;

    this.contactChangeForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.contactChangeForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket() {
    this.contactId = null;

    this.contactChangeForm.patchValue({
      name: '', mobNo: '', address: '', area: '', city: '', pincode: ''
    });
  }

  get f() { return this.contactChangeForm.controls; }

  isInvalid(name: string) {
    const c = this.contactChangeForm.get(name);
    return !!(c && c.touched && c.invalid);
  }

  hasError(name: string, error: string) {
    const c = this.contactChangeForm.get(name);
    return !!(c && c.touched && c.hasError(error));
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branch_name = res || []);
  }

  loadGroups(branch: any) {
    this.branchcode = branch.branch_code;
    this.contactChangeForm.get('group')?.enable();
    this.service.getGroupCode(this.branchcode)
      .subscribe(res => this.branch_code = res || []);
  }

  loadTickets(group: any) {
    this.groupcode    = group.group_Code;
    this.chit_groupid = group.chitgroup_id;
    this.contactChangeForm.get('ticket')?.enable();
    this.service.getTickets(this.branchcode, this.groupcode)
      .subscribe(res => this.tickets = res || []);
  }

  loadCustomer(ticket: any) {
    this.service.getByTicket(this.branchcode, ticket.ticketno, this.chit_groupid)
      .subscribe(res => {
        this.contactId = res.contactId;
        this.contactChangeForm.patchValue({
          name:    res.oldName,
          mobNo:   res.mobileNo,
          address: res.address,
          area:    res.area,
          city:    res.city,
          pincode: res.pincode,
          oldStatus: res.chit_status
        });
      });
  }

  saveRecord() {
    this.contactChangeForm.markAllAsTouched();

    if (!this.contactId || this.contactChangeForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    this.saving.set(true);

    const changeType = this.f['changeType'].value;

    let oldData: any     = {};
    let newData: any     = {};
    let updatePayload: any = {
      contact_id:       this.contactId,
      ptypeofoperation: 'UPDATE'
    };

    if (changeType === 'MOBILE') {
      oldData = {
        mobileNo: this.f['mobNo'].value,
        oldStatus: this.f['oldStatus'].value
      };
      newData = {
        mobileNo: this.f['newMobileNo'].value
      };
      updatePayload = {
        ...updatePayload,
        newMobileNo: this.f['newMobileNo'].value
      };
    }

    if (changeType === 'ADDRESS') {
      oldData = {
        address: this.f['address'].value,
        area:    this.f['area'].value,
        city:    this.f['city'].value,
        pincode: this.f['pincode'].value,
        oldStatus: this.f['oldStatus'].value
      };
      newData = {
        address: this.f['newAddress'].value,
        area:    this.f['newArea'].value,
        city:    this.f['newCity'].value,
        pincode: this.f['newPincode'].value
      };
      updatePayload = {
        ...updatePayload,
        newAddress: this.f['newAddress'].value,
        newArea:    this.f['newArea'].value,
        newCity:    this.f['newCity'].value,
        newPincode: this.f['newPincode'].value
      };
    }

    const audit = this.auth.buildAudit(
      changeType === 'MOBILE' ? 'MOBILE_CHANGE' : 'ADDRESS_CHANGE',
      { oldData, newData },
      this.f['reason'].value
    );

    this.service.updateRecordsnamechange(updatePayload, this.branchcode)
      .subscribe({
        next: () => {
          this.service.saveData([audit]).subscribe({
            next: () => {
              this.saving.set(false);
              alert('Successfully updated and audit saved');
              this.clearFormFields();
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

  clearFormFields() {
    this.contactChangeForm.reset();
    this.resetFromBranch();
    this.isMobileChange  = false;
    this.isAddressChange = false;
  }
}



// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormBuilder, FormGroup, Validators,
//   ReactiveFormsModule, AbstractControl
// } from '@angular/forms';

// import { SelectModule }        from 'primeng/select';
// import { InputTextModule }     from 'primeng/inputtext';
// import { TextareaModule }      from 'primeng/textarea';
// import { ButtonModule }        from 'primeng/button';
// import { TagModule }           from 'primeng/tag';
// import { DividerModule }       from 'primeng/divider';
// import { TooltipModule }       from 'primeng/tooltip';
// import { IconFieldModule }     from 'primeng/iconfield';
// import { InputIconModule }     from 'primeng/inputicon';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule }         from 'primeng/toast';
// import { ProgressBarModule }   from 'primeng/progressbar';
// import { ConfirmationService, MessageService } from 'primeng/api';

// import { CommonService } from '../commonservice';

// @Component({
//   selector: 'app-mobilenochange',
//   standalone: true,
//   templateUrl: './mobilenochange.html',
//   providers: [ConfirmationService, MessageService],
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     SelectModule,
//     InputTextModule,
//     TextareaModule,
//     ButtonModule,
//     TagModule,
//     DividerModule,
//     TooltipModule,
//     IconFieldModule,
//     InputIconModule,
//     ConfirmDialogModule,
//     ToastModule,
//     ProgressBarModule,
//   ]
// })
// export class Mobilenochange implements OnInit {

//   showForm = true;
//   isSaving = false;

//   branch_name: any[] = [];
//   branch_code: any[] = [];
//   tickets: any[] = [];

//   contactChangeForm!: FormGroup;

//   contactId: any;
//   branchcode: any;
//   groupcode: any;
//   chit_groupid: any;

//   isMobileChange  = false;
//   isAddressChange = false;

//   private fb         = inject(FormBuilder);
//   private service    = inject(CommonService);
//   private confirmSvc = inject(ConfirmationService);
//   private msgSvc     = inject(MessageService);

//   /* ─── lifecycle ─────────────────────────────────── */
//   ngOnInit(): void {
//     this.initForm();
//     this.getBranches();
//     this.handleDependencies();
//   }

//   /* ─── form init ─────────────────────────────────── */
//   initForm() {
//     this.contactChangeForm = this.fb.group({
//       cao:    ['', Validators.required],
//       group:  [{ value: '', disabled: true }, Validators.required],
//       ticket: [{ value: '', disabled: true }, Validators.required],

//       name:    [''],
//       mobNo:   [''],
//       address: [''],
//       area:    [''],
//       city:    [''],
//       pincode: [''],

//       changeType: ['', Validators.required],

//       newMobileNo: [''],
//       newAddress:  [''],
//       newArea:     [''],
//       newCity:     [''],
//       newPincode:  [''],

//       reason: ['', [
//         Validators.required,
//         Validators.minLength(10),
//         Validators.maxLength(200)
//       ]]
//     });
//   }

//   get f(): { [key: string]: AbstractControl } {
//     return this.contactChangeForm.controls;
//   }

//   get reasonLen(): number { return (this.f['reason']?.value || '').length; }

//   isInvalid(name: string) {
//     const c = this.contactChangeForm.get(name);
//     return !!(c && c.touched && c.invalid);
//   }

//   hasError(name: string, error: string) {
//     const c = this.contactChangeForm.get(name);
//     return !!(c && c.touched && c.hasError(error));
//   }

//   /* ─── cascading dependencies ────────────────────── */
//   handleDependencies() {
//     let prevCao: any = null, prevGroup: any = null, prevTicket: any = null;

//     this.contactChangeForm.get('cao')?.valueChanges.subscribe(value => {
//       if (value !== prevCao) {
//         this.resetFromBranch(); prevCao = value;
//         if (value) {
//           const selected = this.branch_name.find(x => x.branch_name === value);
//           if (selected) this.loadGroups(selected);
//         }
//       }
//     });

//     this.contactChangeForm.get('group')?.valueChanges.subscribe(value => {
//       if (value !== prevGroup) {
//         this.resetFromGroup(); prevGroup = value;
//         if (value) {
//           const selected = this.branch_code.find(x => x.group_Code === value);
//           if (selected) this.loadTickets(selected);
//         }
//       }
//     });

//     this.contactChangeForm.get('ticket')?.valueChanges.subscribe(value => {
//       if (value !== prevTicket) {
//         this.resetFromTicket(); prevTicket = value;
//         if (value) {
//           const selected = this.tickets.find(x => x.ticketno === value);
//           if (selected) this.loadCustomer(selected);
//         }
//       }
//     });

//     this.contactChangeForm.get('changeType')?.valueChanges.subscribe(val => {
//       this.isMobileChange  = val === 'MOBILE';
//       this.isAddressChange = val === 'ADDRESS';

//       this.contactChangeForm.patchValue({
//         newMobileNo: '', newAddress: '', newArea: '', newCity: '', newPincode: ''
//       });

//       ['newMobileNo', 'newAddress', 'newArea', 'newCity', 'newPincode']
//         .forEach(f => this.contactChangeForm.get(f)?.clearValidators());

//       if (this.isMobileChange) {
//         this.contactChangeForm.get('newMobileNo')?.setValidators([
//           Validators.required,
//           Validators.pattern(/^[6-9]\d{9}$/)
//         ]);
//       }

//       if (this.isAddressChange) {
//         this.contactChangeForm.get('newAddress')?.setValidators([Validators.required, Validators.maxLength(100)]);
//         this.contactChangeForm.get('newArea')?.setValidators([Validators.required, Validators.maxLength(50)]);
//         this.contactChangeForm.get('newCity')?.setValidators([Validators.required, Validators.maxLength(50)]);
//         this.contactChangeForm.get('newPincode')?.setValidators([
//           Validators.required,
//           Validators.pattern(/^[1-9][0-9]{5}$/)
//         ]);
//       }

//       ['newMobileNo', 'newAddress', 'newArea', 'newCity', 'newPincode']
//         .forEach(f => this.contactChangeForm.get(f)?.updateValueAndValidity());
//     });
//   }

//   /* ─── reset helpers ─────────────────────────────── */
//   resetFromBranch() {
//     this.contactId = null;
//     this.contactChangeForm.patchValue({ group: '', ticket: '' });
//     this.resetFromGroup();
//     this.contactChangeForm.get('group')?.disable();
//     this.contactChangeForm.get('ticket')?.disable();
//     this.branch_code = []; this.tickets = [];
//   }

//   resetFromGroup() {
//     this.contactId = null;
//     this.contactChangeForm.patchValue({ ticket: '' });
//     this.resetFromTicket();
//     this.contactChangeForm.get('ticket')?.disable();
//     this.tickets = [];
//   }

//   resetFromTicket() {
//     this.contactId = null;
//     this.contactChangeForm.patchValue({
//       name: '', mobNo: '', address: '', area: '', city: '', pincode: ''
//     });
//   }

//   /* ─── input helpers ─────────────────────────────── */
//   preventExceedLength(event: KeyboardEvent, max: number) {
//     const input = event.target as HTMLInputElement;
//     if (
//       input.value.length >= max &&
//       !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)
//     ) {
//       event.preventDefault();
//     }
//   }

//   allowOnlyDigits(control: string, max: number) {
//     let val = (this.f[control].value || '').replace(/[^0-9]/g, '');
//     if (val.length > max) val = val.substring(0, max);
//     this.f[control].setValue(val, { emitEvent: false });
//   }

//   /* ─── API calls ─────────────────────────────────── */
//   getBranches() {
//     this.service.getBranchNames().subscribe(res => this.branch_name = res || []);
//   }

//   loadGroups(branch: any) {
//     this.branchcode = branch.branch_code;
//     this.contactChangeForm.get('group')?.enable();
//     this.service.getGroupCode(this.branchcode)
//       .subscribe(res => this.branch_code = res || []);
//   }

//   loadTickets(group: any) {
//     this.groupcode    = group.group_Code;
//     this.chit_groupid = group.chitgroup_id;
//     this.contactChangeForm.get('ticket')?.enable();
//     this.service.getTickets(this.branchcode, this.groupcode)
//       .subscribe(res => this.tickets = res || []);
//   }

//   loadCustomer(ticket: any) {
//     this.service.getByTicket(this.branchcode, ticket.ticketno, this.chit_groupid)
//       .subscribe(res => {
//         this.contactId = res.contactId;
//         this.contactChangeForm.patchValue({
//           name:    res.oldName,
//           mobNo:   res.mobileNo,
//           address: res.address,
//           area:    res.area,
//           city:    res.city,
//           pincode: res.pincode
//         });
//       });
//   }

//   /* ─── save ──────────────────────────────────────── */
//   saveRecord() {
//     this.contactChangeForm.markAllAsTouched();

//     if (this.contactChangeForm.invalid || !this.contactId) {
//       this.msgSvc.add({
//         severity: 'warn', summary: 'Incomplete',
//         detail: 'Please fill all required fields correctly.', life: 4000
//       });
//       return;
//     }

//     const changeLabel = this.isMobileChange ? 'mobile number' : 'address';

//     this.confirmSvc.confirm({
//       message: `Are you sure you want to update the <strong>${changeLabel}</strong> for this member?`,
//       header: 'Confirm Change',
//       icon: 'pi pi-shield',
//       acceptLabel: 'Yes, Save',
//       rejectLabel: 'Cancel',
//       acceptButtonStyleClass: 'p-button-success',
//       rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
//       accept: () => {
//         this.isSaving = true;

//         const payload: any = {
//           contact_id:       this.contactId,
//           ptypeofoperation: 'UPDATE',
//           changeType:       this.f['changeType'].value
//         };

//         if (this.isMobileChange) {
//           payload['newMobileNo'] = this.f['newMobileNo'].value;
//         }

//         if (this.isAddressChange) {
//           payload['newAddress'] = this.f['newAddress'].value;
//           payload['newArea']    = this.f['newArea'].value;
//           payload['newCity']    = this.f['newCity'].value;
//           payload['newPincode'] = this.f['newPincode'].value;
//         }

//         const audit = {
//           schemaName: this.branchcode,
//           loginName:  'admin',
//           loginTime:  new Date().toISOString(),
//           changeType: this.isMobileChange ? 'MOBILE_CHANGE' : 'ADDRESS_CHANGE',
//           payload:    { newData: payload },
//           reason:     this.f['reason'].value
//         };

//         // Replace with your actual service call
//         this.service.saveData([audit]).subscribe({
//           next: () => {
//             this.isSaving = false;
//             this.msgSvc.add({
//               severity: 'success', summary: 'Done',
//               detail: 'Record updated & audit saved.', life: 4000
//             });
//             this.clearFormFields();
//           },
//           error: () => {
//             this.isSaving = false;
//             this.msgSvc.add({
//               severity: 'error', summary: 'Error',
//               detail: 'Update failed. Please try again.', life: 4000
//             });
//           }
//         });
//       }
//     });
//   }

//   clearFormFields() {
//     this.contactChangeForm.reset();
//     this.resetFromBranch();
//     this.isMobileChange  = false;
//     this.isAddressChange = false;
//   }
// }