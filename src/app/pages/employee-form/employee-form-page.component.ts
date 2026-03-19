import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { EmployeeInput } from '../../models/employee';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-form-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form-page.component.html',
  styleUrl: './employee-form-page.component.scss'
})
export class EmployeeFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly employeeId = this.route.snapshot.paramMap.get('id');

  protected readonly isEditMode = signal(Boolean(this.employeeId));
  protected readonly isSubmitting = signal(false);
  protected readonly isLoading = signal(Boolean(this.employeeId));
  protected readonly errorMessage = signal('');
  protected readonly imagePreview = signal('');

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['', [Validators.required]],
    position: ['', [Validators.required]],
    salary: [0, [Validators.required, Validators.min(1)]],
    phone: [''],
    bio: [''],
    profilePicture: ['']
  });

  constructor() {
    if (this.employeeId) {
      void this.loadEmployee();
    }
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const fileAsDataUrl = await this.readFileAsDataUrl(file);
    this.imagePreview.set(fileAsDataUrl);
    this.form.patchValue({ profilePicture: fileAsDataUrl });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.form.getRawValue();
      const payload: EmployeeInput = {
        ...formValue,
        salary: Number(formValue.salary)
      };

      if (this.employeeId) {
        await this.employeeService.updateEmployee(this.employeeId, payload);
      } else {
        await this.employeeService.createEmployee(payload);
      }

      void this.router.navigate(['/employees']);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save employee');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected cancel(): void {
    void this.router.navigate(['/employees']);
  }

  private async loadEmployee(): Promise<void> {
    if (!this.employeeId) {
      return;
    }

    try {
      const employee = await this.employeeService.getEmployeeById(this.employeeId);
      this.form.patchValue({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        salary: employee.salary,
        phone: employee.phone || '',
        bio: employee.bio || '',
        profilePicture: employee.profilePicture || ''
      });
      this.imagePreview.set(employee.profilePicture || '');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load employee');
    } finally {
      this.isLoading.set(false);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read image file'));
      reader.readAsDataURL(file);
    });
  }
}
