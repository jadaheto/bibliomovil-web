import { Component, inject } from '@angular/core';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-alerts',
  template: `
    @for (m of alerts.messages(); track m.id) {
      <div class="alert alert-{{ m.type }} alert-dismissible fade show d-flex align-items-start" role="alert">
        <i class="me-2 fs-5" [class]="icon(m.type)"></i>
        <div class="flex-grow-1">{{ m.text }}</div>
        <button type="button" class="btn-close" aria-label="Cerrar" (click)="alerts.dismiss(m.id)"></button>
      </div>
    }
  `,
})
export class AlertsComponent {
  readonly alerts = inject(AlertService);

  icon(type: string): string {
    switch (type) {
      case 'success': return 'ri-checkbox-circle-line';
      case 'danger': return 'ri-error-warning-line';
      case 'warning': return 'ri-alert-line';
      default: return 'ri-information-line';
    }
  }
}
