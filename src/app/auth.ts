import { Injectable, signal, computed } from '@angular/core';

export interface LoggedInUser {
  loginName    : string;   
  displayName  : string;   
  role         : string;   
  branchSchema : string;   
  branchName   : string;   
  loginTime    : string;   
}

let USER_STORE: Array<LoggedInUser & { password: string }> = [
  {
    loginName    : 'KAPILGROUP',
    password     : 'kapilit',
    displayName  : 'CHANGES',
    role         : 'admin',
    branchSchema : 'KAPILCHITS',
    branchName   : 'Hyderabad Branch',
    loginTime    : '',         
  },
  {
    loginName    : 'priya',
    password     : 'pass456',
    displayName  : 'Priya Sharma',
    role         : 'Officer',
    branchSchema : 'branch_mum',
    branchName   : 'Mumbai Branch',
    loginTime    : '',
  },
  {
    loginName    : 'suresh',
    password     : 'pass789',
    displayName  : 'Suresh Reddy',
    role         : 'Officer',
    branchSchema : 'branch_ban',
    branchName   : 'Bangalore Branch',
    loginTime    : '',
  },
  {
    loginName    : 'admin',
    password     : 'admin@123',
    displayName  : 'Admin User',
    role         : 'Admin',
    branchSchema : 'branch_del',
    branchName   : 'Delhi Branch',
    loginTime    : '',
  },
];


@Injectable({ providedIn: 'root' })
export class Auth {

  private _currentUser = signal<LoggedInUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn   = computed(() => this._currentUser() !== null);
  readonly loginName    = computed(() => this._currentUser()?.loginName    ?? '');
  readonly displayName  = computed(() => this._currentUser()?.displayName  ?? '');
  readonly role         = computed(() => this._currentUser()?.role         ?? '');
  readonly branchSchema = computed(() => this._currentUser()?.branchSchema ?? '');
  readonly branchName   = computed(() => this._currentUser()?.branchName   ?? '');
  readonly loginTime    = computed(() => this._currentUser()?.loginTime    ?? '');

  login(username: string, password: string): 'success' | string {

    if (!username?.trim() || !password?.trim()) {
      return 'Username and password are required.';
    }

    const match = USER_STORE.find(
      u =>
        u.loginName.toLowerCase() === username.trim().toLowerCase() &&
        u.password                === password
    );

    if (!match) {
      return 'Invalid username or password.';
    }

    this._currentUser.set({
      loginName    : match.loginName,
      displayName  : match.displayName,
      role         : match.role,
      branchSchema : match.branchSchema,
      branchName   : match.branchName,
      loginTime    : new Date().toISOString(),
    });

    return 'success';
  }

  logout(): void {
    this._currentUser.set(null);
  }

  
  buildAudit(
    changeType : string,
    payload    : { oldData: Record<string, unknown>; newData: Record<string, unknown> },
    reason     : string
  ): Record<string, unknown> {

    const user = this._currentUser();

    return {
      schemaName : user?.branchSchema ?? '',
      loginName  : user?.loginName    ?? 'unknown',
      loginTime  : user?.loginTime    ?? new Date().toISOString(),
      changeType,
      payload,
      reason,
    };
  }
}