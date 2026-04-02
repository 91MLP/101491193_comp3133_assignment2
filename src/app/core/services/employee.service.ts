import { Injectable, inject } from '@angular/core';

import { Employee, EmployeeFilters, EmployeeInput } from '../../models/employee';
import { GraphqlService } from './graphql.service';

const MOCK_EMPLOYEES_KEY = 'employeehub.mock.employees';

interface BackendEmployee {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  designation: string;
  salary: number;
  date_of_joining: string;
  department: string;
  employee_photo?: string | null;
  createdAt?: string;
}

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
          searchEmployeeById(id: $id) {
            _id
            first_name
            last_name
            email
            gender
            department
            designation
            salary
            date_of_joining
            employee_photo
            createdAt
          }
        }
      `;
      const data = await this.graphql.request<{ searchEmployeeById: BackendEmployee }>(query, { id });
      return this.mapBackendEmployee(data.searchEmployeeById);
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
        mutation AddEmployee(
          $first_name: String!
          $last_name: String!
          $email: String!
          $gender: String!
          $designation: String!
          $salary: Float!
          $date_of_joining: String!
          $department: String!
          $employee_photo: String
        ) {
          addEmployee(
            first_name: $first_name
            last_name: $last_name
            email: $email
            gender: $gender
            designation: $designation
            salary: $salary
            date_of_joining: $date_of_joining
            department: $department
            employee_photo: $employee_photo
          ) {
            _id
            first_name
            last_name
            email
            gender
            department
            designation
            salary
            date_of_joining
            employee_photo
            createdAt
          }
        }
      `;
      const data = await this.graphql.request<{ addEmployee: BackendEmployee }>(
        query,
        this.toBackendEmployeeInput(input)
      );
      return this.mapBackendEmployee(data.addEmployee);
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
        mutation UpdateEmployee(
          $id: ID!
          $first_name: String
          $last_name: String
          $email: String
          $gender: String
          $designation: String
          $salary: Float
          $date_of_joining: String
          $department: String
          $employee_photo: String
        ) {
          updateEmployee(
            id: $id
            first_name: $first_name
            last_name: $last_name
            email: $email
            gender: $gender
            designation: $designation
            salary: $salary
            date_of_joining: $date_of_joining
            department: $department
            employee_photo: $employee_photo
          ) {
            _id
            first_name
            last_name
            email
            gender
            department
            designation
            salary
            date_of_joining
            employee_photo
            createdAt
          }
        }
      `;
      const data = await this.graphql.request<{ updateEmployee: BackendEmployee }>(query, {
        id,
        ...this.toBackendEmployeeInput(input)
      });
      return this.mapBackendEmployee(data.updateEmployee);
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
      query Employees($department: String, $designation: String) {
        searchEmployeeByDesignationOrDepartment(department: $department, designation: $designation) {
          _id
          first_name
          last_name
          email
          gender
          department
          designation
          salary
          date_of_joining
          employee_photo
          createdAt
        }
      }
    `;
    try {
      const data = await this.graphql.request<{ searchEmployeeByDesignationOrDepartment: BackendEmployee[] }>(
        query,
        {
          department: filters.department,
          designation: filters.position
        }
      );
      return data.searchEmployeeByDesignationOrDepartment.map((employee) =>
        this.mapBackendEmployee(employee)
      );
    } catch (error) {
      if (!filters.department && !filters.position) {
        const fallbackQuery = `
          query Employees {
            getAllEmployees {
              _id
              first_name
              last_name
              email
              gender
              department
              designation
              salary
              date_of_joining
              employee_photo
              createdAt
            }
          }
        `;
        const data = await this.graphql.request<{ getAllEmployees: BackendEmployee[] }>(fallbackQuery);
        return data.getAllEmployees.map((employee) => this.mapBackendEmployee(employee));
      }
      throw error;
    }
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
          gender: 'Female',
          department: 'Engineering',
          position: 'Frontend Developer',
          salary: 85000,
          dateOfJoining: '2026-01-18',
          phone: '416-555-0101',
          bio: 'Builds internal dashboards and performance-focused UI.',
          createdAt: '2026-01-18T10:30:00.000Z'
        },
        {
          id: 'emp-2',
          firstName: 'Noah',
          lastName: 'Singh',
          email: 'noah.singh@company.com',
          gender: 'Male',
          department: 'Human Resources',
          position: 'HR Coordinator',
          salary: 62000,
          dateOfJoining: '2026-02-05',
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

  private mapBackendEmployee(employee: BackendEmployee): Employee {
    return {
      id: employee._id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      gender: employee.gender,
      department: employee.department,
      position: employee.designation,
      salary: employee.salary,
      dateOfJoining: employee.date_of_joining,
      profilePicture: employee.employee_photo ?? '',
      createdAt: employee.createdAt
    };
  }

  private toBackendEmployeeInput(input: EmployeeInput): Record<string, unknown> {
    return {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      gender: input.gender,
      designation: input.position,
      salary: input.salary,
      date_of_joining: input.dateOfJoining,
      department: input.department,
      employee_photo: input.profilePicture || null
    };
  }
}
