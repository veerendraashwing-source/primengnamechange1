// import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// import { Checkservice } from './checkservice';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { saveAs } from 'file-saver';
// import * as ExcelJS from 'exceljs';
// import { forkJoin } from 'rxjs';

// @Component({
//   selector: 'app-reportofupdates',
//   standalone: true,
//   imports: [ReactiveFormsModule, CommonModule, NgxDatatableModule],
//   templateUrl: './reportofupdates.html'
// })
// export class Reportofupdates implements OnInit {

//   form!: FormGroup;
//   reports: Report[] = [];
//   filteredReports: Report[] = [];
//   changeTypes: string[] = [];

//   constructor(private fb: FormBuilder, private service: Checkservice, private cdr: ChangeDetectorRef) { }

//   ngOnInit(): void {
//     const today = new Date().toISOString().substring(0, 10);
//     this.form = this.fb.group({
//       fromDate: [today, Validators.required],
//       toDate: [today, Validators.required],
//       changeType: ['', Validators.required],
//       exportFormat: ['Excel']
//     });

//     this.loadChangeTypes();
//   }

//   loadChangeTypes(): void {
//     this.service.getChangeTypes().subscribe({
//       next: (data: any[]) => {
//         this.changeTypes = ['ALL', ...data.map(x => x.changeType)];
//         console.log('Mapped change types:', this.changeTypes);
//       },
//       error: err => console.error('Error loading change types:', err)
//     });
//   }

//   filterReports(): void {
//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }
//     const { fromDate, toDate, changeType } = this.form.value;
//     if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
//       alert('FromDate cannot be greater than ToDate');
//       return;
//     }

//     if (changeType === 'ALL') {
//       const requests = this.changeTypes
//         .filter(ct => ct !== 'ALL')
//         .map(ct => this.service.getUpdateReports(fromDate, toDate, ct));

//       forkJoin(requests).subscribe({
//         next: (responses: any[]) => {
//           const combined = responses.flat();
//           this.filteredReports = combined.map(item => ({
//             ...item,
//             oldData: this.tryParse(item.oldData),
//             newData: this.tryParse(item.newData)
//           }));
//           this.cdr.detectChanges();
//           console.log('Filtered reports (ALL types):', this.filteredReports);

//         },
//         error: err => console.error(err)
//       });
//     } else {
//       this.service.getUpdateReports(fromDate, toDate, changeType).subscribe({
//         next: (data: any[]) => {
//           this.filteredReports = data.map(item => ({
//             ...item,
//             oldData: this.tryParse(item.oldData),
//             newData: this.tryParse(item.newData)
//           }));
//           this.cdr.detectChanges();
//           console.log('Filtered reports:', this.filteredReports);
//         },
//         error: err => console.error(err)
//       });
//     }
//   }

//   tryParse(value: any) {
//     if (!value) return null;
//     if (typeof value === 'object') return value;

//     try {
//       return JSON.parse(value);
//     } catch {
//       return value;
//     }
//   }

//   exportToExcel(): void {
//     if (!this.filteredReports.length) {
//       alert('No data to export');
//       return;
//     }

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Update Report');

//     const columns = Object.keys(this.filteredReports[0]).map(key => ({
//       header: key.toUpperCase(),
//       key,
//       width: 30,
//       style: {
//       font: { name: 'Courier New' } 
//     }
//     }));

//     worksheet.columns = columns as any;

//     this.filteredReports.forEach(report => {
//       const rowData: any = {};

//       Object.keys(report).forEach(key => {
//         const value = (report as any)[key];
//         rowData[key] =
//           typeof value === 'object' && value !== null
//             ? JSON.stringify(value, null, 2)
//             : value;
//       });

//       worksheet.addRow(rowData);
//     });

//     worksheet.getRow(1).font = { bold: true, name: 'Arial', size: 12};

//     worksheet.columns.forEach(column => {
//       column.alignment = { vertical: 'top', wrapText: true };
//     });

//     workbook.xlsx.writeBuffer().then(buffer => {
//       const blob = new Blob(
//         [buffer],
//         { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
//       );
//       saveAs(blob, 'Update_Report.xlsx');
//     });
//   }


//   exportToPdf(): void {
//     if (!this.filteredReports.length) {
//       alert('No data to export');
//       return;
//     }

//     const doc = new jsPDF({
//       orientation: 'landscape',
//       unit: 'pt',
//       format: 'a4'
//     });

//     const columns = Object.keys(this.filteredReports[0]);
//     const headers = columns.map(c => c.toUpperCase());

//     const rows = this.filteredReports.map(report =>
//       columns.map(col => {
//         const value = (report as any)[col];
//         return typeof value === 'object' && value !== null
//           ? JSON.stringify(value, null, 2)
//           : value;
//       })
//     );

//     autoTable(doc, {
//       head: [headers],
//       body: rows,

//       styles: {
//         font: 'courier',    
//         fontSize: 9,
//         cellPadding: 6,
//         overflow: 'linebreak',
//         valign: 'top'
//       },

//       headStyles: {
//         fillColor: [22, 160, 133],
//         fontStyle: 'bold',
//         fontSize: 10
//       },

//       tableWidth: 'auto',

//       margin: { top: 40, left: 40, right: 40 },
//       pageBreak: 'auto'
//     });

//     doc.save('Update_Report.pdf');
//   }

//   exportData(): void {
//     const format = this.form.value.exportFormat;

