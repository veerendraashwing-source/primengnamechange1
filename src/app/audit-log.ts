export interface AuditLog {
  schemaName:string;
  loginName: string;
  loginTime: string;
  oldData: any[];
  newData: any[];
  reason: string;
  changeType:string;
}