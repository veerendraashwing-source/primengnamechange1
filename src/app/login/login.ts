
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// //import { AuthService } from 'src/app/services/auth.service';
// //import { CompanyDetailsService } from 'src/app/services/company-details.service';

// import { SelectModule } from 'primeng/select';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { PasswordModule } from 'primeng/password';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';

// import { environment } from 'src/app/envir/environment.prod';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   templateUrl: './login.html',
//   styleUrl: './login.css',
//   imports: [
//     CommonModule,
//     FormsModule,
//     SelectModule,
//     ButtonModule,
//     InputTextModule,
//     PasswordModule,
//     ToastModule
//   ],
//   providers: [MessageService]
// })
// export class LoginComponent implements OnInit {

//   step = 1;
//   loading = false;
//   errorMessage = '';
//   companyOptions: any[] = [];
//   branchOptions: any[] = [];
//   selectedCompanyId: number | null = null;
//   selectedCompanyCode = '';
//   selectedBranchCode = '';
//   username = '';
//   password = '';
//   private api = '';
//   constructor(
//     private http: HttpClient,
//     private router: Router,
//     //private authService: AuthService,
//     private messageService: MessageService,
//     //private companyService: CompanyDetailsService
//   ) {}

//   ngOnInit(): void {
//     this.initializeApi().then(() => {
//       this.loadCompanies();
//     });
//   }

//   async initializeApi() {
//     let res: any = await this.http.get(environment.apiURL).toPromise();
//     if (res?.length) {
//       const url = new URL(res[0].apiURL);
//       this.api = url.origin + '/api';
//       sessionStorage.setItem('apiURL', this.api);
//     }
//   }

//   loadCompanies() {
//     this.http.get<any[]>(`${this.api}/Accounts/GetUsersCompanyCodes`)
//       .subscribe({
//         next: data => {
//           this.companyOptions = data.map(c => ({
//             label: c.company_name,
//             value: c.tbl_mst_chit_company_configuration_id,
//             code: c.company_code
//           }));
//         },
//         error: () => this.toast('error', 'Error', 'Failed to load companies')
//       });
//   }

//   onCompanyChange() {
//     this.resetBranch();

//     let selected = this.companyOptions.find(c => c.value === this.selectedCompanyId);
//     this.selectedCompanyCode = selected?.code || '';

//     if (!this.selectedCompanyId) return;

//     this.loading = true;

//     this.http.get<any[]>(`${this.api}/Accounts/GetUsersBranchCodes?companyConfigurationId=${this.selectedCompanyId}`)
//       .subscribe({
//         next: data => {
//           this.branchOptions = data.map(b => ({
//             label: b.branch_name,
//             value: b.branch_code
//           }));
//           this.loading = false;
//         },
//         error: () => {
//           this.toast('error', 'Error', 'Failed to load branches');
//           this.loading = false;
//         }
//       });
//   }

//   onNext() {
//     if (!this.selectedCompanyId) return this.setError('Please select company');
//     if (!this.selectedBranchCode) return this.setError('Please select branch');

//     this.step = 2;
//   }

//   onLogin() {
//     if (!this.username.trim()) return this.setError('Enter username');
//     if (!this.password.trim()) return this.setError('Enter password');

//     this.loading = true;

//     this.http.post<any>(`${this.api}/Accounts/login`, {
//       user_name: this.username,
//       password: this.password,
//       companyCode: this.selectedCompanyCode,
//       branchCode: this.selectedBranchCode
//     }).subscribe({
//       next: res => {
//         this.loading = false;

//         let user = res.user_name ?? res.username;

//         this.authService.setSession(
//           res.token,
//           user,
//           this.selectedCompanyCode,
//           this.selectedBranchCode,
//           res.userId,
//           res.branchId,
//           res.ipAddress
//         );

//         this.loadCompanyDetails();

//         this.toast('success', 'Login Successful', `Welcome ${user}`);
//         setTimeout(() => this.router.navigate(['/dashboard']), 800);
//       },
//       error: () => {
//         this.loading = false;
//         this.setError('Invalid credentials');
//       }
//     });
//   }

//   resetBranch() {
//     this.branchOptions = [];
//     this.selectedBranchCode = '';
//   }

//   setError(msg: string) {
//     this.errorMessage = msg;
//   }

//   toast(severity: string, summary: string, detail: string) {
//     this.messageService.add({ severity, summary, detail, life: 3000 });
//   }

//   loadCompanyDetails() {
//     this.companyService.GetCompanyData().subscribe(res => {
//       if (res?.length) {
//         sessionStorage.setItem('CompanyDetails', JSON.stringify(res[0]));
//       }
//     });
//   }
// }

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../auth';

@Component({
  selector    : 'app-login',
  standalone  : true,
  imports     : [CommonModule, FormsModule],
  templateUrl : './login.html',
})
export class Login {

  private auth   = inject(Auth);
  private router = inject(Router);

  username     = signal('');
  password     = signal('');
  showPassword = signal(false);
  errorMsg     = signal('');
  loading      = signal(false);

  onSubmit(): void {
    this.errorMsg.set('');

    if (!this.username().trim() || !this.password().trim()) {
      this.errorMsg.set('Please enter both username and password.');
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      const result = this.auth.login(this.username(), this.password());
      this.loading.set(false);

      if (result === 'success') {
        this.router.navigate(['/']);        
      } else {
        this.errorMsg.set(result);         
      }
    }, 500);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}