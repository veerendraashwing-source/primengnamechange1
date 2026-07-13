import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';

interface Page {
  key: string;
  label: string;
  route: string;
  subModule: string;
}

@Component({
  selector: 'app-changeinfo',
  standalone: true,
  templateUrl: './changeinfo.html',
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AutoCompleteModule,
    TooltipModule,
    BadgeModule,
    DividerModule,
    RippleModule
  ]
})
export class ChangeInfo {

  private router = inject(Router);

  activeKey: string = '';
  searchQuery: string = '';
  autoSuggestions: Page[] = [];

  pages: Page[] = [
    { key: 'agent',                         label: 'Agent Branch ID Change',             route: '/agentbranchidchange',            subModule: 'Transactions' },
    { key: 'auctiondatetime',               label: 'Auction DateTime',                   route: '/auctiondatetime',                subModule: 'Transactions' },
    { key: 'bidlosspermission',             label: 'Bidloss Permission',                 route: '/bidlosspermission',              subModule: 'Transactions' },
    { key: 'businesschange',                label: 'Businesschange',                     route: '/businesschange',                 subModule: 'Transactions' },
    { key: 'changtermintndtcommencedt',     label: 'Change Commencement & Termination',  route: '/changtermintndtcommencedt',      subModule: 'Transactions' },
    { key: 'cheque',                        label: 'Cheque Issue',                       route: '/cheque-issue',                   subModule: 'Transactions' },
    { key: 'chequereturnchargespermission', label: 'Cheque Return Charges',              route: '/chequereturnchargespermission',  subModule: 'Transactions' },
    { key: 'depositedcheque',               label: 'Depositedcheque',                    route: '/depositedcheque',                subModule: 'Transactions' },
    { key: 'generalreceiptcancel',          label: 'GeneralReceiptCancel',               route: '/generalreceiptcancel',           subModule: 'Transactions' },
    { key: 'groupcodechange',               label: 'Groupcodechange',                    route: '/groupcodechange',                subModule: 'Transactions' },
    { key: 'legalcellpermission',           label: 'Legal Cell Permission',              route: '/legalcellpermission',            subModule: 'Transactions' },
    { key: 'memoreapproval',                label: 'Memo ReApproval',                    route: '/memoreapproval',                 subModule: 'Transactions' },
    { key: 'mobile',                        label: 'Mobile & Address Change',            route: '/mobile-change',                  subModule: 'Transactions' },
    { key: 'multiplecontacts',              label: 'Multiple Contacts',                  route: '/multiplecontacts',               subModule: 'Transactions' },
    { key: 'mvcancel',                      label: 'Mvcancel',                           route: '/mvcancel',                       subModule: 'Transactions' },
    { key: 'name',                          label: 'Name Change',                        route: '/name-change',                    subModule: 'Transactions' },
    { key: 'panchange',                     label: 'Panchange',                          route: '/panchange',                      subModule: 'Transactions' },
    { key: 'pdchequeremove',                label: 'Pdchequeremove',                     route: '/pdchequeremove',                 subModule: 'Transactions' },
    { key: 'psincomenotsave',               label: 'PS Income Not Save',                 route: '/psincomenotsave',                subModule: 'Transactions' },
    { key: 'reauctiondate',                 label: 'Reauctiondate',                      route: '/reauctiondate',                  subModule: 'Transactions' },
    { key: 'report',                        label: 'Reports',                            route: '/reportofupdates',                subModule: 'Reports'      },
    { key: 'sjvpermission',                 label: 'SJVpermission',                      route: '/sjvpermission',                  subModule: 'Transactions' },
    { key: 'vaccantreceiptpermission',      label: 'Vacant Receipt',                     route: '/vaccantreceiptpermission',       subModule: 'Transactions' },
    { key: 'guarantornamechange',           label: 'Guarantor Name Change',              route: '/guarantornamechange',            subModule: 'Transactions' }
  ];

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const url = this.router.url;
        const match = this.pages.find(p => url === p.route);
        this.activeKey = match ? match.key : '';
      });
  }


  get filteredPages(): Page[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.pages;
    return this.pages.filter(p => p.label.toLowerCase().includes(q));
  }

  get subModuleGroups(): { name: string; items: Page[] }[] {
    const map = new Map<string, Page[]>();
    this.filteredPages.forEach(p => {
      if (!map.has(p.subModule)) map.set(p.subModule, []);
      map.get(p.subModule)!.push(p);
    });
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }

  get activeLabel(): string {
    return this.pages.find(p => p.key === this.activeKey)?.label ?? '';
  }


  navigate(page: Page): void {
    this.activeKey = page.key;
    this.searchQuery = '';
    this.router.navigate([page.route]);
  }

  searchPages(event: { query: string }): void {
    const q = event.query.toLowerCase();
    this.autoSuggestions = this.pages.filter(p =>
      p.label.toLowerCase().includes(q)
    );
  }

  onAutoSelect(event: { value: Page }): void {
    if (event?.value?.route) {
      this.navigate(event.value);
    }
  }
}