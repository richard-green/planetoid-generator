# svelte-test

Simple Svelte app with a lightweight client-side router and a Satellite view page.

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Run in development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Routing

The app uses a small pathname-based router in `src/App.svelte`.

Available route parameters (paths):

- `/satellite` → Satellite View page

Unknown paths are redirected to `/satellite`.

## Notes

- Global `error` and `unhandledrejection` listeners are mounted once in `App.svelte`.
- `Toaster` is mounted once in `App.svelte` to avoid duplicate toasts.
