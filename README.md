# ProcureX

A lightweight inventory app scaffold inspired by the reference site. This project includes a React + TypeScript frontend (Vite) and a mock JSON API using `json-server`.

Getting started (Windows PowerShell):

1. Install dependencies:

```powershell
npm install
```

2. Start the mock API:

```powershell
npm run start:api
```

3. Start the dev server (in a new terminal):

```powershell
npm run dev
```

Open http://localhost:5173 and the API at http://localhost:4000/items

Notes:
- The UI is intentionally minimal and focuses on the Inventory listing. Next steps would be implementing add/edit/delete forms, CSV import/export, search and filters to fully match the reference.
