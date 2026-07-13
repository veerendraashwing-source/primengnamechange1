
// import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { DatePicker } from 'primeng/datepicker';
// import { IconField } from 'primeng/iconfield';
// import { InputIcon } from 'primeng/inputicon';
// import { Button } from 'primeng/button';
// import { CommonService } from '../commonservice';

// @Component({
//   selector: 'app-changtermintndtcommencedt',
//   standalone: true,
//   templateUrl: './changtermintndtcommencedt.html',
//   imports: [CommonModule, ReactiveFormsModule, NgSelectModule, DatePicker, IconField, InputIcon, Button],
//   styles: [`
//     /* Edit / Cancel button consistent size */
//     .btn-sm.px-3 {
//       min-width: 72px;
//       height: 38px;
//     }

//     /* Make p-datepicker fill its col-md-4 column */
//     ::ng-deep .w-100.p-datepicker-input-icon-container,
//     ::ng-deep .w-100 .p-inputtext {
//       width: 100% !important;
//     }
//   `]
// })
// export class Changtermintndtcommencedt implements OnInit {

//   showForm = true;

//   branchlist: any[] = [];
//   groupList:  any[] = [];

//   branchschema:       string = '';
//   selectedBranchCode: string = '';

//   editMode = {
//     commencement: false,
//     certificate:  false,
//     pso:          false
//   };

//   private fb      = inject(FormBuilder);
//   private service = inject(CommonService);
//   private cdr     = inject(ChangeDetectorRef);   // ← fixes "click-once-to-see" issue

//   changForm = this.fb.group({
//     cao:   ['', Validators.required],
//     group: [{ value: '', disabled: true }, Validators.required],

//     noActions:      [{ value: '', disabled: true }],
//     certificateNo:  [{ value: '', disabled: true }],
//     psoNo:          [{ value: '', disabled: true }],
//     commencementDt: [{ value: null as Date | null, disabled: true }],
//     terminationDt:  [{ value: null as Date | null, disabled: true }],

//     newCommencementDt: [null as Date | null],
//     newTerminationDt:  [{ value: null as Date | null, disabled: true }],
//     newCertificateNo:  ['', [Validators.maxLength(20)]],
//     newPsoNo:          ['', [Validators.maxLength(20)]],

//     reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]]
//   });

//   ngOnInit(): void {
//     this.getBranches();
//     this.handleDependencies();
//   }

//   get f() {
//     return this.changForm.controls;
//   }

//   // ── Load branches ───────────────────────────────────────────────
//   getBranches(): void {
//     this.service.getBranchNames().subscribe({
//       next: res => {
//         this.branchlist = res || [];
//         this.cdr.markForCheck();   // ← ensure branch list renders immediately
//       },
//       error: err => console.error('Failed to load branches', err)
//     });
//   }

//   // ── Reactive listeners ──────────────────────────────────────────
//   handleDependencies(): void {
//     let prevCao:   any = null;
//     let prevGroup: any = null;

//     // 1. CAO change → find full branch object → load groups
//     this.f['cao'].valueChanges.subscribe(value => {
//       if (value !== prevCao) {
//         prevCao = value;
//         this.resetFromBranch();

//         if (value) {
//           const selected = this.branchlist.find(x => x.branch_name === value);
//           if (selected) this.onBranchSelect(selected);
//         }
//       }
//     });

//     // 2. Group change → find full group object → load details immediately
//     this.f['group'].valueChanges.subscribe(value => {
//       if (value !== prevGroup) {
//         prevGroup = value;
//         this.resetDisplayFields();

//         if (value) {
//           const selected = this.groupList.find(x => x.group_Code === value);
//           if (selected) this.onGroupSelect(selected);
//         }
//       }
//     });
//   }

//   // ── Branch selected → load group codes ─────────────────────────
//   onBranchSelect(event: any): void {
//     if (!event) return;

//     this.branchschema       = event.branch_code;
//     this.selectedBranchCode = event.branch_code;

//     this.f['group'].enable();
//     this.f['group'].markAsUntouched();

//     this.service.getGroupCode(this.branchschema).subscribe({
//       next: res => {
//         this.groupList = res || [];
//         this.cdr.markForCheck();   // ← group list renders immediately after branch select
//       },
//       error: err => {
//         console.error('Failed to load groups', err);
//         this.groupList = [];
//       }
//     });
//   }

