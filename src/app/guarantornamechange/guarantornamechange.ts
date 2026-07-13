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
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-guarantornamechange',
  standalone: true,
  templateUrl: './guarantornamechange.html',
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
export class Guarantornamechange implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  branch_code: any[] = [];
  tickets: any[] = [];

  contactId: any;
  branchschema: any;
  groupCode: any;
  chitgroup_id: any;

  guarantNameChangeForm!: FormGroup;

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  sameNameWarning = false;
  pendingAudit: any = null;
  pendingRaw: any = null;
  pendingReason = '';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  initForm() {
    this.guarantNameChangeForm = this.fb.group({
      cao: ['', Validators.required],
      group: [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required],

      grtOldName: [{ value: '', disabled: true }],
      grtOldSurname: [{ value: '', disabled: true }],
      grtOldMailingName: [{ value: '', disabled: true }],
      suscrName: [{ value: '', disabled: true }],

      grtNewName: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-z ]*$/),
        Validators.maxLength(50)
      ]],

      grtNewSurname: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-z ]*$/),
        Validators.maxLength(20)
      ]],

      grtNewMailingName: [{ value: '', disabled: true }],

      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],

      ptypeofoperation: ['UPDATE']
    });
  }

  get f() {
    return this.guarantNameChangeForm.controls;
  }

  get reasonRequired(): boolean {
    const ctrl = this.f['reason'];
    return !!(ctrl.touched && ctrl.errors?.['required']);
  }

  get reasonMinLength(): boolean {
    const ctrl = this.f['reason'];
    return !!(ctrl.touched && ctrl.errors?.['minlength']);
  }

  handleDependencies() {
    let prevCao: any = null;
    let prevGroup: any = null;
    let prevTicket: any = null;

    this.f['cao'].valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;

        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.f['group'].valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;

        if (value) {
          const selected = this.branch_code.find(x => x.group_Code === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });

    this.f['ticket'].valueChanges.subscribe(value => {
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

    this.guarantNameChangeForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();

    this.f['group'].disable();
    this.f['ticket'].disable();

    this.branch_code = [];
    this.tickets = [];
  }

  resetFromGroup() {
    this.groupCode = null;
    this.chitgroup_id = null;
    this.contactId = null;

    this.guarantNameChangeForm.patchValue({ ticket: '' });
    this.resetFromTicket();

    this.f['ticket'].disable();
    this.tickets = [];
  }

  resetFromTicket() {
    this.contactId = null;

    this.guarantNameChangeForm.patchValue({
      grtOldName: '',
      grtOldSurname: '',
      grtOldMailingName: '',
      suscrName: '',
      grtNewName: '',
      grtNewSurname: '',
      grtNewMailingName: ''
    });
  }

  onNameInput(controlName: string, maxLength: number) {
    let value = this.f[controlName].value || '';

    value = value.replace(/[^A-Za-z ]/g, '');

    if (value.length > maxLength) {
      value = value.substring(0, maxLength);
    }

    this.f[controlName].setValue(value, { emitEvent: false });
    this.concatmailing();
  }

  concatmailing() {
    const name = (this.f['grtNewName'].value || '').trim();
    const surname = (this.f['grtNewSurname'].value || '').trim();
    this.f['grtNewMailingName'].setValue(`${name} ${surname}`.trim());
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }

  onBranchSelect(event: any) {
    if (!event) return;

    this.branchschema = event.branch_code;
    this.f['group'].enable();

    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(event: any) {
    if (!event) return;

    this.groupCode = event.group_Code;
    this.chitgroup_id = Number(event.chitgroup_id);

    this.f['ticket'].enable();

    this.service.getTickets(this.branchschema, this.groupCode)
      .subscribe(res => this.tickets = res || []);
  }

  onTicketSelect(event: any) {
    if (!event) return;

    this.service.getGuarantorNameChangeDetails(
      this.branchschema, this.groupCode, event.ticketno, this.branchschema
    ).subscribe(res => {
      // GET returns an array — grab the first row
      const data = Array.isArray(res) && res.length ? res[0] : null;
      if (!data) return;

      this.contactId = Number(data.tbl_mst_contact_id);

      this.guarantNameChangeForm.patchValue({
        grtOldName: data.contact_name,
        grtOldSurname: data.contact_surname,
        grtOldMailingName: data.contact_mailing_name,
        suscrName: data.subscriber_name
      });
    });
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal.
  // The old same-name check used a separate PrimeNG confirm dialog —
  // it's now folded into the same nc- confirm modal as a warning banner.
  save(): void {
    this.guarantNameChangeForm.markAllAsTouched();

    if (this.guarantNameChangeForm.invalid || !this.contactId) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const raw = this.guarantNameChangeForm.getRawValue();

    const newGuarantorName = (raw.grtNewMailingName || '').trim().toLowerCase();
    const subscriberName = (raw.suscrName || '').trim().toLowerCase();

    this.sameNameWarning = !!(newGuarantorName && subscriberName && newGuarantorName === subscriberName);

    this.pendingRaw    = raw;
    this.pendingReason = raw.reason;

    this.pendingAudit = this.auth.buildAudit(
      'GUARANTOR_NAME_CHANGE',
      {
        oldData: {
          name: raw.grtOldName,
          surname: raw.grtOldSurname,
          mailingName: raw.grtOldMailingName
        },
        newData: {
          name: raw.grtNewName,
          surname: raw.grtNewSurname,
          mailingName: raw.grtNewMailingName
        }
      },
      raw.reason
    );

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.pendingAudit = null;
    this.pendingRaw = null;
    this.sameNameWarning = false;
  }

  // Step 2: fires only after user clicks "Yes, Save" in the modal
  confirmSave(): void {
    if (!this.pendingAudit || !this.pendingRaw) return;

    const raw = this.pendingRaw;

    this.showConfirmModal = false;
    this.saving.set(true);

    this.service.updateSubscriberGuarantorName(
      this.branchschema,
      this.chitgroup_id,
      this.f['ticket'].value,
      this.contactId,
      raw.grtNewName,
      raw.grtNewMailingName,
      raw.grtNewSurname
    ).subscribe({
      next: (res: any) => {
        // backend returns plain text: "Success" or an error message
        if (!res || res.trim().toLowerCase() !== 'success') {
          this.saving.set(false);
          alert(res || 'Update failed');
          return;
        }

        this.service.saveData([this.pendingAudit]).subscribe({
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
    this.guarantNameChangeForm.reset();
    this.initForm();
    this.resetFromBranch();
    this.sameNameWarning = false;
  }
}