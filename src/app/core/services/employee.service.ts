import { Injectable, inject } from '@angular/core';

import { Employee, EmployeeFilters, EmployeeInput } from '../../models/employee';
import { GraphqlService } from './graphql.service';

const MOCK_EMPLOYEES_KEY = 'employeehub.mock.employees';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly graphql = inject(GraphqlService);

  async getEmployees(filters: EmployeeFilters = {}): Promise<Employee[]> {
    try {
      return await this.fetchEmployeesWithGraphql(filters);
    } catch {
      return this.filterEmployees(this.readMockEmployees(), filters);
    }
  }

  async getEmployeeById(id: string): Promise<Employee> {
    try {
      const query = `
        query Employee($id: ID!) {
          employee(id: $id) {
            id
            firstName
            lastName
            email
            department
            position
            salary
            phone
            bio
            profilePicture
            createdAt
          }
        }
      `;
      const data = await this.graphql.request<{ employee: Employee }>(query, { id });
      return data.employee;
    } catch {
      const employee = this.readMockEmployees().find((entry) => entry.id === id);
      if (!employee) {
        throw new Error('Employee not found');
      }
      return employee;
    }
  }

  async createEmployee(input: EmployeeInput): Promise<Employee> {
    try {
      const query = `
        mutation AddEmployee($input: EmployeeInput!) {
          addEmployee(input: $input) {
            id
            firstName
            lastName
            email
            department
            position
            salary
            phone
            bio
            profilePicture
            createdAt
          }
        }
      `;
      const data = await this.graphql.request<{ addEmployee: Employee }>(query, { input });
      return data.addEmployee;
    } catch {
      const employees = this.readMockEmployees();
      const createdEmployee: Employee = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input
      };
      localStorage.setItem(MOCK_EMPLOYEES_KEY, JSON.stringify([createdEmployee, ...employees]));
      return createdEmployee;
    }
  }

  async updateEmployee(id: string, input: EmployeeInput): Promise<Employee> {
    try {
      const query = `
        mutation UpdateEmployee($id: ID!, $input: EmployeeInput!) {
          updateEmployee(id: $id, input: $input) {
            id
            firstName
            lastName
            email
            department
            position
            salary
            phone
            bio
            profilePicture
            createdAt
          }
        }
      `;
      const data = await this.graphql.request<{ updateEmployee: Employee }>(query, { id, input });
      return data.updateEmployee;
    } catch {
      const employees = this.readMockEmployees();
      const index = employees.findIndex((entry) => entry.id === id);

      if (index === -1) {
        throw new Error('Employee not found');
      }

      const updatedEmployee: Employee = {
        ...employees[index],
        ...input
      };
      employees[index] = updatedEmployee;
      localStorage.setItem(MOCK_EMPLOYEES_KEY, JSON.stringify(employees));
      return updatedEmployee;
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    try {
      const query = `
        mutation DeleteEmployee($id: ID!) {
          deleteEmployee(id: $id)
        }
      `;
      await this.graphql.request<{ deleteEmployee: boolean }>(query, { id });
    } catch {
      const nextEmployees = this.readMockEmployees().filter((entry) => entry.id !== id);
      localStorage.setItem(MOCK_EMPLOYEES_KEY, JSON.stringify(nextEmployees));
    }
  }

  private async fetchEmployeesWithGraphql(filters: EmployeeFilters): Promise<Employee[]> {
    const query = `
      query Employees($department: String, $position: String) {
        employees(department: $department, position: $position) {
          id
          firstName
          lastName
          email
          department
          position
          salary
          phone
          bio
          profilePicture
          createdAt
        }
      }
    `;
    const data = await this.graphql.request<{ employees: Employee[] }>(query, filters);
    return data.employees;
  }

  private filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
    return employees.filter((employee) => {
      const departmentMatch = filters.department
        ? employee.department.toLowerCase().includes(filters.department.toLowerCase())
        : true;
      const positionMatch = filters.position
        ? employee.position.toLowerCase().includes(filters.position.toLowerCase())
        : true;
      return departmentMatch && positionMatch;
    });
  }

  private readMockEmployees(): Employee[] {
    const rawEmployees = localStorage.getItem(MOCK_EMPLOYEES_KEY);
    if (!rawEmployees) {
      return [
        {
          id: 'emp-1',
          firstName: 'Ava',
          lastName: 'Morgan',
          email: 'ava.morgan@company.com',
          department: 'Engineering',
          position: 'Frontend Developer',
          salary: 85000,
          phone: '416-555-0101',
          bio: 'Builds internal dashboards and performance-focused UI.',
          createdAt: '2026-01-18T10:30:00.000Z'
        },
        {
          id: 'emp-2',
          firstName: 'Noah',
          lastName: 'Singh',
          email: 'noah.singh@company.com',
          department: 'Human Resources',
          position: 'HR Coordinator',
          salary: 62000,
          phone: '416-555-0198',
          bio: 'Coordinates hiring workflow and employee onboarding.',
          createdAt: '2026-02-05T14:10:00.000Z'
        }
      ];
    }

    try {
      return JSON.parse(rawEmployees) as Employee[];
    } catch {
      localStorage.removeItem(MOCK_EMPLOYEES_KEY);
      return [];
    }
  }
}
