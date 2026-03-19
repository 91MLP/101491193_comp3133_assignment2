# 101491193_comp3133_assignment2

Angular frontend for COMP3133 Assignment 2.

## Features

- Login and signup pages with reactive form validation
- Session persistence using `localStorage`
- Protected employee routes with login redirect
- Employee list with search by department and position
- Employee CRUD flow: add, view details, edit, delete
- Profile picture upload with image preview
- GraphQL service layer using `fetch`
- Local mock fallback when the backend GraphQL API is unavailable

## Routes

- `/login`
- `/signup`
- `/employees`
- `/employees/new`
- `/employees/:id`
- `/employees/:id/edit`

## Run locally

```bash
npm install
npm start
```

The app runs at `http://localhost:4200`.
`npm start` now uses Angular's proxy config so frontend requests to `/graphql` are forwarded to `http://localhost:4000/graphql` during local development.

## Demo account

If no backend is running, the app falls back to local mock authentication and employee data.

- Email: `demo@example.com`
- Password: `Password123!`

## GraphQL backend expectation

The frontend sends requests to:

```text
/graphql
```

In Angular development mode, that path is proxied to `http://localhost:4000/graphql` by `proxy.conf.json`.

Expected operations:

- `login(email, password)`
- `signup(name, email, password)`
- `employees(department, position)`
- `employee(id)`
- `addEmployee(input)`
- `updateEmployee(id, input)`
- `deleteEmployee(id)`

If your backend schema uses different field names, adjust the query strings in:

- `src/app/core/services/auth.service.ts`
- `src/app/core/services/employee.service.ts`

## Verification

- `./node_modules/.bin/tsc -p tsconfig.app.json --noEmit`
- `./node_modules/.bin/ngc -p tsconfig.app.json`

`ng build` currently crashes under Node `v25.6.0` in this environment because esbuild deadlocks on this odd-numbered Node release. Use an LTS Node version such as Node 22 to run the full Angular build reliably.