//     if (format === 'Excel') {
//       this.exportToExcel();
//     } else if (format === 'PDF') {
//       this.exportToPdf();
//     }
//   }
// }



import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { forkJoin } from 'rxjs';
import { CommonService } from '../commonservice';

export interface Report {
  loginId: string;
  loginDate: string;
  changeType: string;
  oldData: any;
  newData: any;
  reason: string;
}

@Component({
  selector: 'app-reportofupdates',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './reportofupdates.html'
})
export class Reportofupdates implements OnInit {

  form!: FormGroup;
  reports: Report[] = [];
  filteredReports: Report[] = [];
  changeTypes: string[] = [];

  constructor(
    private fb: FormBuilder,
    private service: CommonService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form = this.fb.group({
      fromDate:     [today, Validators.required],
      toDate:       [today, Validators.required],
      changeType:   ['',    Validators.required],
      exportFormat: ['Excel']
    });

    this.loadChangeTypes();
  }

  loadChangeTypes(): void {
    this.service.getChangeTypes().subscribe({
      next: (data: any[]) => {
        this.changeTypes = ['ALL', ...data.map(x => x.changeType)];
      },
      error: err => console.error('Error loading change types:', err)
    });
  }

  filterReports(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { fromDate, toDate, changeType } = this.form.value;

    const from = this.toDateString(fromDate);
    const to   = this.toDateString(toDate);

    if (from && to && new Date(from) > new Date(to)) {
      alert('From Date cannot be greater than To Date');
      return;
    }

    if (changeType === 'ALL') {
      const requests = this.changeTypes
        .filter(ct => ct !== 'ALL')
        .map(ct => this.service.getUpdateReports(from, to, ct));

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          const combined = responses.flat();
          this.filteredReports = combined.map(item => ({
            ...item,
            oldData: this.tryParse(item.oldData),
            newData: this.tryParse(item.newData),
          }));
          this.cdr.detectChanges();
        },
        error: err => console.error(err)
      });
    } else {
      this.service.getUpdateReports(from, to, changeType).subscribe({
        next: (data: any[]) => {
          this.filteredReports = data.map(item => ({
            ...item,
            oldData: this.tryParse(item.oldData),
            newData: this.tryParse(item.newData),
          }));
          this.cdr.detectChanges();
        },
        error: err => console.error(err)
      });
    }
  }


  private toDateString(value: any): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().substring(0, 10);
    return String(value).substring(0, 10);
  }

  tryParse(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); }
    catch { return value; }
  }

  exportData(): void {
    const format = this.form.value.exportFormat;
    if (format === 'Excel') this.exportToExcel();
    else if (format === 'PDF') this.exportToPdf();
  }

  exportToExcel(): void {
    if (!this.filteredReports.length) {
      alert('No data to export');
      return;
    }

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Update Report');

    worksheet.columns = [
      { header: 'LOGIN ID',    key: 'loginId',    width: 20 },
      { header: 'LOGIN DATE',  key: 'loginDate',  width: 22 },
      { header: 'CHANGE TYPE', key: 'changeType', width: 20 },
      { header: 'OLD DATA',    key: 'oldData',    width: 50 },
      { header: 'NEW DATA',    key: 'newData',    width: 50 },
      { header: 'REASON',      key: 'reason',     width: 40 },
    ];

    this.filteredReports.forEach(report => {
      worksheet.addRow({
        loginId:    report.loginId,
        loginDate:  report.loginDate,
        changeType: report.changeType,
        oldData:    typeof report.oldData === 'object' && report.oldData !== null
                      ? JSON.stringify(report.oldData, null, 2) : report.oldData,
        newData:    typeof report.newData === 'object' && report.newData !== null
                      ? JSON.stringify(report.newData, null, 2) : report.newData,
        reason:     report.reason,
      });
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font      = { bold: true, name: 'Arial', size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height    = 22;

    // Wrap text on data rows
    worksheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.alignment = { vertical: 'top', wrapText: true };
        row.font      = { name: 'Courier New', size: 10 };
      }
    });

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      saveAs(blob, 'Update_Report.xlsx');
    });
  }

  exportToPdf(): void {
    if (!this.filteredReports.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text('Reports of Updates', 40, 30);
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 44);

    const columns = ['loginId', 'loginDate', 'changeType', 'oldData', 'newData', 'reason'];
    const headers = ['Login ID', 'Login Date', 'Change Type', 'Old Data', 'New Data', 'Reason'];

    const rows = this.filteredReports.map(report =>
      columns.map(col => {
        const value = (report as any)[col];
        return typeof value === 'object' && value !== null
          ? JSON.stringify(value, null, 2)
          : (value ?? '');
      })
    );

    autoTable(doc, {
      head:  [headers],
      body:  rows,
      startY: 56,
      styles: {
        font:        'courier',
        fontSize:    8,
        cellPadding: 5,
        overflow:    'linebreak',
        valign:      'top',
        lineColor:   [226, 232, 240],
        lineWidth:   0.5,
      },
      headStyles: {
        fillColor:  [99, 102, 241],
        textColor:  255,
        fontStyle:  'bold',
        fontSize:   9,
        halign:     'center',
      },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 80 },
        2: { cellWidth: 75 },
        3: { cellWidth: 160 },
        4: { cellWidth: 160 },
        5: { cellWidth: 'auto' },
      },
      margin:    { top: 56, left: 30, right: 30 },
      pageBreak: 'auto',
    });

    doc.save('Update_Report.pdf');
  }
}