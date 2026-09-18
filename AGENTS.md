# Agent Guide

Guidance for AI coding agents (and human contributors) working in this repo.

## Setting up a new workspace

When starting work in a fresh checkout or worktree, always run:

```bash
npm ci
```

Use `npm ci` rather than `npm install` for a new workspace — it installs exactly
what's in `package-lock.json` and is faster/more reproducible. Only fall back
to `npm install` if you are intentionally changing dependencies.

This repo targets the Node.js version pinned in [`.nvmrc`](/.nvmrc) (`lts`). If
you use `nvm`, run `nvm use` before installing.

## Always use the npm scripts in package.json

This repo defines scripts in [package.json](/package.json) for formatting,
linting, type-checking, and building. **Always use these scripts instead of
invoking the underlying tools (`prettier`, `eslint`, `tsc`, `vite`) directly**,
so agents and contributors get consistent flags/config every time.

| Task | Command | Notes |
| --- | --- | --- |
| Format code | `npm run format` | Runs `prettier --write .` |
| Lint | `npm run lint` | Runs `eslint` over `src/**/*.{ts,js,svelte}` |
| Type-check | `npm run typecheck:node` | Runs `tsc -p tsconfig.node.json` |
| Build | `npm run build` | Runs `typecheck:node` then `vite build` |
| Dev server | `npm run dev` | Starts Vite dev server |
| Preview build | `npm run preview` | Serves the production build locally |

Before finishing a change, run the smallest combination of these that covers
what you touched (e.g. `npm run lint` and `npm run typecheck:node` for a
TypeScript change), and prefer `npm run build` when you want to validate the
full pipeline since it includes the type-check step.

Do not add new ad-hoc lint/format/build tooling or invent bespoke commands —
if a task isn't covered by an existing script, prefer extending
[package.json](/package.json) scripts over one-off shell invocations.

## Other scripts

- `npm run auto-generate-planetoids` / `npm run auto-generate-gas-giants` —
  Playwright-driven batch generation scripts (see [README.md](/README.md) for
  usage and options).
- `npm run updates` / `npm run upgrade` — check/apply dependency updates via
  `npm-check-updates`. Only run these when explicitly asked to update
  dependencies.
