import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-panel-legacy',
  standalone: true,
  template: `<div>Redirecting to dashboard...</div>`
})
export class AdminPanelComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigate(['/admin/dashboard']);
  }
}
