// import { Component, OnInit, inject } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { CommonService } from '../commonservice';

// @Component({
//   selector: 'app-bidlosspermission',
//   standalone: true,
//   templateUrl: './bidlosspermission.html',
//   imports: [CommonModule, ReactiveFormsModule, NgSelectModule]
// })
// export class Bidlosspermission implements OnInit {
//   showForm = true;
//   branchlist: any[] = [];
//   branch_code: any[] = [];
//   auctions: any[] = [];

//   branchschema!: string;
//   groupCode!: number;

//   bidlossPermissionForm!: FormGroup;

//   private fb = inject(FormBuilder);
//   private service = inject(CommonService);

//   ngOnInit(): void {
//     this.initForm();
//     this.getBranches();
//     this.handleDependencies();
//   }

//   // 🔹 FORM INIT
//   initForm() {
//     this.bidlossPermissionForm = this.fb.group({
//       cao: ['', Validators.required],
//       group: [{ value: '', disabled: true }, Validators.required],
//       auction_number: [{ value: '', disabled: true }, Validators.required],
//       ticketNo: [''],
//       isConfirmed: [false, Validators.requiredTrue],
//       // bidloss_allow_status: [false, Validators.requiredTrue],
//       reason: ['', [
//         Validators.required,
//         Validators.minLength(10),
//         Validators.maxLength(200)
//       ]]
//     });
//   }

//   get f() {
//     return this.bidlossPermissionForm.controls;
//   }

//   // 🔥 DEPENDENCIES
//   handleDependencies() {

//     this.f['cao'].valueChanges.subscribe(val => {
//       this.resetFromBranch();
//       if (val) {
//         const selected = this.branchlist.find(x => x.branch_name === val);
//         if (selected) this.loadGroups(selected);
//       }
//     });

//     this.f['group'].valueChanges.subscribe(val => {
//       this.resetFromGroup();
//       if (val) {
//         const selected = this.branch_code.find(x => x.group_Code === val);
//         if (selected) this.loadAuctions(selected);
//       }
//     });

//     this.f['auction_number'].valueChanges.subscribe(val => {
//       if (val) {
//         const selected = this.auctions.find(x => x.auction_number === val);
//         if (selected) this.bindTicket(selected);
//       }
//     });
//   }

//   resetFromBranch() {
//     this.branchschema = '';
//     this.groupCode = 0;
//     this.bidlossPermissionForm.patchValue({
//       group: '',
//       auction_number: '',
//       ticketNo: ''
//     });

//     this.f['group'].disable();
//     this.f['auction_number'].disable();

//     this.branch_code = [];
//     this.auctions = [];
//   }

//   resetFromGroup() {
//     this.groupCode = 0;

//     this.bidlossPermissionForm.patchValue({
//       auction_number: '',
//       ticketNo: ''
//     });

//     this.f['auction_number'].disable();
//     this.auctions = [];
//   }

//   getBranches() {
//     this.service.getBranchNames()
//       .subscribe(res => this.branchlist = res || []);
//   }

//   loadGroups(branch: any) {
//     this.branchschema = branch.branch_code;

//     this.f['group'].enable();

//     this.service.getGroupCode(this.branchschema)
//       .subscribe(res => this.branch_code = res || []);
//   }

//   loadAuctions(group: any) {

//     this.groupCode = group.chitgroup_id || group.group_Code;

//     this.f['auction_number'].enable();

//     this.service.getAuctionNumbers(this.branchschema, this.groupCode)
//       .subscribe({
//         next: (res: any[]) => this.auctions = res || [],
//         error: () => alert('Failed to load auctions')
//       });
//   }

//   bindTicket(auction: any) {
//     this.bidlossPermissionForm.patchValue({
//       ticketNo: auction.ticketno || auction.ticketNo
//     });
//   }

//   confirmSave() {
//     this.bidlossPermissionForm.markAllAsTouched();

//     if (this.bidlossPermissionForm.invalid) {
//       alert('Please fill all required fields');
//       return;
//     }

//     let reason = this.f['reason'].value?.trim();
//     let auction_number = this.f['auction_number'].value;
//     let ticketNo = this.f['ticketNo'].value;

//     this.service.updateBidLossPermission(
//       this.branchschema,
//       auction_number,
//       ticketNo,
//       this.groupCode
//     ).subscribe({

//       next: () => {

//         const audit = {
//           schemaName: this.branchschema,
//           loginName: 'admin',
//           loginTime: new Date().toISOString(),
//           changeType: 'BID_LOSS_PERMISSION',
//           // payload: {
//           //   narration: `Bid loss permission enabled for Ticket ${ticketNo} in Auction ${auction_number}`
//           // },

//           reason: reason
//         };
//         this.service.saveData([audit]).subscribe({
//           next: () => {
//             alert('Updated & Audit Saved Successfully');
//             this.clear();
//           },
//           error: (err: any) => {
//             console.error(err);
//             alert('Updated, but audit failed');
//           }
//         });
//       },
//       error: (err: any) => {
//         console.error(err);
//         alert('Update failed');
//       }
//     });
//   }
//   clear() {
//     this.bidlossPermissionForm.reset();
//     this.resetFromBranch();
//   }
// }

