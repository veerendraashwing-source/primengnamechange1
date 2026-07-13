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
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CommonService } from '../commonservice';
import { Auth } from '../auth';

@Component({
  selector: 'app-auctiondatetime',
  standalone: true,
  templateUrl: './auctiondatetime.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    ButtonModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    DividerModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ProgressBarModule
  ]
})
export class Auctiondatetime implements OnInit {

  showForm = true;
  saving = signal(false);

  branchlist: any[] = [];
  branch_code: any[] = [];

  branchschema: string | null = null;
  groupCode: number | null = null;
  chitgroup_id: any;

  auctionscduleForm!: FormGroup;

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  pendingUpdatePayload: any = null;
  pendingAudit: any = null;
  pendingOldDate = '';
  pendingOldTime = '';
  pendingNewDate = '';
  pendingNewTime = '';
  pendingReason  = '';

  private fb      = inject(FormBuilder);
  private service = inject(CommonService);
  private auth    = inject(Auth);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  // ── Form init ────────────────────────────────────────────────────
  initForm() {
    this.auctionscduleForm = this.fb.group({
      cao:            ['', Validators.required],
      group:          [{ value: '', disabled: true }, Validators.required],
      auction_date:   [''],
      auction_time:   [''],
      newauctiondate: ['', Validators.required],
      newauctiontime: ['', [
        Validators.required,
        Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      ]],
      reason: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  get f() {
    return this.auctionscduleForm.controls;
  }

  // ── Dependencies (mirrors businesschange's prev-value tracking) ──
  handleDependencies() {
    let prevCao: any = null;
    let prevGroup: any = null;

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
          const selected = this.branch_code.find(x => x.chitgroup_id === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });
  }

  resetFromBranch() {
    this.branchschema = null;
    this.branch_code  = [];

    this.auctionscduleForm.patchValue({ group: '' });
    this.resetFromGroup();

    this.f['group'].disable();
  }

  resetFromGroup() {
    this.groupCode    = null;
    this.chitgroup_id = null;

    this.auctionscduleForm.patchValue({ auction_date: '', auction_time: '' });
  }

  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }

  onBranchSelect(branch: any) {
    if (!branch) return;
    this.branchschema = branch.branch_code;
    this.f['group'].enable();
    this.service.getGroupCode(this.branchschema!)
      .subscribe(res => this.branch_code = res || []);
  }

  onGroupSelect(group: any) {
    if (!group) return;
    this.chitgroup_id = group.chitgroup_id;
    this.groupCode    = group.chitgroup_id;

    this.service.getAuctionSchedule(this.branchschema!, this.chitgroup_id)
      .subscribe((res: any[]) => {
        if (res && res.length > 0) {
          const data          = res[0];
          const formattedDate = data.auction_date ? data.auction_date.split('T')[0] : '';
          this.auctionscduleForm.patchValue({
            auction_date: formattedDate,
            auction_time: data.auction_time || ''
          });
        } else {
          this.auctionscduleForm.patchValue({ auction_date: '', auction_time: '' });
        }
      });
  }

  // ── p-datepicker returns a Date object — normalise to YYYY-MM-DD string
  private toDateString(value: any): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().substring(0, 10);
    return String(value).substring(0, 10);
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal
  save(): void {
    this.auctionscduleForm.markAllAsTouched();

    if (this.auctionscduleForm.invalid || !this.branchschema || !this.groupCode) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const auction_date   = this.f['auction_date'].value;
    const auction_time   = this.f['auction_time'].value;
    const newauctiondate = this.toDateString(this.f['newauctiondate'].value);
    const newauctiontime = this.f['newauctiontime'].value;

    if (auction_date === newauctiondate && auction_time === newauctiontime) {
      alert('No changes detected');
      return;
    }

    const reason = this.f['reason'].value?.trim();

    this.pendingOldDate = auction_date || '—';
    this.pendingOldTime = auction_time || '—';
    this.pendingNewDate = newauctiondate;
    this.pendingNewTime = newauctiontime;
    this.pendingReason  = reason;

    this.pendingUpdatePayload = {
      branch_code  : this.branchschema,
      chitgroup_id : this.chitgroup_id,
      newauctiondate,
      newauctiontime
    };

    this.pendingAudit = this.auth.buildAudit(
      'AUCTION_DATE_TIME_CHANGE',
      {
        oldData: { date: auction_date, time: auction_time },
        newData: { date: newauctiondate, time: newauctiontime }
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

    this.service.updateAuctionSchedule(this.pendingUpdatePayload).subscribe({
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
    this.auctionscduleForm.reset();
    this.initForm();
    this.resetFromBranch();
  }
}



// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { CommonService } from '../commonservice';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DividerModule } from 'primeng/divider';
// import { TagModule } from 'primeng/tag';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';

// @Component({
//   selector: 'app-auctiondatetime',
//   standalone: true,
//   templateUrl: './auctiondatetime.html',
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     // PrimeNG
//     ButtonModule,
//     SelectModule,
//     InputTextModule,
//     TextareaModule,
//     DatePickerModule,
//     DividerModule,
//     TagModule,
//     IconFieldModule,
//     InputIconModule,
//   ]
// })
// export class Auctiondatetime implements OnInit {

//   showForm = true;

//   branchlist: any[] = [];
//   branch_code: any[] = [];

//   branchschema: string | null = null;
//   groupCode: number | null = null;
//   chitgroup_id: any;

//   auctionscduleForm!: FormGroup;

//   private fb      = inject(FormBuilder);
//   private service = inject(CommonService);

//   ngOnInit(): void {
//     this.initForm();
//     this.getBranches();
//     this.handleDependencies();
//   }

//   // ── Form init ────────────────────────────────────────────────────
//   initForm() {
//     this.auctionscduleForm = this.fb.group({
//       cao:            ['', Validators.required],
//       group:          [{ value: '', disabled: true }, Validators.required],
//       auction_date:   [''],
//       auction_time:   [''],
//       newauctiondate: ['', Validators.required],
//       newauctiontime: ['', [
//         Validators.required,
//         Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
//       ]],
//       reason: ['', [
//         Validators.required,
//         Validators.minLength(10),
//         Validators.maxLength(200)
//       ]]
//     });
//   }

//   get f() {
//     return this.auctionscduleForm.controls;
//   }

//   // ── Dependencies ────────────────────────────────────────────────
//   handleDependencies() {
//     this.f['cao'].valueChanges.subscribe(value => {
//       this.resetFromBranch();
//       if (!value) return;
//       const selected = this.branchlist.find(x => x.branch_name === value);
//       if (selected) this.onBranchSelect(selected);
//     });

//     this.f['group'].valueChanges.subscribe(value => {
//       this.resetFromGroup();
//       if (!value) return;
//       const selected = this.branch_code.find(x => x.chitgroup_id === value);
//       if (selected) this.onGroupSelect(selected);
//     });
//   }

//   resetFromBranch() {
//     this.branchschema = null;
//     this.branch_code  = [];
//     this.auctionscduleForm.patchValue({ group: '', auction_date: '', auction_time: '' });
//     this.f['group'].disable();
//   }

//   resetFromGroup() {
//     this.groupCode    = null;
//     this.chitgroup_id = null;
//     this.auctionscduleForm.patchValue({ auction_date: '', auction_time: '' });
//   }

//   getBranches() {
//     this.service.getBranchNames().subscribe({
//       next: (res: any) => this.branchlist = res || [],
//       error: () => alert('Failed to load branches')
//     });
//   }

//   onBranchSelect(branch: any) {
//     this.branchschema = branch.branch_code;
//     this.f['group'].enable();
//     this.service.getGroupCode(this.branchschema!).subscribe({
//       next: (res: any) => this.branch_code = res || [],
//       error: () => alert('Failed to load groups')
//     });
//   }

//   onGroupSelect(group: any) {
//     this.chitgroup_id = group.chitgroup_id;
//     this.groupCode    = group.chitgroup_id;

//     this.service.getAuctionSchedule(this.branchschema!, this.chitgroup_id).subscribe({
//       next: (res: any[]) => {
//         if (res && res.length > 0) {
//           const data          = res[0];
//           const formattedDate = data.auction_date ? data.auction_date.split('T')[0] : '';
//           this.auctionscduleForm.patchValue({
//             auction_date: formattedDate,
//             auction_time: data.auction_time || ''
//           });
//         } else {
//           this.auctionscduleForm.patchValue({ auction_date: '', auction_time: '' });
//         }
//       },
//       error: () => alert('Failed to load auction schedule')
//     });
//   }

//   // ── p-datepicker returns a Date object — normalise to YYYY-MM-DD string
//   private toDateString(value: any): string {
//     if (!value) return '';
//     if (value instanceof Date) return value.toISOString().substring(0, 10);
//     return String(value).substring(0, 10);
//   }

//   // ── Save ─────────────────────────────────────────────────────────
//   confirmSave() {
//     this.auctionscduleForm.markAllAsTouched();

//     if (this.auctionscduleForm.invalid) return;

//     if (!this.branchschema || !this.groupCode) {
//       alert('Please select CAO and Group');
//       return;
//     }

//     const auction_date   = this.f['auction_date'].value;
//     const auction_time   = this.f['auction_time'].value;
//     const newauctiondate = this.toDateString(this.f['newauctiondate'].value);
//     const newauctiontime = this.f['newauctiontime'].value;

//     if (auction_date === newauctiondate && auction_time === newauctiontime) {
//       alert('No changes detected');
//       return;
//     }

//     const reason = this.f['reason'].value?.trim();

//     const updatePayload = {
//       branch_code  : this.branchschema,
//       chitgroup_id : this.chitgroup_id,
//       newauctiondate,
//       newauctiontime
//     };

//     const audit = {
//       schemaName : this.branchschema,
//       loginName  : 'admin',
//       loginTime  : new Date().toISOString(),
//       changeType : 'AUCTION_DATE_TIME_CHANGE',
//       payload    : {
//         oldData: { date: auction_date, time: auction_time },
//         newData: { date: newauctiondate, time: newauctiontime }
//       },
//       reason
//     };

//     this.service.updateAuctionSchedule(updatePayload).subscribe({
//       next: () => {
//         this.service.saveData([audit]).subscribe({
//           next: () => { alert('Updated Successfully & Audit Saved'); this.clear(); },
//           error: (err: any) => { console.error('Audit save failed:', err); alert('Updated, but audit failed'); }
//         });
//       },
//       error: (err: any) => { console.error('Update failed:', err); alert('Update failed'); }
//     });
//   }

//   clear() {
//     this.auctionscduleForm.reset();
//     this.resetFromBranch();
//     this.f['group'].disable();
//   }
// }