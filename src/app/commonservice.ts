// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { AuditLog } from './audit-log';

// export interface BranchNamesDTO {
//   branch_name: string;
//   branch_code: string;
//   branchschema: string;
// }

// export interface GroupCodeDTO {
//   group_Code: string;
//   chitgroup_id: number;
// }

// export interface TicketDTO {
//   ticketno: number;
// }

// export interface NameUpdateDTO {
//   contactId: number;
//   oldName: string;
//   oldSurname: string;
//   oldMailingName: string;
//   mobileNo: string;
//   address: string;
//   area: string;
//   city: string;
//   pincode: string;
// }

// export interface AuctionScheduleDTO {
//   oldDate: string;
//   oldTime: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class CommonService {

//   private http = inject(HttpClient);
//   private baseUrl = 'http://localhost:5000';

//   getBranchNames(): Observable<BranchNamesDTO[]> {
//     return this.http.get<BranchNamesDTO[]>(
//       `${this.baseUrl}/api/Change/GetBranchNames`
//     );
//   }

//   getGroupCode(branchschema: string): Observable<GroupCodeDTO[]> {
//     return this.http.get<GroupCodeDTO[]>(
//       `${this.baseUrl}/api/Change/GetGroupcodes`,
//       { params: { branchschema } }
//     );
//   }

//   getTickets(schema: string, groupcode: string): Observable<TicketDTO[]> {
//     return this.http.get<TicketDTO[]>(
//       `${this.baseUrl}/api/Change/GetTickets`,
//       { params: { schema, groupcode } }
//     );
//   }

//   getByTicket(schema: string, ticketNo: number, chitgroupid: number): Observable<NameUpdateDTO> {
//     return this.http.get<NameUpdateDTO>(
//       `${this.baseUrl}/api/Change/GetOldNameByTicketNo`,
//       {
//         params: {
//           Schema: schema,
//           ticketNo: ticketNo.toString(),
//           chitgroupid: chitgroupid.toString()
//         }
//       }
//     );
//   }

//   updateRecordsnamechange(payload: any, branchschema: string): Observable<any> {
//     return this.http.post(
//       `${this.baseUrl}/api/Change/updatenamebyticketno`,
//       payload,
//       {
//         params: { branchschema },
//         headers: { 'Content-Type': 'application/json' }
//       }
//     );
//   }

//   UpdateMoblieNoByContact(payload: {
//     contact_id: number;
//     newMobileNo: number;
//     ptypeofoperation: string;
//   }): Observable<any> {
//     return this.http.post(
//       `${this.baseUrl}/api/Change/UpdateMoblieNoByContact`,
//       payload
//     );
//   }

//   UpdateAddressByContact(payload: {
//     contact_id: number;
//     newAddress: string;
//     newArea: string;
//     newCity: string;
//     newPincode: number;
//     ptypeofoperation: string;
//   }): Observable<any> {
//     return this.http.post(
//       `${this.baseUrl}/api/Change/UpdateAddressByContact`,
//       payload
//     );
//   }

//   saveAuditTrail(payload: any): Observable<any> {
//     return this.http.post<any>(
//       `${this.baseUrl}/api/Change/SaveData`,
//       payload
//     );
//   }

//   saveAuditlog(payload: any): Observable<any> {
//     return this.http.post<any>(
//       `${this.baseUrl}/api/Change/GetUpdateReports`,
//       payload
//     );
//   }

//   saveData(payload: any[]): Observable<any> {
//     return this.saveAuditTrail(payload);
//   }


//   getReferralDetails(referralCode: string): Observable<any> {
//     return this.http.get<any>(
//       `${this.baseUrl}/api/Change/GetReferralDetails`,
//       { params: { referralCode } }
//     );
//   }

//   getAgentCodes(): Observable<any[]> {
//     return this.http.get<any[]>(
//       `${this.baseUrl}/api/Change/Agentcode`
//     );
//   }

//   updateAgentBranch(payload: any): Observable<any> {
//     return this.http.post(
//       `${this.baseUrl}/api/Change/UpdateAgentBranch`,
//       payload,
//       {
//         headers: { 'Content-Type': 'application/json' }
//       }
//     );
//   }


