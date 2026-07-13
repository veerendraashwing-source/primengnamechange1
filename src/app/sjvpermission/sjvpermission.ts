import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService } from '../commonservice';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sjvpermission',
  standalone: true,
  templateUrl: './sjvpermission.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    DividerModule,
    ProgressBarModule
  ]
})
export class Sjvpermission implements OnInit {

  showForm = true;
  isSaving = signal(false);

  branchlist: any[] = [];
  sjvlist:    any[] = [];
  form!: FormGroup;

  private oldSjvStatus: boolean | null = null;

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
      cao:       ['', Validators.required],
      sjv_no:    ['', Validators.required],
      isChecked: [false],
      reason:    ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  get f() {
    return this.form.controls;
  }

  handleChanges() {
    this.f['cao'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(code => {
        this.form.patchValue({ sjv_no: '' });
        this.f['isChecked'].setValue(false);   // reset checkbox on branch change
        this.oldSjvStatus = null;
        this.sjvlist = [];

        if (code) {
          this.service.getSjvNo(code).subscribe({
            next: (res: any[]) => {
              this.sjvlist = res || [];
            },
            error: () => {
              this.sjvlist = [];
            }
          });
        }
      });

    this.f['sjv_no'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(transNo => {
        this.f['isChecked'].setValue(false);   // reset checkbox on SJV change — user must tick manually
        if (transNo) {
          const match = this.sjvlist.find(x => x.transacion_no === transNo);
          if (match) {
            this.oldSjvStatus = true;          // track old status but don't auto-tick
          } else {
            this.oldSjvStatus = null;
          }
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

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const branch_code = this.f['cao'].value;
    const sjv_no      = this.f['sjv_no'].value;
    const isChecked    = this.f['isChecked'].value;
    const reason      = this.f['reason'].value?.trim();

    if (!isChecked) {
      alert('Please tick the checkbox to confirm the transaction type change.');
      return;
    }

    const oldData = {
      branchCode:      branch_code,
      sjvNo:           sjv_no,
      transactionType: 'A'
    };

    const newData = {
      branchCode:      branch_code,
      sjvNo:           sjv_no,
      transactionType: 'M'
    };

    const audit = {
      schemaName: branch_code,
      loginName:  'admin',
      loginTime:  new Date().toISOString(),
      changeType: 'SJV_CANCEL_PERMISSION',
      oldData,
      newData,
      reason
    };

    this.isSaving.set(true);

    this.service.updateSjvStatus(branch_code, sjv_no).subscribe({
      next: () => {
        this.service.saveData([audit]).subscribe({
          next: () => {
            this.isSaving.set(false);
            alert('Saved Successfully & Audit Saved');
            this.clear();
          },
          error: (err: any) => {
            this.isSaving.set(false);
            console.error('Audit save failed:', err);
            alert('Saved, but audit log failed');
          }
        });
      },
      error: () => {
        this.isSaving.set(false);
        alert('Update Failed');
      }
    });
  }

  clear() {
    this.form.reset();
    this.sjvlist      = [];
    this.oldSjvStatus = null;
  }
}