import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from '../commonservice';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-bidlosspermission',
  standalone: true,
  templateUrl: './bidlosspermission.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    ButtonModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    DividerModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
  ]
})
export class Bidlosspermission implements OnInit {
  showForm = true;
  isSaving = false;

  branchlist: any[] = [];
  branch_code: any[] = [];
  auctions: any[] = [];

  branchschema!: string;
  groupCode!: number;

  bidlossPermissionForm!: FormGroup;

  // ─── confirm modal state ───────────────────────────
  showConfirmModal = false;
  pendingAuctionNumber = '';
  pendingTicketNo = '';
  pendingCao = '';
  pendingGroup = '';
  pendingReason = '';

  private fb = inject(FormBuilder);
  private service = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  // ── Form init ────────────────────────────────────────────────────
  initForm() {
    this.bidlossPermissionForm = this.fb.group({
      cao:            ['', Validators.required],
      group:          [{ value: '', disabled: true }, Validators.required],
      auction_number: [{ value: '', disabled: true }, Validators.required],
      ticketNo:       [''],
      isConfirmed:    [false, Validators.requiredTrue],
      reason:         ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
    });
  }

  get f() {
    return this.bidlossPermissionForm.controls;
  }

  // ── Confirm card click toggle ────────────────────────────────────
  toggleConfirm() {
    const current = this.f['isConfirmed'].value;
    this.bidlossPermissionForm.patchValue({ isConfirmed: !current });
  }

  // ── Dependencies ────────────────────────────────────────────────
  handleDependencies() {
    this.f['cao'].valueChanges.subscribe(val => {
      this.resetFromBranch();
      if (val) {
        const selected = this.branchlist.find(x => x.branch_name === val);
        if (selected) this.loadGroups(selected);
      }
    });

    this.f['group'].valueChanges.subscribe(val => {
      this.resetFromGroup();
      if (val) {
        const selected = this.branch_code.find(x => x.group_Code === val);
        if (selected) this.loadAuctions(selected);
      }
    });

    this.f['auction_number'].valueChanges.subscribe(val => {
      if (val) {
        const selected = this.auctions.find(x => x.auction_number === val);
        if (selected) this.bindTicket(selected);
      }
    });
  }

  resetFromBranch() {
    this.branchschema = '';
    this.groupCode = 0;
    this.bidlossPermissionForm.patchValue({ group: '', auction_number: '', ticketNo: '' });
    this.f['group'].disable();
    this.f['auction_number'].disable();
    this.branch_code = [];
    this.auctions = [];
  }

  resetFromGroup() {
    this.groupCode = 0;
    this.bidlossPermissionForm.patchValue({ auction_number: '', ticketNo: '' });
    this.f['auction_number'].disable();
    this.auctions = [];
  }

  getBranches() {
    this.service.getBranchNames()
      .subscribe(res => this.branchlist = res || []);
  }

  loadGroups(branch: any) {
    this.branchschema = branch.branch_code;
    this.f['group'].enable();
    this.service.getGroupCode(this.branchschema)
      .subscribe(res => this.branch_code = res || []);
  }

  loadAuctions(group: any) {
    this.groupCode = group.chitgroup_id || group.group_Code;
    this.f['auction_number'].enable();
    this.service.getAuctionNumbers(this.branchschema, this.groupCode)
      .subscribe({
        next: (res: any[]) => this.auctions = res || [],
        error: () => alert('Failed to load auctions')
      });
  }

  bindTicket(auction: any) {
    this.bidlossPermissionForm.patchValue({
      ticketNo: auction.ticketno || auction.ticketNo
    });
  }

  // ── Save flow ───────────────────────────────────────────────────
  // Step 1: validate + stage data, open confirm modal
  save(): void {
    this.bidlossPermissionForm.markAllAsTouched();

    if (this.bidlossPermissionForm.invalid) {
      alert('Please fill all required fields');
      return;
    }

    this.pendingCao           = this.f['cao'].value;
    this.pendingGroup         = this.f['group'].value;
    this.pendingAuctionNumber = this.f['auction_number'].value;
    this.pendingTicketNo      = this.f['ticketNo'].value;
    this.pendingReason        = this.f['reason'].value?.trim();

    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
  }

  // Step 2: fires only after user clicks "Yes, Save" in the modal
  confirmSave(): void {
    this.showConfirmModal = false;
    this.isSaving = true;

    this.service.updateBidLossPermission(
      this.branchschema,
      this.pendingAuctionNumber,
      this.pendingTicketNo,
      this.groupCode
    ).subscribe({
      next: () => {
        const audit = {
          schemaName : this.branchschema,
          loginName  : 'admin',
          loginTime  : new Date().toISOString(),
          changeType : 'BID_LOSS_PERMISSION',
          reason     : this.pendingReason
        };
        this.service.saveData([audit]).subscribe({
          next: () => {
            this.isSaving = false;
            alert('Updated & Audit Saved Successfully');
            this.clear();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            alert('Updated, but audit failed');
          }
        });
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error(err);
        alert('Update failed');
      }
    });
  }

  clear() {
    this.bidlossPermissionForm.reset();
    this.resetFromBranch();
  }
}