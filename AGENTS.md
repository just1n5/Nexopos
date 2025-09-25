# Repository Guidelines
## Project Structure & Module Organization
The React + TypeScript client lives in `frontend/src/`. Shared UI components live under `frontend/src/components/`, routable screens in `frontend/src/views/`, Zustand slices in `frontend/src/stores/`, reusable hooks in `frontend/src/hooks/`, and utilities or models in `frontend/src/lib/` and `frontend/src/types/`. Co-locate focused tests beside the code in `__tests__/` directories, and drop static assets in `frontend/public/`. Backend scripts remain in `backend/`; avoid leaking server-only logic into the UI tree.

## Build, Test, and Development Commands
Run `npm install` inside `frontend/` to sync dependencies. `npm run dev` launches Vite at http://localhost:5173 for manual QA. Ship ready builds with `npm run build`, then inspect with `npm run preview`. Lint the codebase via `npm run lint` (warnings fail the build), and execute automated suites with `npm run test` or `npx vitest --runInBand`.

## Coding Style & Naming Conventions
Author functional React components with 2-space indentation and TypeScript-first APIs. Compose Tailwind classes in layout > spacing > color order, e.g. `flex flex-col gap-4 bg-slate-100`. Components use PascalCase (`CustomerTable.tsx`), hooks start with `use`, and Zustand stores end in `Store`. Let ESLint + Prettier guide formatting; only run `npm run lint -- --fix` if the rule set cannot auto-correct.

## Testing Guidelines
Vitest with React Testing Library powers regression coverage. Name specs after the target component (`CustomerTable.test.tsx`) and keep them in the nearest `__tests__/`. Prefer user-facing interactions, including async flows with RTL queries. Run `npm run test -- --runInBand` before every PR and capture manual checks performed via `npm run dev`.

## Commit & Pull Request Guidelines
Use Conventional Commits such as `feat: pos-123 add shift report filter` or `fix: pos-202 adjust drawer totals`. Keep each commit scoped to a single concern and avoid mixing formatting with behavior. PRs should summarize scope, link issues, list affected routes, and include QA steps or screenshots; flag risks, migrations, or follow-ups in the description.

## Security & Configuration Tips
Copy `frontend/.env.example` to `.env.local` before coding and expose browser values only with a `VITE_` prefix. Never commit secrets, production datasets, or customer identifiers. Run `npm audit` regularly, resolve high-severity items quickly, and coordinate backend credential changes with the server team.
