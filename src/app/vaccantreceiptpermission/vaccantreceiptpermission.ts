import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService } from '../commonservice';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-vaccantreceiptpermission',
  standalone: true,
  templateUrl: './vaccantreceiptpermission.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    DividerModule,
    ProgressBarModule
  ]
})
export class Vaccantreceiptpermission implements OnInit {

  showForm = true;
  isSaving = signal(false);

  // dropdown label truncation limit — entire-app convention
  readonly LABEL_MAXLEN = 25;

  branchlist: any[] = [];
  form!: FormGroup;

  private oldVacantStatus: boolean | null = null;

  // ── confirm modal state ──────────────────────────────
  showConfirmModal  = false;
  pendingBranchCode = '';
  pendingBranchName = '';
  pendingOldStatus: boolean | null = null;
  pendingNewStatus: boolean | null = null;
  pendingReason     = '';
  private pendingAudit: any = null;

  private fb         = inject(FormBuilder);
  private service    = inject(CommonService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleChanges();
  }

  initForm() {
    this.form = this.fb.group({
      cao:         ['', Validators.required],
      branch_code: [{ value: '', disabled: true }, Validators.required],
      isChecked:   [false],
      reason:      ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  get f() {
    return this.form.controls;
  }

  // Truncates any dropdown label to the app-wide 25 char limit
  truncate(label: string | null | undefined): string {
    if (!label) return '';
    return label.length > this.LABEL_MAXLEN
      ? label.slice(0, this.LABEL_MAXLEN) + '…'
      : label;
  }

  handleChanges() {
    this.f['cao'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(code => {
        const selected = this.branchlist.find(x => x.branch_code === code);

        if (selected) {
          this.form.patchValue({ branch_code: selected.branch_code });

          this.service.getVacantStatus().subscribe(res => {
            const list  = res || [];
            const match = list.find((x: any) => x.branch_code === selected.branch_code);

            if (match) {
              const currentStatus = !match.is_vacant_full_receipt_mandatory;
              this.f['isChecked'].setValue(currentStatus);

              this.oldVacantStatus = currentStatus;
            } else {
              this.oldVacantStatus = null;
            }
          });
        }
      });
  }

  getBranches() {
    this.service.getBranchNames()
      .subscribe(res => this.branchlist = res || []);
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c && c.touched && c.invalid);
  }

  hasError(name: string, error: string): boolean {
    const c = this.form.get(name);
    return !!(c && c.touched && c.hasError(error));
  }

  preventExceedLength(event: KeyboardEvent, max: number): void {
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

  // ── Save flow ─────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal (unchanged logic, just deferred)
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const branch_code = this.f['branch_code'].value;
    const newStatus   = this.f['isChecked'].value;
    const reason      = this.f['reason'].value?.trim();
    const selected    = this.branchlist.find(x => x.branch_code === branch_code);

    const oldData = {
      branchCode:                  branch_code,
      vacantFullReceiptPermission: this.oldVacantStatus ?? null
    };

    const newData = {
      branchCode:                  branch_code,
      vacantFullReceiptPermission: newStatus
    };

    this.pendingAudit = {
      schemaName: branch_code,
      loginName:  'admin',
      loginTime:  new Date().toISOString(),
      changeType: 'VACANT_RECEIPT_PERMISSION',
      oldData:    oldData,
      newData:    newData,
      reason:     reason
    };

    this.pendingBranchCode = branch_code;
    this.pendingBranchName = selected?.branch_name || branch_code;
    this.pendingOldStatus  = this.oldVacantStatus;
    this.pendingNewStatus  = newStatus;
    this.pendingReason     = reason;

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.pendingAudit = null;
  }

  // Step 2: original save() body, now fires only after "Yes, Save"
  confirmSave(): void {
    if (!this.pendingAudit) return;

    this.showConfirmModal = false;
    this.isSaving.set(true);

    this.service.updateVacantStatus(this.pendingBranchCode).subscribe({
      next: () => {
        this.service.saveData([this.pendingAudit]).subscribe({
          next: () => {
            this.isSaving.set(false);
            alert('Saved Successfully & Audit Saved');
            this.clear();
          },
          error: (err: any) => {
            this.isSaving.set(false);
            console.error('Audit save failed:', err);
            alert('Saved, but audit failed');
          }
        });
      },
      error: () => {
        this.isSaving.set(false);
        alert('Save Failed');
      }
    });
  }

  clear() {
    this.form.reset();
    this.oldVacantStatus = null;
    this.pendingAudit = null;
  }
}