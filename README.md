# Hospital Management System (HMS)

Monorepo scaffold for the Hospital Management System.

This commit creates a Next.js 14+ TypeScript frontend (apps/web) and an Express + TypeScript backend (apps/server) with Prisma schema and API route stubs. It includes Redux Toolkit store skeleton, NextAuth/JWT placeholders, Socket.io server/client integration points, and the Prisma schema matching your provided models.

Next steps (local):
- Copy .env.example to .env in both apps as needed and fill values.
- Run `npm install` in repo root (workspaces) or inside each app.
- Generate Prisma client: `npx prisma generate` from apps/server.
- Run migrations or `prisma db push`.
- Start backend: `pnpm --filter ./apps/server dev` or `npm run dev` inside apps/server.
- Start frontend: `pnpm --filter ./apps/web dev` or `npm run dev` inside apps/web.

This scaffold includes:
- Prisma schema with User, Patient, Consultation, Prescription, Medicine, Sale models and Role enum
- Express server with route stubs for auth, users, patients, consultations, medicines, pharmacy
- Socket.io setup in the server and client placeholder in the Next.js app
- Redux Toolkit auth slice and store skeleton
- Next.js App Router skeleton with login page and role-based layout placeholder
- Tailwind and PostCSS configs

Refer to package.json scripts in each app for available commands.