//   // ── Group selected → auto-bind chit group details IMMEDIATELY ───
//   onGroupSelect(event: any): void {
//     if (!event) return;

//     this.service.getChitGroupDetails(this.branchschema, event.group_Code).subscribe({
//       next: res => {
//         if (!res || res.length === 0) return;
//         const d = res[0];

//         // patchValue runs synchronously — fields appear right away
//         this.changForm.patchValue({
//           noActions:      d.no_of_auctions              ?? '',
//           certificateNo:  d.commencement_certificate_no ?? '',
//           psoNo:          d.pso_number                   ?? '',
//           commencementDt: d.commencement_date ? new Date(d.commencement_date) : null,
//           terminationDt:  d.termination_date  ? new Date(d.termination_date)  : null
//         });

//         this.cdr.detectChanges();
//       },
//       error: err => console.error('Failed to load chit group details', err)
//     });
//   }

//   // ── Toggle individual edit mode ─────────────────────────────────
//   toggleEdit(field: 'commencement' | 'certificate' | 'pso'): void {
//     this.editMode[field] = !this.editMode[field];

//     // When closing commencement edit → clear both new date fields
//     if (field === 'commencement' && !this.editMode.commencement) {
//       this.changForm.patchValue({ newCommencementDt: null });
//       this.f['newTerminationDt'].enable();
//       this.f['newTerminationDt'].setValue(null);
//       this.f['newTerminationDt'].disable();
//     }

//     // When closing pso edit → clear new pso field
//     if (field === 'pso' && !this.editMode.pso) {
//       this.changForm.patchValue({ newPsoNo: '' });
//     }

//     // When closing certificate edit → clear new certificate field
//     if (field === 'certificate' && !this.editMode.certificate) {
//       this.changForm.patchValue({ newCertificateNo: '' });
//     }
//   }

//   // ── Auto-compute new termination date ──────────────────────────
//   // Formula: newTerminationDt = newCommencementDt + noActions months - 1 day
//   onCommencementChange(): void {
//     const start  = this.f['newCommencementDt'].value;
//     const months = Number(this.f['noActions'].value);

//     if (start && months) {
//       const result = new Date(start);
//       result.setMonth(result.getMonth() + months);
//       result.setDate(result.getDate() - 1);

//       this.f['newTerminationDt'].enable();
//       this.f['newTerminationDt'].setValue(result);
//       this.f['newTerminationDt'].disable();
//     } else {
//       this.f['newTerminationDt'].enable();
//       this.f['newTerminationDt'].setValue(null);
//       this.f['newTerminationDt'].disable();
//     }
//   }

//   // ── Save: update DB + audit log in one click ────────────────────
//   confirmSave(): void {
//     this.changForm.markAllAsTouched();
//     this.f['group'].markAsTouched();

//     if (this.changForm.invalid) {
//       alert('Please fill all required fields correctly.');
//       return;
//     }

//     if (!this.editMode.commencement && !this.editMode.certificate && !this.editMode.pso) {
//       alert('No changes made. Click the Edit button next to a field to modify it.');
//       return;
//     }

//     const raw      = this.changForm.getRawValue();
//     const oldData: any = {};
//     const newData: any = {};

//     if (this.editMode.commencement) {
//       oldData.commencement_date = raw.commencementDt;
//       newData.commencement_date = raw.newCommencementDt;
//       oldData.termination_date  = raw.terminationDt;
//       newData.termination_date  = raw.newTerminationDt;
//     }

//     if (this.editMode.certificate) {
//       oldData.commencement_certificate_no = raw.certificateNo;
//       newData.commencement_certificate_no = raw.newCertificateNo;
//     }

//     if (this.editMode.pso) {
//       oldData.pso_number = raw.psoNo;
//       newData.pso_number = raw.newPsoNo;
//     }

//     const payload = {
//       groupcode: raw.group,
//       ...newData
//     };

//     const auditEntry = {
//       login:      'admin',
//       changeType: 'Termination&Commence_DATEChange',
//       oldData,
//       newData,
//       reason:    raw.reason,
//       loginTime: new Date().toISOString()
//     };

//     this.service.updateChitGroup(this.branchschema, payload).subscribe({
//       next: () => {
//         this.service.saveData([auditEntry]).subscribe({
//           next: () => {
//             alert('Updated successfully.');
//             this.clear();
//           },
//           error: err => {
//             console.error('Audit save failed', err);
//             alert('Record updated but audit log could not be saved.');
//           }
//         });
//       },
//       error: err => {
//         console.error('Update failed', err);
//         alert('Failed to update. Please try again.');
//       }
//     });
//   }

