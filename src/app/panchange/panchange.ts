// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-panchange',
//   imports: [],
//   templateUrl: './panchange.html',
//   styleUrl: './panchange.css',
// })
// export class Panchange {

// }


import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService, PanNumberDto } from '../commonservice';

@Component({
  selector: 'app-panchange',
  standalone: true,
  templateUrl: './panchange.html',
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
  ]
})
export class Panchange implements OnInit {

  isCaoDone = false;
  isCancelSaving = false;
  isLoadingDetails = false;

  panList: PanNumberDto[] = [];
  private contactDetails: PanNumberDto[] = [];
  private selectedPAN: string = '';

  loginName = 'admin';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  pANChangeForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadPANList();
  }
  get f() {
    return this.pANChangeForm.controls;
  }
  initForm(): void {
    this.pANChangeForm = this.fb.group(
      {
        panno: ['', Validators.required],
        subscName: [''],
        newPanNo: ['', [
          Validators.required,
          Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        ]],
        reason: ['', [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200)
        ]],
      },
      { validators: this.panCrossValidator.bind(this) }
    );
  }

  panCrossValidator(group: AbstractControl): ValidationErrors | null {
    const oldPan = group.get('panno')?.value ?? '';
    const newPan = group.get('newPanNo')?.value ?? '';

    if (!newPan) return null;

    if (oldPan && newPan.toUpperCase() === oldPan.toUpperCase()) {
      return { samePAN: true };
    }

    const alreadyExists = this.panList.some(
      p => p.pan_number.toUpperCase() === newPan.toUpperCase()
    );
    if (alreadyExists) {
      return { panExists: true };
    }

    return null;
  }

  loadPANList(): void {
    this.service.getPANList().subscribe({
      next: (res) => { this.panList = res ?? []; },
      error: () => { this.panList = []; }
    });
  }

  reveiptnumber_change($event: PanNumberDto | null): void {
    this.contactDetails = [];

    if (!$event) {
      this.selectedPAN = '';
      this.pANChangeForm.patchValue({ subscName: '', newPanNo: '', reason: '' });
      this.pANChangeForm.get('newPanNo')?.markAsUntouched();
      this.pANChangeForm.get('reason')?.markAsUntouched();
      return;
    }

    this.selectedPAN = $event.pan_number ?? '';
    this.isLoadingDetails = true;

    this.service.getContactDocumentDetails(this.selectedPAN).subscribe({
      next: (details) => {
        this.isLoadingDetails = false;
        this.contactDetails = details ?? [];

        this.pANChangeForm.patchValue({
          subscName: details?.[0]?.contact_name ?? '',
          newPanNo: '',
          reason: '',
        });

        this.pANChangeForm.get('newPanNo')?.markAsUntouched();
        this.pANChangeForm.get('reason')?.markAsUntouched();
        this.pANChangeForm.updateValueAndValidity();
      },
      error: () => {
        this.isLoadingDetails = false;
        this.contactDetails = [];
        this.pANChangeForm.patchValue({ subscName: '', newPanNo: '', reason: '' });
      }
    });
  }

  saveGeneralReceiptCancel(): void {
    this.pANChangeForm.markAllAsTouched();
    if (this.pANChangeForm.invalid) return;

    if (this.contactDetails.length === 0) {
      alert('No contact/document details found for the selected PAN. Cannot proceed.');
      return;
    }

    if (!confirm('Do you want to save this PAN change?')) return;

    this.isCancelSaving = true;

    const f = this.pANChangeForm.controls;
    const newPan = (f['newPanNo'].value ?? '').toUpperCase();
    const reason = f['reason'].value ?? '';
    const branchschema = this.contactDetails[0]?.branch_code ?? '';
    const contactRefId = this.contactDetails[0]?.contact_reference_id ?? '';
    const contactId = this.contactDetails[0]?.tbl_mst_contact_id ?? 0;
    const documentIds = [
      ...new Set(this.contactDetails.map(d => d.tbl_mst_contact_documents_id))
    ].join(',');

    const oldData = structuredClone(this.contactDetails).map(d => ({
      contact_reference_id: d.contact_reference_id,
      contact_name: d.contact_name,
      pan_number: this.selectedPAN,
      document_reference_no: d.document_reference_no,
      tbl_mst_contact_documents_id: d.tbl_mst_contact_documents_id,
      branch_code: d.branch_code,
      tbl_mst_contact_id: d.tbl_mst_contact_id,
    }));

    this.service.updatePanNumber({
      branchschema,
      oldPanNumber: this.selectedPAN,
      newPanNumber: newPan,
      contactReferenceId: contactRefId,
      contactId,
      documentIds,
    }).subscribe({
      next: (res) => {
        if (!res?.toLowerCase().includes('success')) {
          this.isCancelSaving = false;
          alert(res ?? 'Update failed. Please try again.');
          return;
        }

        const newData = structuredClone(this.contactDetails).map(d => ({
          contact_reference_id: d.contact_reference_id,
          contact_name: d.contact_name,
          pan_number: newPan,
          document_reference_no: newPan,
          tbl_mst_contact_documents_id: d.tbl_mst_contact_documents_id,
          branch_code: d.branch_code,
          tbl_mst_contact_id: d.tbl_mst_contact_id,
        }));

        const auditPayload = [{
          schemaName: branchschema,
          loginName: this.loginName,
          loginTime: new Date().toISOString(),
          oldData,
          newData,
          reason,
          changeType: 'PAN_CHANGE'
        }];

        this.service.saveData(auditPayload).subscribe({
          next: () => {
            this.isCancelSaving = false;
            alert(res);
            this.clearFormFields();
          },
          error: (err: any) => {
            this.isCancelSaving = false;
            console.error('[saveData audit] error =', err);
            alert('PAN updated but audit log failed. Please check logs.');
            this.clearFormFields();
          }
        });
      },
      error: (err) => {
        this.isCancelSaving = false;
        alert(err?.error ?? 'PAN change failed. Please try again.');
      }
    });
  }

  onNewPanInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    input.value = value;
    this.pANChangeForm.get('newPanNo')?.setValue(value, { emitEvent: false });
  }

  clearFormFields(): void {
    this.isCancelSaving = false;
    this.isCaoDone = false;
    this.selectedPAN = '';
    this.contactDetails = [];

    this.pANChangeForm.reset({ panno: '', subscName: '', newPanNo: '', reason: '' });
    this.pANChangeForm.markAsUntouched();
    this.pANChangeForm.markAsPristine();
  }

  isInvalid(name: string): boolean {
    const c = this.pANChangeForm.get(name);
    return !!(c && c.touched && c.invalid);
  }

  hasError(name: string, error: string): boolean {
    const c = this.pANChangeForm.get(name);
    return !!(c && c.touched && c.hasError(error));
  }

  hasFormError(error: string): boolean {
    const newPanCtrl = this.pANChangeForm.get('newPanNo');
    return !!(newPanCtrl?.touched && this.pANChangeForm.hasError(error));
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