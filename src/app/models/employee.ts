export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  createdAt?: string;
}

export interface EmployeeFilters {
  department?: string;
  position?: string;
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  phone?: string;
  bio?: string;
  profilePicture?: string;
}
