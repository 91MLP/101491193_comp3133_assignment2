import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Employee } from '../../models/employee';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-list-page',
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-list-page.component.html',
  styleUrl: './employee-list-page.component.scss'
})
export class EmployeeListPageComponent {
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly today = new Date();
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly employees = signal<Employee[]>([]);

  protected readonly filterForm = this.fb.nonNullable.group({
    department: [''],
    position: ['']
  });

  constructor() {
    void this.loadEmployees();
  }

  protected async applyFilters(): Promise<void> {
    await this.loadEmployees();
  }

  protected async clearFilters(): Promise<void> {
    this.filterForm.reset({
      department: '',
      position: ''
    });
    await this.loadEmployees();
  }

  protected async deleteEmployee(id: string): Promise<void> {
    const confirmed = window.confirm('Delete this employee record?');
    if (!confirmed) {
      return;
    }

    await this.employeeService.deleteEmployee(id);
    await this.loadEmployees();
  }

  protected viewDetails(id: string): void {
    void this.router.navigate(['/employees', id]);
  }

  private async loadEmployees(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const filters = this.filterForm.getRawValue();
      const employees = await this.employeeService.getEmployees({
        department: filters.department.trim() || undefined,
        position: filters.position.trim() || undefined
      });
      this.employees.set(employees);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load employees');
    } finally {
      this.isLoading.set(false);
    }
  }
}
