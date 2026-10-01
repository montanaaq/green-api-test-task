# AGENTS.md

## Project

This is a small React chat for sending and receiving text messages in MAX through GREEN-API. The user enters `idInstance` and `apiTokenInstance` on the connection screen, opens a chat by the recipient's phone number, sends a message, and sees replies in the chat. Only `GREEN_API_URL` is configured in `.env`. Keep the interface close to the appearance of [MAX Web](https://web.max.ru/) and limit it to this flow.

Use GREEN-API's CheckAccount to resolve the MAX chat ID, [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/) for outgoing messages, and [HTTP API receiving](https://green-api.com/v3/docs/api/receiving/technology-http-api/) for incoming messages. Support text messages only. The assignment permits WhatsApp or Telegram if MAX cannot be implemented.

## Stack and architecture

- React 19, TypeScript, Vite, TanStack Router, Mantine, Lucide icons, and `@siberiacancode/reactuse`.
- Use TanStack Start in SPA mode for file-based routes and server functions. Render the chat on the client without SSR or Next.js.
- Store user-entered GREEN-API credentials in sessionStorage for the current tab and send them to server functions in POST bodies. Never put credentials in `VITE_` variables, navigation URLs, or logs. The app uses those credentials to authorize upstream requests and has no separate registration system.
- Use pnpm and the existing Oxlint and Oxfmt configuration.
- Keep dependencies minimal. Reuse the installed stack and browser APIs before adding packages.

## Before editing

- Inspect the relevant code and follow established project patterns before creating files or abstractions.
- For substantial changes, run `pnpm dlx @tanstack/intent@latest list` from the project root. Load a matching local skill before editing.
- Check local skills or official documentation for unfamiliar React, Vite, TanStack Router, or GREEN-API APIs. Do not guess signatures or response shapes.
- Explain any architectural trade-off briefly before implementing it.

## Code conventions

- Write strict, maintainable TypeScript. Avoid `any`, unnecessary assertions, and suppressed type, lint, or runtime errors.
- Prefer small functions, early returns, and existing utilities. Keep routes focused on route declarations; put feature components in `src/components` and place substantial state and effects in hooks beside those components.
- Keep each GREEN-API server function in its own `.functions.ts` file in `src/services`. Keep server-only request helpers and upstream response validation in `src/lib/green-api`, reusable values in `src/constants`, helpers in `src/lib`, and project types in `src/types`. Keep app contexts in `src/contexts`, reusable hooks in `src/hooks`, and feature components in PascalCase folders under `src/components`. Use Mantine components directly; do not create wrappers for UI primitives.
- Compute display text, initials, dates, and class names before returning JSX rather than chaining formatting expressions inside JSX.
- Let JSX infer form submit event types. Do not use the deprecated `FormEvent` type.
- Use Lucide icons for interface actions, TanStack Query for API queries and mutations, and `@siberiacancode/reactuse` hooks when they replace manual browser logic. Check the hook's skill reference before using it.
- Use file-based routes in `src/routes` and TanStack Router's `Link` for app navigation. Do not edit `src/routeTree.gen.ts` by hand.
- Prefer arrow functions for components, `interface` for component props, and default exports from standalone component files. Use named exports for hooks, utilities, constants, schemas, and types.
- Name components in PascalCase and hooks in camelCase with a `use` prefix. Prefix project event handlers with `on` rather than `handle`.
- If a mutation object is needed, suffix its variable with `Mutation` and call its methods through that object. Do not add a mutation library solely to follow this naming rule.
- Use `.const.ts`, `.schema.ts`, and `.types.ts` suffixes when those separate files are useful. Import public code through the corresponding folder barrel using `@/` aliases; keep server-only helpers out of these barrels.
- Use Mantine components, theme tokens, and layout props. Avoid custom CSS and UI wrappers. Keep controls accessible and action labels stable while requests are pending.
- Keep instance credentials out of source control and logs. Handle API failures visibly; do not silently discard failed sends or receives.

## Checks

- Run the relevant lint, type, and production build checks after code changes. Fix their root causes instead of suppressing failures.
