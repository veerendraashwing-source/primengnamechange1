import { Routes } from '@angular/router';
import { authGuard } from './auth-guard';
import { Login } from './login/login';
import { ChangeInfo } from './changeinfo/changeinfo';
import { Namechang } from './namechang/namechang';
import { Mobilenochange } from './mobilenochange/mobilenochange';
import { Agentbranchidchange } from './agentbranchidchange/agentbranchidchange';
import { ChequeIssue } from './cheque-issue/cheque-issue';
import { Auctiondatetime } from './auctiondatetime/auctiondatetime';
import { Bidlosspermission } from './bidlosspermission/bidlosspermission';
import { Legalcellpermission } from './legalcellpermission/legalcellpermission';
import { Reportofupdates } from './reportofupdates/reportofupdates';
import { Chequereturnchargespermission } from './chequereturnchargespermission/chequereturnchargespermission';
import { Vaccantreceiptpermission } from './vaccantreceiptpermission/vaccantreceiptpermission';
import { Multiplecontacts } from './multiplecontacts/multiplecontacts';
import { Changtermintndtcommencedt } from './changtermintndtcommencedt/changtermintndtcommencedt';
import { Businesschange } from './businesschange/businesschange';
import { Depositedcheque } from './depositedcheque/depositedcheque';
import { Generalreceiptcancel } from './generalreceiptcancel/generalreceiptcancel';
import { Memoreapproval } from './memoreapproval/memoreapproval';
import { Mvcancel } from './mvcancel/mvcancel';
import { Panchange } from './panchange/panchange';
import { Sjvpermission } from './sjvpermission/sjvpermission';
import { Psincomenotsave } from './psincomenotsave/psincomenotsave';
import { Pdchequeremove } from './pdchequeremove/pdchequeremove';
import { Groupcodechange } from './groupcodechange/groupcodechange';
import { Guarantornamechange } from './guarantornamechange/guarantornamechange';
import { Reauctiondate } from './reauctiondate/reauctiondate';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },

  {
    path: '',
    component: ChangeInfo,
    canActivate: [authGuard],
    children: [
      { path: 'name-change', component: Namechang },
      { path: 'mobile-change', component: Mobilenochange },
      { path: 'agentbranchidchange', component: Agentbranchidchange },
      { path: 'cheque-issue', component: ChequeIssue },
      { path: 'chequereturnchargespermission', component: Chequereturnchargespermission },
      { path: 'vaccantreceiptpermission', component: Vaccantreceiptpermission },
      { path: 'auctiondatetime', component: Auctiondatetime },
      { path: 'bidlosspermission', component: Bidlosspermission },
      { path: 'legalcellpermission', component: Legalcellpermission },
      { path: 'reportofupdates', component: Reportofupdates },
      { path: 'multiplecontacts', component: Multiplecontacts },
      { path: 'changtermintndtcommencedt', component: Changtermintndtcommencedt },
      { path: 'businesschange', component: Businesschange },
      { path: 'memoreapproval', component: Memoreapproval },
      { path: 'depositedcheque', component: Depositedcheque },
      { path: 'groupcodechange', component: Groupcodechange },
      { path: 'mvcancel', component: Mvcancel },
      { path: 'panchange', component: Panchange },
      { path: 'sjvpermission', component: Sjvpermission },
      { path: 'generalreceiptcancel', component: Generalreceiptcancel },
      { path: 'psincomenotsave', component: Psincomenotsave },
      { path: 'pdchequeremove', component: Pdchequeremove },
      { path: 'guarantornamechange', component: Guarantornamechange },
      { path: 'reauctiondate', component: Reauctiondate },





      { path: '', redirectTo: 'name-change', pathMatch: 'full' }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];