//   getAuctionSchedule(branchschema: string, chitgroupid: number): Observable<AuctionScheduleDTO[]> {
//     let params = new HttpParams().set('branchschema', branchschema).set('chitgroupid', chitgroupid.toString());
//     return this.http.get<AuctionScheduleDTO[]>(`${this.baseUrl}/api/Change/get-auction-schedules`, { params });
//   }

//   // updateAuctionSchedule(payload: {
//   //   branch_code: string; group_code: string; newDate: string; newTime: string;
//   // }): Observable<any> {
//   //   let params = new HttpParams().set('branchschema', payload.branch_code).set('newauctiondate', payload.newDate)
//   //     .set('newauctiontime', payload.newTime).set('chitgroupid', payload.group_code.toString());
//   //   return this.http.post(`${this.baseUrl}/api/Change/update-auction-schedule`, null, { params });
//   // }
//  updateAuctionSchedule(payload: {
//     branch_code: string; chitgroup_id: number; newauctiondate: string; newauctiontime: string;
//   }): Observable<any> {
//     let params = new HttpParams().set('branchschema', payload.branch_code).set('newauctiondate', payload.newauctiondate)
//       .set('newauctiontime', payload.newauctiontime).set('chitgroupid', payload.chitgroup_id.toString());
//     return this.http.post(`${this.baseUrl}/api/Change/update-auction-schedule`, null, { params });
//   }
  
//   // 🔹 GET AUCTION NUMBERS (for BID LOSS)
//   getAuctionNumbers(branchschema: string, chitgroupid: number): Observable<any[]> {
//     const params = new HttpParams()
//       .set('branchschema', branchschema)
//       .set('chitgroupid', chitgroupid.toString());

//     return this.http.get<any[]>(
//       `${this.baseUrl}/api/Change/get-auction-numbers`,
//       { params }
//     );
//   }

//   updateBidLossPermission(
//     branchschema: string,
//     auctionNo: string,
//     ticketNo: string,
//     chitgroupid: number
//   ): Observable<any> {

//     const params = new HttpParams()
//       .set('branchschema', branchschema)
//       .set('auction_number', auctionNo)
//       .set('ticketno', ticketNo)
//       .set('chitgroupid', chitgroupid.toString());

//     return this.http.post(
//       `${this.baseUrl}/api/Change/update-bidloss_permission`,
//       null,
//       { params }
//     );
//   }

// }








import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from './audit-log';

 export interface PanNumberDto {
  tbl_mst_contact_id: number;
  pan_number: string;
  contact_name: string | null;
  document_reference_no: string | null;
  tbl_mst_contact_documents_id: number;
  document_proofs_id: number;
  tbl_trans_chit_advance_id: number;
  branch_id: number;
  branch_code: string | null;
  contact_reference_id: string | null;
}

export interface BranchNamesDTO {
  branch_name: string;
  branch_code: string;
  branchschema: string;
}

export interface GroupCodeDTO {
  group_Code: string;
  chitgroup_id: number;
}

export interface TicketDTO {
  ticketno: number;
}

export interface NameUpdateDTO {
  chit_status: any;
  contactId: number;
  oldName: string;
  oldSurname: string;
  oldMailingName: string;
  mobileNo: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
}

export interface AuctionScheduleDTO {
  oldDate: string;
  oldTime: string;
}

export interface VacantStatusDTO {
  branch_code: string;
  is_vacant_full_receipt_mandatory: boolean;
}

export interface BusinessRefDTO {
  contactId: number;
  subscriberId: number;
  subscriberName: string;
  employeeName: string;
  businessReferenceId: number;
}

export interface BusinessRefUpdateDTO {
  chitgroup_id: number;
  ticketno: number;
  subscriberId: number;
  oldBusinessReferenceId: number;
  newBusinessReferenceId: string;
  ptypeofoperation: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:5000';
  private base = 'http://localhost:5000/api/Change';
  private auditBase = 'http://localhost:5000/api/change';
  private reportBase = 'http://localhost:5000/api/change';
  insertSubscriberIncome: any;

  getBranchNames(): Observable<BranchNamesDTO[]> {
    return this.http.get<BranchNamesDTO[]>(
      `${this.baseUrl}/api/Change/GetBranchNames`
    );
  }

