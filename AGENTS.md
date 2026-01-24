# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages and API routes (`app/api/*`).
- `components/`: Reusable React UI components.
- `lib/`: Shared utilities; engine execution helpers live in `lib/engine/`.
- `benchmark/`: Engine benchmarks and docs.
- `binary/`: Local engine binaries for development (not bundled by default).
- `public/`: Static assets served by Next.js.

## Build, Test, and Development Commands

- `pnpm dev`: Run the Next.js dev server on port 8000.
- `pnpm build`: Production build.
- `pnpm start`: Start the production server on port 8000.
- `pnpm format`: Run Prettier on supported files.
- `pnpm test`: Placeholder (currently prints “No tests yet”).
- `pnpm vercel-build`: Vercel build step; installs jsvu engines and bundles `.jsvu` for runtime.

## Coding Style & Naming Conventions

- Formatting is enforced by Prettier (`.prettierrc`): no semicolons, single quotes, trailing commas, one JSX attribute per line.
- Use TypeScript/ESM imports; keep filenames descriptive and lower-case where possible.
- API route handlers live under `app/api/<route>/route.ts` using Next.js conventions.

## Testing Guidelines

- No automated tests are currently set up.
- If adding tests, include clear run instructions in this file and update `pnpm test` to execute them.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (e.g., `fix: ...`, `chore: ...`, `chore(vercel): ...`).
- PRs should include:
  - A concise description of changes and rationale.
  - Linked issues when applicable.
  - Screenshots or short clips for UI changes.

## Configuration & Deployment Notes

- Vercel builds rely on `pnpm vercel-build` to install `v8`, `jsc`, and `quickjs` via `jsvu` and copy them to `./.jsvu`.
- `next.config.mjs` includes `.jsvu/**/*` in output tracing so binaries are available at runtime.
