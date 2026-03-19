import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Employee } from '../../models/employee';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-detail-page',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './employee-detail-page.component.html',
  styleUrl: './employee-detail-page.component.scss'
})
export class EmployeeDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);

  protected readonly employee = signal<Employee | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  constructor() {
    void this.loadEmployee();
  }

  protected back(): void {
    void this.router.navigate(['/employees']);
  }

  private async loadEmployee(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Missing employee id');
      this.isLoading.set(false);
      return;
    }

    try {
      this.employee.set(await this.employeeService.getEmployeeById(id));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load employee');
    } finally {
      this.isLoading.set(false);
    }
  }
}
