# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/` (React + TypeScript). Reusable UI in `src/components/`, route flows in `src/views/`, Zustand slices in `src/stores/`, shared hooks in `src/hooks/`, utilities and types in `src/lib/` + `src/types/`.
- Co-locate focused tests in `__tests__/` alongside the modules they cover.
- Static assets served via Vite belong in `public/`. Update root configs (`vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`) together when tooling shifts.

## Build, Test, and Development Commands
- `npm run dev` - start the Vite dev server at http://localhost:5173 for manual QA.
- `npm run build` - type-check and emit the optimized production bundle in `dist/`.
- `npm run preview` - serve the production build for smoke checks.
- `npm run lint` - run ESLint/Prettier; treat warnings as failures.

## Coding Style & Naming Conventions
- Use functional React components with 2-space indentation.
- Group Tailwind utilities by layout > spacing > color (e.g. `flex flex-col gap-4 bg-slate-100`).
- Components use PascalCase (`CustomerTable.tsx`); hooks use a `use` prefix; Zustand stores end with `Store`.
- Configure editors to run ESLint and Prettier on save; do not bypass lint fixes.

## Testing Guidelines
- Adopt Vitest + React Testing Library; place suites in module-level `__tests__/`.
- Name files after the subject under test (`CustomerTable.test.tsx`).
- Until automated coverage lands, validate features via `npm run dev`, capture evidence, and document manual steps in PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat: pos-123 add shift report filter`).
- PRs must summarise changes, link issues, note affected routes, and attach QA media.
- Keep diffs focused; split cosmetic cleanups from feature work.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; expose client vars with `VITE_`.
- Never commit secrets or production data; scrub customer details before demos.
- Run `npm audit` regularly and follow up on high-severity alerts.
