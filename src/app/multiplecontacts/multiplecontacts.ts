// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-multiplecontacts',
//   imports: [],
//   templateUrl: './multiplecontacts.html',
//   styleUrl: './multiplecontacts.css',
// })
// export class Multiplecontacts {

// }


import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { CommonService } from '../commonservice';

@Component({
  selector: 'app-multiplecontacts',
  standalone: true,
  templateUrl: './multiplecontacts.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
  ]
})
export class Multiplecontacts implements OnInit {

  showForm = true;
  form!: FormGroup;

  changeType = 'MULTI_CONTACT_UPDATE';
  private oldMaxChits: number | null = null;

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    this.handleAdditionalChits();
  }

  initForm() {
    this.form = this.fb.group({
      contact_reference_id: [''],
      business_entity_contactno: [''],
      max_chits_per_contact: [0],
      additionalChits: [0, [Validators.min(0), Validators.max(10)]],
      totalcount: [0],
      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  get f() {
    return this.form.controls;
  }

  onContactIdBlur() {
    const val = this.f['contact_reference_id'].value;
    if (!val) return;

    this.service.getContactById(val).subscribe({
      next: (res: any) => {
        const data = res?.find((x: any) => x.contact_reference_id === val);
        if (!data) {
          alert('Contact not found');
          return;
        }

        this.form.patchValue({
          business_entity_contactno: data.business_entity_contactno,
          max_chits_per_contact: data.max_chits_per_contact
        });

        this.oldMaxChits = Number(data.max_chits_per_contact || 0);
        this.calculateTotal();
      }
    });
  }

  onMobileBlur() {
    const val = this.f['business_entity_contactno'].value;
    if (!val || val.length !== 10) {
      alert('Enter valid mobile number');
      return;
    }

    this.service.getContactByMobile(val).subscribe({
      next: (res: any) => {
        const data = res?.find((x: any) => x.business_entity_contactno === val);
        if (!data) {
          alert('Mobile not found');
          return;
        }

        this.form.patchValue({
          contact_reference_id: data.contact_reference_id,
          max_chits_per_contact: data.max_chits_per_contact
        });

        this.oldMaxChits = Number(data.max_chits_per_contact || 0);
        this.calculateTotal();
      }
    });
  }

  handleAdditionalChits() {
    this.f['additionalChits'].valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  calculateTotal() {
    const existed = Number(this.f['max_chits_per_contact'].value || 0);
    const additional = Number(this.f['additionalChits'].value || 0);

    if (additional > 10) {
      this.f['additionalChits'].setValue(10);
      return;
    }

    this.f['totalcount'].setValue(existed + additional);
  }

  
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const referenceId = this.f['contact_reference_id'].value;
    const newTotal = this.f['totalcount'].value;

    if (!referenceId) {
      alert('Enter Contact ID');
      return;
    }

    if (this.oldMaxChits === newTotal) {
      alert('No changes detected');
      return;
    }

    const payload = {
      referenceid: referenceId,
      totalcount: newTotal
    };

  
    let audit = {
      schemaName: 'default',
      loginName: 'admin',
      loginTime: new Date().toISOString(),
      changeType: 'MULTI_CONTACTS',
      oldData: { max_chits_per_contact: this.oldMaxChits },
      newData: { max_chits_per_contact: newTotal },
      reason: this.f['reason'].value
    };

    this.service.updateTotalChits(payload).subscribe({
      next: () => {

        this.service.saveData([audit]).subscribe({
          next: () => {
            alert('Saved successfully & audit logged');
            this.clear();
          },
          error: () => alert('Saved but audit failed')
        });

      },
      error: () => alert('Save failed')
    });
  }

  clear() {
    this.form.reset({
      max_chits_per_contact: 0,
      additionalChits: 0,
      totalcount: 0
    });
    this.oldMaxChits = null;
  }

  allowNumbersOnly(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode >= 48 && charCode <= 57) return true;
    event.preventDefault();
    return false;
  }
}