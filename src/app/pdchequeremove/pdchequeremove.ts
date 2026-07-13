import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonService } from '../commonservice';

@Component({
  selector: 'app-pdchequeremove',
  standalone: true,
  templateUrl: './pdchequeremove.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    TableModule,
    CheckboxModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressBarModule
  ]
})
export class Pdchequeremove implements OnInit {

  showForm = true;
  isSaving = false;

  branchlist: any[] = [];
  groupList: any[] = [];
  tickets: any[] = [];
  chequeRecords: any[] = [];
  selectedCheques: any[] = [];

  branchschema: any;
  branch_code: any;

  pDChequeForm!: FormGroup;

  private fb      = inject(FormBuilder);
  private service  = inject(CommonService);
  private cdr      = inject(ChangeDetectorRef);

  // ══════════════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.initForm();
    this.getBranches();
    this.handleDependencies();
  }

  // ── Form init ──────────────────────────────────────────────────────
  initForm() {
    this.pDChequeForm = this.fb.group({
      cao:    ['', Validators.required],
      group:  [{ value: '', disabled: true }, Validators.required],
      ticket: [{ value: '', disabled: true }, Validators.required]
    });
  }

  // ── Cascade dependencies ───────────────────────────────────────────
  handleDependencies() {
    let prevCao: any    = null;
    let prevGroup: any  = null;
    let prevTicket: any = null;

    this.pDChequeForm.get('cao')?.valueChanges.subscribe(value => {
      if (value !== prevCao) {
        this.resetFromBranch();
        prevCao = value;
        if (value) {
          const selected = this.branchlist.find(x => x.branch_name === value);
          if (selected) this.onBranchSelect(selected);
        }
      }
    });

    this.pDChequeForm.get('group')?.valueChanges.subscribe(value => {
      if (value !== prevGroup) {
        this.resetFromGroup();
        prevGroup = value;
        if (value) {
          const selected = this.groupList.find(x => x.groupcode === value);
          if (selected) this.onGroupSelect(selected);
        }
      }
    });

    this.pDChequeForm.get('ticket')?.valueChanges.subscribe(value => {
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

  // ── Reset helpers ──────────────────────────────────────────────────
  resetFromBranch() {
    this.branchschema = null;
    this.branch_code  = null;
    this.pDChequeForm.patchValue({ group: '', ticket: '' });
    this.resetFromGroup();
    this.pDChequeForm.get('group')?.disable();
    this.pDChequeForm.get('ticket')?.disable();
    this.groupList = [];
    this.tickets   = [];
  }

  resetFromGroup() {
    this.pDChequeForm.patchValue({ ticket: '' });
    this.resetFromTicket();
    this.pDChequeForm.get('ticket')?.disable();
    this.tickets = [];
  }

  resetFromTicket() {
    this.chequeRecords  = [];
    this.selectedCheques = [];
  }

  get f() { return this.pDChequeForm.controls; }

  // ── Load branches ──────────────────────────────────────────────────
  getBranches() {
    this.service.getBranchNames().subscribe(res => this.branchlist = res || []);
  }

  // ── Branch selected ────────────────────────────────────────────────
  onBranchSelect(event: any) {
    if (!event) return;
    this.branchschema = event.branch_code;
    this.branch_code  = event.branch_code;
    this.pDChequeForm.get('group')?.enable();
    this.service.getCommencedGroupCodes(this.branchschema, this.branch_code)
      .subscribe(res => {
        this.groupList = res || [];
        this.cdr.detectChanges();
      });
  }

  // ── Group selected ─────────────────────────────────────────────────
  onGroupSelect(event: any) {
    if (!event) return;
    this.pDChequeForm.get('ticket')?.enable();
    this.service.getCommencedGroupTickets(this.branchschema, event.groupcode)
      .subscribe(res => {
        this.tickets = res || [];
        this.cdr.detectChanges();
      });
  }

  // ── Ticket selected ────────────────────────────────────────────────
  onTicketSelect(event: any) {
    if (!event) return;
    this.service.getCommencedChequeDetails(
      this.branchschema,
      this.f['group'].value,
      this.branch_code,
      event.ticketno
    ).subscribe(res => {
      this.chequeRecords   = res || [];
      this.selectedCheques = [];
      this.cdr.detectChanges();
    });
  }

  // ── Delete with audit first ────────────────────────────────────────
  confirmDelete() {
    if (this.selectedCheques.length === 0) {
      alert('Please select at least one cheque record to delete.');
      return;
    }

    if (!confirm('Do you want to delete the selected cheque(s)?')) return;

    this.isSaving = true;

    // Snapshot before any async call
    const chequesToDelete = [...this.selectedCheques];
    const chequenumbers   = chequesToDelete.map(c => c.cheque_number).join(',');
    const chequeids       = chequesToDelete.map(c => c.tbl_trans_ps_cheques_id).join(',');
    const deletedIds      = chequesToDelete.map(c => c.tbl_trans_ps_cheques_id);

    const audit = {
      schemaName: this.branchschema,
      loginName : 'admin',
      loginTime : new Date().toISOString(),
      changeType: 'PD_CHEQUE_REMOVE',
      oldData   : chequesToDelete,
      newData   : { status: 'DELETED' },
      reason    : 'PD Cheque removed'
    };

    // ── Step 1: Save audit FIRST ───────────────────────────────────
    this.service.saveData([audit]).subscribe({
      next: () => {

        // ── Step 2: Delete AFTER audit saved ──────────────────────
        this.service.deleteCheques(this.branchschema, chequenumbers, chequeids)
          .subscribe({
            next: () => {
              this.handleDeleteSuccess(deletedIds);
            },
            error: (err: any) => {
              // API returns plain text "Success" — Angular treats as parse error
              const isSuccess =
                err?.error?.text?.toLowerCase() === 'success' ||
                err?.error?.toLowerCase?.() === 'success';

              if (isSuccess) {
                this.handleDeleteSuccess(deletedIds);
              } else {
                this.isSaving = false;
                console.error('Delete failed:', err);
                alert('Audit saved, but delete failed. Please try again.');
              }
            }
          });

      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Audit save failed:', err);
        alert('Audit save failed. Delete was not performed.');
      }
    });
  }

  private handleDeleteSuccess(deletedIds: any[]): void {
    this.chequeRecords   = this.chequeRecords.filter(
      c => !deletedIds.includes(c.tbl_trans_ps_cheques_id)
    );
    this.selectedCheques = [];
    this.isSaving        = false;
    this.cdr.detectChanges();
    alert('Audit saved and cheque(s) deleted successfully.');
    this.clear();
  }

  clear() {
    this.pDChequeForm.reset();
    this.resetFromBranch();
    this.cdr.detectChanges();
  }
}