  GetcompanyNames(): Observable<BranchNamesDTO[]> {
    return this.http.get<BranchNamesDTO[]>(
      `${this.baseUrl}/api/Change/GetcompanyNames`
    );
  }

  getbranchnames(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/GetChequeBranchName`);
  }

  getGroupCode(branchschema: string): Observable<GroupCodeDTO[]> {
    return this.http.get<GroupCodeDTO[]>(
      `${this.baseUrl}/api/Change/GetGroupcodes`,
      { params: { branchschema } }
    );
  }

  getApprovedGroupCodes(branchSchema: string, branchCode: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchSchema', branchSchema)
      .set('branchCode', branchCode);
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/GetApprovedGroupCodes`, { params }
    );
  }

  getCommencedGroupCodes(branchschema: string, branchCode: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('branch_code', branchCode);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetcommencedGroupcodes`, { params });
  }

  getTickets(schema: string, groupcode: string): Observable<TicketDTO[]> {
    return this.http.get<TicketDTO[]>(
      `${this.baseUrl}/api/Change/GetTickets`,
      { params: { schema, groupcode } }
    );
  }

  getTickets1(groupcode: string, branchcode: string, branchschema: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/GetTickets1?groupcode=${groupcode}&branchcode=${branchcode}&branchschema=${branchschema}`
    );
  }

  getCommencedGroupTickets(branchschema: string, groupcode: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('groupcode', groupcode);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetcomencedgroupcodeTickets`, { params });
  }

  getByTicket(schema: string, ticketNo: number, chitgroupid: number): Observable<NameUpdateDTO> {
    return this.http.get<NameUpdateDTO>(
      `${this.baseUrl}/api/Change/GetOldNameByTicketNo`,
      {
        params: {
          Schema: schema,
          ticketNo: ticketNo.toString(),
          chitgroupid: chitgroupid.toString()
        }
      }
    );
  }

  updateRecordsnamechange(payload: any, branchschema: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/updatenamebyticketno`,
      payload,
      {
        params: { branchschema },
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  UpdateMoblieNoByContact(payload: {
    contact_id: number;
    newMobileNo: number;
    ptypeofoperation: string;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/UpdateMoblieNoByContact`,
      payload
    );
  }

  UpdateAddressByContact(payload: {
    contact_id: number;
    newAddress: string;
    newArea: string;
    newCity: string;
    newPincode: number;
    ptypeofoperation: string;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/UpdateAddressByContact`,
      payload
    );
  }

  saveAuditTrail(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/Change/SaveData`,
      payload
    );
  }

  saveAuditlog(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/Change/GetUpdateReports`,
      payload
    );
  }

  saveData(payload: any[]): Observable<any> {
    return this.saveAuditTrail(payload);
  }

  saveAuditLogData(data: AuditLog[]): Observable<any> {
    return this.http.post(`${this.auditBase}/SaveData`, data);
  }

  getUpdateReports(fromDate: string, toDate: string, changeType: any): Observable<any[]> {
    const params = new HttpParams()
      .set('fromdate', fromDate)
      .set('todate', toDate)
      .set('changetype', changeType);
    return this.http.get<any[]>(`${this.reportBase}/GetUpdateReports`, { params });
  }

  getChangeTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.reportBase}/GetChangeTypes`);
  }

  getReferralDetails(referralCode: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/Change/GetReferralDetails`,
      { params: { referralCode } }
    );
  }

  getAgentCodes(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/Agentcode`
    );
  }

  updateAgentBranch(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/UpdateAgentBranch`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  getAuctionSchedule(branchschema: string, chitgroupid: number): Observable<AuctionScheduleDTO[]> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('chitgroupid', chitgroupid.toString());
    return this.http.get<AuctionScheduleDTO[]>(
      `${this.baseUrl}/api/Change/get-auction-schedules`, { params }
    );
  }

  updateAuctionSchedule(payload: {
    branch_code: string;
    chitgroup_id: number;
    newauctiondate: string;
    newauctiontime: string;
  }): Observable<any> {
    const params = new HttpParams()
      .set('branchschema', payload.branch_code)
      .set('newauctiondate', payload.newauctiondate)
      .set('newauctiontime', payload.newauctiontime)
      .set('chitgroupid', payload.chitgroup_id.toString());
    return this.http.post(
      `${this.baseUrl}/api/Change/update-auction-schedule`, null, { params }
    );
  }

  getAuctionNumbers(branchschema: string, chitgroupid: number): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('chitgroupid', chitgroupid.toString());
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/get-auction-numbers`, { params }
    );
  }

  updateBidLossPermission(
    branchschema: string,
    auctionNo: string,
    ticketNo: string,
    chitgroupid: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('auction_number', auctionNo)
      .set('ticketno', ticketNo)
      .set('chitgroupid', chitgroupid.toString());
    return this.http.post(
      `${this.baseUrl}/api/Change/update-bidloss_permission`, null, { params }
    );
  }

  getVacantStatus(): Observable<VacantStatusDTO[]> {
    return this.http.get<VacantStatusDTO[]>(
      `${this.baseUrl}/api/Change/getvacantstatus`
    );
  }

  updateVacantStatus(branch_code: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/updatevacantstatus`,
      null,
      { params: { Branch_code: branch_code } }
    );
  }

  getContactById(id: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/getmaxchitcount?referenceid=${id}`
    );
  }

  getContactByMobile(mobile: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/getmaxchitcount?contactno=${mobile}`
    );
  }

  updateTotalChits(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/updatemultiplecontact`,
      payload
    );
  }

  getsubscribername(branchschema: string, ticketno: number, groupcode: string, branch_code: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/getsubscribername?branchschema=${branchschema}&ticketno=${ticketno}&groupcode=${groupcode}&branch_code=${branch_code}`
    );
  }

  getsubscribercount(ticketno: number, groupcode: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/getsubscribercount?ticketno=${ticketno}&groupcode=${groupcode}`
    );
  }

  deletelegalcell(groupcode: string, ticketno: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/Change/deletelegalcell?groupcode=${groupcode}&ticketno=${ticketno}`, {}
    );
  }

  getchequesreturncharges(company_code: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/getchequesreturncharges?company_code=${company_code}`
    );
  }

  updatechequesreturncharges(id: number, amount: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/Change/updatechequesreturncharges?tbl_mst_chit_company_configuration_ID=${id}&chequereturn_charges_amount=${amount}`,
      {}
    );
  }

  getChitGroupDetails(branchschema: string, groupcode: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/Change/get-dates-change`,
      { params: { branchschema, groupcode } }
    );
  }

  updateChitGroup(branchschema: string, payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/update-dates-change`,
      payload,
      {
        params: { branchschema },
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  getApprovedDetails(groupcode: string, groupCode: string, ticketno: number): Observable<any[]> {
    const params = new HttpParams()
      // .set('schema', schema)
      .set('groupcode', groupcode)
      .set('ticketno', ticketno);
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/GetApprovedDetails`, { params }
    );
  }

  removeFirstMemo(groupCode: string, ticketNo: number): Observable<{ isSuccess: boolean; message: string }> {
    return this.http.post<{ isSuccess: boolean; message: string }>(
      `${this.baseUrl}/api/Change/RemoveFirstMemo?groupcode=${groupCode}&ticketno=${ticketNo}`,
      {}
    );
  }

  getSjvNo(branchCode: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/Change/getsjvno?branchschema=${branchCode}`
    );
  }

  updateSjvStatus(branch_code: string, transaction_no: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/updatesjvno?branchschema=${branch_code}&transaction_no=${transaction_no}`,
      {}
    );
  }

  getGeneralReceiptNumbers(branchSchema: string, branchCode: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchSchema)
      .set('branchcode', branchCode);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/getgeneralreceiptnumbers`, { params });
  }

  getGeneralReceiptDetails(branchSchema: string, generalReceiptNumber: string, interbranchId: number): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchSchema)
      .set('general_receipt_number', generalReceiptNumber)
      .set('interbranch_id', interbranchId);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/getgeneralreceiptdetails`, { params });
  }

  getGeneralReceiptAmount(branchSchema: string, depositedReferenceNo: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchSchema)
      .set('deposited_reference_no', depositedReferenceNo);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/getgeneralreceiptamount`, { params });
  }

  getReceiptVoucherTransactions(branchcode: string, generalReceiptNumber: string, contactId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/Change/GetReceiptVoucherTransactions`,
      {
        params: new HttpParams()
          .set('branchSchema', branchcode)
          .set('generalReceiptNumber', generalReceiptNumber)
          .set('contactId', contactId)
      }
    );
  }

  reverseReceipt(
    branchschema: string,
    groupcode: string,
    ticketno: number,
    contactid: number,
    generalreceiptnumber: string,
    commonreceiptnumber: number,
    paymentnumber: string,
    paymentdate: string,
    paymentvoucherid: number,
    paymentvoucherdetailsid: number,
    caoname: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('groupcode', groupcode)
      .set('ticketno', ticketno)
      .set('contactid', contactid)
      .set('generalreceiptnumber', generalreceiptnumber)
      .set('commonreceiptnumber', commonreceiptnumber)
      .set('paymentnumber', paymentnumber)
      .set('paymentdate', paymentdate)
      .set('paymentvoucherid', paymentvoucherid)
      .set('paymentvoucherdetailsid', paymentvoucherdetailsid)
      .set('caoname', caoname);
    return this.http.post(`${this.baseUrl}/api/Change/ReverseReceipt`, null, { params });
  }

  getChequeGeneralReceiptNumbers(branchSchema: string, branchCode: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchSchema)
      .set('branchcode', branchCode);
    return this.http.get<any[]>(`${this.base}/getchequegeneralnumbers`, { params });
  }

  getChequeGeneralReceiptNumberDetails(branchSchema: string, general_receipt_number: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchSchema)
      .set('general_receipt_number', general_receipt_number);
    return this.http.get<any[]>(`${this.base}/getchequegeneralnumbersdetails`, { params });
  }

  getChequeLiveDetails(
    general_receipt_number: string,
    branchschema: string,
    interbranch_id: number,
    reference_number: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('general_receipt_number', general_receipt_number)
      .set('branchschema', branchschema)
      .set('interbranch_id', interbranch_id.toString())
      .set('reference_number', reference_number);
    return this.http.get<any[]>(`${this.base}/GetchequeliveDetails`, { params });
  }

  reverseChequeDeposit(
    caoschema: string,
    branchschema: string,
    chitgroupid: number,
    ticketno: number,
    contactid: number,
    trimnumber: string,
    referencenumber: string,
    receiptnumber: string,
    bankentriesid: number,
    transactionno: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('caoschema', caoschema)
      .set('branchschema', branchschema)
      .set('chitgroupid', chitgroupid.toString())
      .set('ticketno', ticketno.toString())
      .set('contactid', contactid.toString())
      .set('trimnumber', trimnumber)
      .set('referencenumber', referencenumber)
      .set('receiptnumber', receiptnumber)
      .set('bankentriesid', bankentriesid.toString())
      .set('transactionno', transactionno);
    return this.http.post<any>(`${this.base}/ReverseChequeDeposit`, {}, { params });
  }

  getcheckdetails(branchSchema: string, checkNo: string): Observable<any> {
    return this.http.get<any>(`${this.base}/GetChequeDetails`, {
      params: { branchschema: branchSchema, checkreferno: checkNo }
    });
  }

  updateClearDate(branchSchema: string, checkReferNo: string, paymentNo: string): Observable<any> {
    const url =
      `${this.base}/ClearDateandStatus` +
      `?branchschema=${branchSchema}` +
      `&checkreferno=${checkReferNo}` +
      `&paymentno=${encodeURIComponent(paymentNo)}`;
    return this.http.post(url, null);
  }

  getCommencedChequeDetails(
    branchschema: string,
    groupcode: string,
    branchCode: string,
    ticketNo: number
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('groupcode', groupcode)
      .set('branch_code', branchCode)
      .set('tickeno', ticketNo.toString());
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/Getcomencedchequenumberdetails`, { params });
  }

  deleteCheques(branchschema: string, chequenumbers: string, chequeids: string): Observable<any> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('chequenumbers', chequenumbers)
      .set('chequeids', chequeids);
    return this.http.post(`${this.baseUrl}/api/Change/DeletePSCheques`, null, { params });
  }

  getEmployeeName(
    searchtype: string,
    companyCode: string = '',
    branchCode: string = '',
    LocalSchema: string = '',
    GlobalSchema: string = ''
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('LocalSchema', LocalSchema)
      .set('searchtype', searchtype)
      .set('companyCode', companyCode)
      .set('branchCode', branchCode)
      .set('GlobalSchema', GlobalSchema);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetSubInterducedDetails`, { params });
  }

  getMvNumbers(branchschema: string, branchcode: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/GetMvNumbers`, {
      params: new HttpParams().set('branchschema', branchschema).set('branchcode', branchcode)
    });
  }

  getMvDetails(branchschema: string, branchcode: string, payment_number: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/GetMvdetails`, {
      params: new HttpParams()
        .set('branchschema', branchschema)
        .set('paymentnumber', payment_number)
        .set('branchcode', branchcode)
    });
  }

  getMvNumberDetails(
    branchschema: string,
    branchcode: string,
    paymentnumber: string,
    paymentvoucherid: number
  ): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/GetMvnumberdetails`, {
      params: new HttpParams()
        .set('branchschema', branchschema)
        .set('branchcode', branchcode)
        .set('paymentnumber', paymentnumber)
        .set('paymentvoucherid', paymentvoucherid)
    });
  }

  reverseMvVoucher(
    branchschema: string,
    payment_number: string,
    payment_date: string,
    paymentvoucherid: number,
    contactid: number,
    paymentvoucherdetailsid: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('payment_number', payment_number)
      .set('payment_date', payment_date)
      .set('paymentvoucherid', paymentvoucherid)
      .set('contactid', contactid)
      .set('paymentvoucherdetailsid', paymentvoucherdetailsid);
    return this.http.post<any>(`${this.base}/ReverseMvVoucher`, null, { params });
  }

  getBusinessRefByTicket(
    schema: string,
    ticketNo: number,
    chitgroupId: number
  ): Observable<BusinessRefDTO> {
    return this.http.get<BusinessRefDTO>(
      `${this.baseUrl}/api/Change/GetBusinessRefByTicket`,
      {
        params: {
          Schema: schema,
          ticketNo: ticketNo.toString(),
          chitgroupid: chitgroupId.toString()
        }
      }
    );
  }

  updateBusinessRef(
    payload: BusinessRefUpdateDTO,
    branchSchema: string
  ): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/Change/UpdateBusinessRef`,
      payload,
      {
        params: { branchschema: branchSchema },
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  getChequenumbers(branchschema: string): Observable<any[]> {
    const params = new HttpParams().set('branchschema', branchschema);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetChequenumbers`, { params });
  }

  getChequeDetails(
    branchschema: string,
    paymentnumber: string,
    referencenumber: string,
    clearstatus: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('paymentnumber', paymentnumber)
      .set('referencenumber', referencenumber)
      .set('clearstatus', clearstatus);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetchequeDetails`, { params });
  }

  clearDateAndStatus(
    branchschema: string,
    paymentnumber: string,
    referencenumber: string,
    transactionno: string,
    bankentriesid: number,
    clearstatus: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('paymentnumber', paymentnumber)
      .set('referencenumber', referencenumber)
      .set('transactionno', transactionno)
      .set('bankentriesid', bankentriesid.toString())
      .set('clearstatus', clearstatus);
    return this.http.post<any>(
      `${this.baseUrl}/api/Change/ClearDateandStatus`,
      null,
      { params, responseType: 'text' as 'json' }
    );
  }
 



  getPANList(): Observable<PanNumberDto[]> {
    return this.http.get<PanNumberDto[]>(`${this.baseUrl}/api/change/Getpannumbers`);
  }

  getContactDocumentDetails(panNumber: string): Observable<PanNumberDto[]> {
    const params = new HttpParams().set('panNumber', panNumber);
    return this.http.get<PanNumberDto[]>(`${this.baseUrl}/api/change/GetContactDocumentDetails`, { params });
  }

  updatePanNumber(payload: {
    branchschema: string;
    oldPanNumber: string;
    newPanNumber: string;
    contactReferenceId: string;
    contactId: number;
    documentIds: string;
  }): Observable<string> {
    const params = new HttpParams()
      .set('branchschema',       payload.branchschema)
      .set('oldPanNumber',       payload.oldPanNumber)
      .set('newPanNumber',       payload.newPanNumber)
      .set('contactReferenceId', payload.contactReferenceId)
      .set('contactId',          payload.contactId.toString())
      .set('documentIds',        payload.documentIds);

    return this.http.post(`${this.baseUrl}/api/change/UpdatePanNumber`, null, {
      params,
      responseType: 'text'
    });
  }



getPaymentAdjustmentDetails(branchschema: string, groupcode: string, ticketno: number) {
  return this.http.get<any[]>(
    `${this.baseUrl}/api/Change/GetPaymentAdjustmentDetails`,
    { params: { branchschema, groupcode, ticketno } }
  );
}

getSubscriberDetails(branchschema: string, groupcode: string, ticketno: number) {
  return this.http.get<any[]>(
    `${this.baseUrl}/api/Change/GetSubscriberDetails`,
    { params: { branchschema, groupcode, ticketno } }
  );
}

updateAdjustmentDetails(payload: {
  branchschema:                  string;
  adjustmentChitGroupId:         number;
  adjustmentTicketNo:            number;
  adjustmentContactId:           number;
  bpoChequeInformationIds:       string;
  bpoChequeInformationDetailIds: string;
  adjustmentAmount:              number;
  chitPaymentAdjustmentIds:      string;
}) {
  return this.http.post<any>(
    `${this.baseUrl}/api/Change/UpdateAdjustmentDetails`,
    null,
    { params: { ...payload } }
  );
}

  getGuarantorNameChangeDetails(branchschema: string, groupcode: string, ticketno: number, branch_code: string) {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('groupcode', groupcode)
      .set('ticketno', ticketno)
      .set('branch_code', branch_code);

    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetnamechangeDetails`, { params });
  }

  updateSubscriberGuarantorName(
    branchschema: string,
    chitgroupid: number,
    ticketno: number,
    contactid: number,
    contactname: string,
    contactmailingname: string,
    contactsurname: string
  ) {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('chitgroupid', chitgroupid)
      .set('ticketno', ticketno)
      .set('contactid', contactid)
      .set('contactname', contactname)
      .set('contactmailingname', contactmailingname)
      .set('contactsurname', contactsurname);

    return this.http.post(`${this.baseUrl}/api/Change/UpdateSubscriberGuarantorName`, null, {
      params,
      responseType: 'text'
    });
  }
  

  getReauctionSubscriberDetails(branchschema: string, groupcode: string, ticketno: number, branch_code: string) {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('groupcode', groupcode)
      .set('ticketno', ticketno)
      .set('branch_code', branch_code);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetreauctionSubscriberDetails`, { params });
  }

  getReauctionDetails(branchschema: string, from_ticketno: number, to_ticketno: number) {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('from_ticketno', from_ticketno)
      .set('to_ticketno', to_ticketno);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/GetreauctionDetails`, { params });
  }

  getReauctionDividendDetails(branchschema: string, transaction_no: string) {
    const params = new HttpParams()
      .set('branchschema', branchschema)
      .set('transaction_no', transaction_no);
    return this.http.get<any[]>(`${this.baseUrl}/api/Change/Getreauctiondivdenddetails`, { params });
  }

  updateReauctionTransactionDates(payload: {
    branchschema: string; chitgroupid: number; toticketno: number; ticketno: number;
    reauctiondate: string; oldtransactiondate: string; createddate: string;
    subscriberjvno: string; dividendtransactionnos: string; bidjvtransactionnos: string;
  }) {
    const params = new HttpParams()
      .set('branchschema', payload.branchschema)
      .set('chitgroupid', payload.chitgroupid)
      .set('toticketno', payload.toticketno)
      .set('ticketno', payload.ticketno)
      .set('reauctiondate', payload.reauctiondate)
      .set('oldtransactiondate', payload.oldtransactiondate)
      .set('createddate', payload.createddate)
      .set('subscriberjvno', payload.subscriberjvno)
      .set('dividendtransactionnos', payload.dividendtransactionnos)
      .set('bidjvtransactionnos', payload.bidjvtransactionnos);
    return this.http.post(`${this.baseUrl}/api/Change/UpdateReauctionTransactionDates`, null, { params, responseType: 'text' });
  }


}