//   resetFromBranch(): void {
//     this.branchschema       = '';
//     this.selectedBranchCode = '';
//     this.groupList          = [];

//     this.f['group'].disable();
//     this.f['group'].setValue('');
//     this.f['group'].markAsUntouched();

//     this.resetDisplayFields();
//   }

//   resetDisplayFields(): void {
//     this.changForm.patchValue({
//       noActions:         '',
//       certificateNo:     '',
//       psoNo:             '',
//       commencementDt:    null,
//       terminationDt:     null,
//       newCommencementDt: null,
//       newCertificateNo:  '',
//       newPsoNo:          ''
//     });

//     this.f['newTerminationDt'].enable();
//     this.f['newTerminationDt'].setValue(null);
//     this.f['newTerminationDt'].disable();

//     this.editMode = { commencement: false, certificate: false, pso: false };
//   }

//   clear(): void {
//     this.changForm.reset();
//     this.resetFromBranch();

//     this.f['noActions'].disable();
//     this.f['commencementDt'].disable();
//     this.f['terminationDt'].disable();
//     this.f['certificateNo'].disable();
//     this.f['psoNo'].disable();
//     this.f['newTerminationDt'].disable();

//     this.editMode = { commencement: false, certificate: false, pso: false };
//   }
// }



import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { DatePicker } from 'primeng/datepicker';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-changtermintndtcommencedt',
  standalone: true,
  templateUrl: './changtermintndtcommencedt.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressBarModule,
    DatePicker
  ]
})
export class Changtermintndtcommencedt implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  groupList:  any[] = [];

  branchschema:       string = '';
  selectedBranchCode: string = '';

  editMode = {
    commencement: false,
    certificate:  false,
    pso:          false
  };

  private fb      = inject(FormBuilder);
  private service = inject(CommonService);
  private cdr     = inject(ChangeDetectorRef);
  private auth    = inject(Auth);

  changForm = this.fb.group({
    cao:   ['', Validators.required],
    group: [{ value: '', disabled: true }, Validators.required],

    noActions:      [{ value: '', disabled: true }],
    certificateNo:  [{ value: '', disabled: true }],
    psoNo:          [{ value: '', disabled: true }],
    commencementDt: [{ value: null as Date | null, disabled: true }],
    terminationDt:  [{ value: null as Date | null, disabled: true }],

    newCommencementDt: [null as Date | null],
    newTerminationDt:  [{ value: null as Date | null, disabled: true }],
    newCertificateNo:  ['', [Validators.maxLength(20)]],
    newPsoNo:          ['', [Validators.maxLength(20)]],

    reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]]
  });

  ngOnInit(): void {
    this.getBranches();
    this.handleDependencies();
  }

  get f() {
    return this.changForm.controls;
  }

  getBranches(): void {
    this.service.getBranchNames().subscribe({
      next: res => {
        this.branchlist = res || [];
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load branches', err)
    });
  }

  handleDependencies(): void {
    let prevCao:   any = null;
    let prevGroup: any = null;

    this.f['cao'].valueChanges.subscribe(value => {
      if (value !== prevCao) {
        prevCao = value;
        this.resetFromBranch();

        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.f['group'].valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        prevGroup = value;
        this.resetDisplayFields();

        if (value) {
          const selected = this.groupList.find(x => x.group_Code === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });
  }

  onBranchSelect(event: any): void {
    if (!event) return;

    this.branchschema       = event.branch_code;
    this.selectedBranchCode = event.branch_code;

    this.f['group'].enable();
    this.f['group'].markAsUntouched();

    this.service.getGroupCode(this.branchschema).subscribe({
      next: res => {
        this.groupList = res || [];
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load groups', err);
        this.groupList = [];
      }
    });
  }

  onGroupSelect(event: any): void {
    if (!event) return;

    this.service.getChitGroupDetails(this.branchschema, event.group_Code).subscribe({
      next: res => {
        if (!res || res.length === 0) return;
        const d = res[0];

        this.changForm.patchValue({
          noActions:      d.no_of_auctions              ?? '',
          certificateNo:  d.commencement_certificate_no ?? '',
          psoNo:          d.pso_number                   ?? '',
          commencementDt: d.commencement_date ? new Date(d.commencement_date) : null,
          terminationDt:  d.termination_date  ? new Date(d.termination_date)  : null
        });

        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load chit group details', err)
    });
  }

  toggleEdit(field: 'commencement' | 'certificate' | 'pso'): void {
    this.editMode[field] = !this.editMode[field];

    if (field === 'commencement' && !this.editMode.commencement) {
      this.changForm.patchValue({ newCommencementDt: null });
      this.f['newTerminationDt'].enable();
      this.f['newTerminationDt'].setValue(null);
      this.f['newTerminationDt'].disable();
    }

    if (field === 'pso' && !this.editMode.pso) {
      this.changForm.patchValue({ newPsoNo: '' });
    }

    if (field === 'certificate' && !this.editMode.certificate) {
      this.changForm.patchValue({ newCertificateNo: '' });
    }
  }

  onCommencementChange(): void {
    const start  = this.f['newCommencementDt'].value;
    const months = Number(this.f['noActions'].value);

    if (start && months) {
      const result = new Date(start);
      result.setMonth(result.getMonth() + months);
      result.setDate(result.getDate() - 1);

      this.f['newTerminationDt'].enable();
      this.f['newTerminationDt'].setValue(result);
      this.f['newTerminationDt'].disable();
    } else {
      this.f['newTerminationDt'].enable();
      this.f['newTerminationDt'].setValue(null);
      this.f['newTerminationDt'].disable();
    }
  }

  confirmSave(): void {
    this.changForm.markAllAsTouched();
    this.f['group'].markAsTouched();

    if (this.changForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    if (!this.editMode.commencement && !this.editMode.certificate && !this.editMode.pso) {
      alert('No changes made. Click the Edit button next to a field to modify it.');
      return;
    }

    this.saving.set(true);

    const raw      = this.changForm.getRawValue();
    const oldData: any = {};
    const newData: any = {};

    if (this.editMode.commencement) {
      oldData.commencement_date = raw.commencementDt;
      newData.commencement_date = raw.newCommencementDt;
      oldData.termination_date  = raw.terminationDt;
      newData.termination_date  = raw.newTerminationDt;
    }

    if (this.editMode.certificate) {
      oldData.commencement_certificate_no = raw.certificateNo;
      newData.commencement_certificate_no = raw.newCertificateNo;
    }

    if (this.editMode.pso) {
      oldData.pso_number = raw.psoNo;
      newData.pso_number = raw.newPsoNo;
    }

    const payload = {
      groupcode: raw.group,
      ...newData
    };

    const auditEntry = this.auth.buildAudit(
      'Termination&Commence_DATEChange',
      { oldData, newData },
      raw.reason ?? ''
    );

    this.service.updateChitGroup(this.branchschema, payload).subscribe({
      next: () => {
        this.service.saveData([auditEntry]).subscribe({
          next: () => {
            this.saving.set(false);
            alert('Updated successfully.');
            this.clear();
          },
          error: err => {
            this.saving.set(false);
            console.error('Audit save failed', err);
            alert('Record updated but audit log could not be saved.');
          }
        });
      },
      error: err => {
        this.saving.set(false);
        console.error('Update failed', err);
        alert('Failed to update. Please try again.');
      }
    });
  }

  resetFromBranch(): void {
    this.branchschema       = '';
    this.selectedBranchCode = '';
    this.groupList          = [];

    this.f['group'].disable();
    this.f['group'].setValue('');
    this.f['group'].markAsUntouched();

    this.resetDisplayFields();
  }

  resetDisplayFields(): void {
    this.changForm.patchValue({
      noActions:         '',
      certificateNo:     '',
      psoNo:             '',
      commencementDt:    null,
      terminationDt:     null,
      newCommencementDt: null,
      newCertificateNo:  '',
      newPsoNo:          ''
    });

    this.f['newTerminationDt'].enable();
    this.f['newTerminationDt'].setValue(null);
    this.f['newTerminationDt'].disable();

    this.editMode = { commencement: false, certificate: false, pso: false };
  }

  clear(): void {
    this.changForm.reset();
    this.resetFromBranch();

    this.f['noActions'].disable();
    this.f['commencementDt'].disable();
    this.f['terminationDt'].disable();
    this.f['certificateNo'].disable();
    this.f['psoNo'].disable();
    this.f['newTerminationDt'].disable();

    this.editMode = { commencement: false, certificate: false, pso: false };
  }
}