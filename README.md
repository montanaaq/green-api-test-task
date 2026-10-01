# MAX chat via GREEN-API

React chat with Mantine components, TanStack Router file routes, and TanStack Start in SPA mode. The interface renders in the browser; server functions call GREEN-API using the credentials entered by the user. Credentials are saved in sessionStorage for the current browser tab and sent to server functions in POST bodies, never in navigation URLs.

## Local setup

Use Node.js 24 and pnpm 12.8.1, as specified in `package.json`.

1. Run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `GREEN_API_URL` to the API URL shown for your instance, usually `https://api.green-api.com`. Instance credentials are not read from `.env`.
3. Authorize the MAX instance in the GREEN-API console. For HTTP API receiving, leave `webhookUrl` empty and set `incomingWebhook` to `yes` in instance settings. Wait for settings to apply, then send a new text message from the recipient's MAX account. Previously disabled notifications are not replayed. Another app polling the same instance can consume its notifications.
4. Run `pnpm dev` and open `http://localhost:3000`.
5. Enter `idInstance` and `apiTokenInstance` on the connection screen. The app validates them via `GetSettings`. Use “Выйти” in the sidebar to clear the session and cached data, then connect another instance.

The app checks receiving settings and shows a warning if incoming notifications are disabled or a webhook URL is set. Enable `outgoingMessageWebhook=yes` to also display text sent from the MAX phone, web, or desktop app, including Saved Messages. The app warns when this setting is disabled. Incoming and outgoing text notifications update the chat automatically without duplicates. One receiver runs while the app is connected, including on the new-chat screen. Text messages remain in memory across chat navigation. Chat history is reloaded after a page refresh.

Delivery errors (`failed`, `noAccount`, `notInGroup`) appear below the affected message. The app also restores errors reported in chat history. GREEN-API responses are checked before use; malformed text notifications remain in the queue and produce a visible error. Unsupported media and unrelated notifications are acknowledged without being displayed. Use one open tab per instance: other tabs or apps can consume notifications from the same queue.

Enter a Russian phone number in international format to create a chat. The app calls `CheckAccount` to get the MAX chat ID, `SendMessage` to send text, and `ReceiveNotification` plus `DeleteNotification` to show replies. The latest 50 text messages are loaded from `GetChatHistory` when a chat opens.

The app needs a server runtime for its server functions. Deploy the full TanStack Start output, not just the generated static shell. Do not put instance credentials in `VITE_` variables. Use HTTPS in production because credentials are sent to the server. sessionStorage is accessible to JavaScript on this origin. All chat screens require instance credentials. Server functions validate credentials and scope upstream requests and cached reads to that instance. The app does not provide a separate user registration system.

## Structure

- `src/routes`: TanStack file-based route declarations, without Next.js or App Router.
- `src/components`: feature folders `Layout`, `NewChat`, and `Chat`, with conversation logic beside its components.
- `src/contexts` and `src/hooks`: chat context and reusable hooks.
- `src/services`: one GREEN-API server function per `.functions.ts` file.
- `src/lib`: server-only GREEN-API request helpers, response validation, and display utilities.
- `src/constants` and `src/types`: reusable values and project types.

Public modules use folder barrels and `@/` imports. Server-only helpers are imported directly. UI uses Mantine's default dark theme and components without custom UI wrappers or Tailwind.

## Checks

Run `pnpm lint`, `pnpm types`, `pnpm format --check`, `pnpm test`, and `pnpm build`. Tests use a fake HTTP adapter and never send real messages.

Before submitting, check the deployed app in a private window:

1. Open `/` without credentials and verify navigation to `/connect`. Enter invalid credentials and confirm a visible error.
2. Connect an authorized MAX instance, enter a recipient's phone number, and open the chat.
3. Send a text message and confirm it arrives in MAX. Reply from the recipient's phone and confirm the reply appears once in the app.
4. Send text containing a URL, navigate between chats, and refresh the page. Confirm text history loads without duplicates.
5. Disconnect the network while sending. Confirm the error is visible and the draft remains available to retry.
6. Use “Выйти”, connect another instance, and verify that the previous instance's chats and messages are absent.
7. Compare the chat layout with MAX Web on desktop and a narrow mobile viewport. Check keyboard navigation, scrolling, and long messages.

Real delivery requires an authorized instance and a second MAX account; automated tests do not establish that delivery works on the published site.

## Vercel

The Nitro Vite plugin builds the TanStack Start server functions for Vercel. Import the repository with framework preset **TanStack Start**, use Node.js 24, and set `GREEN_API_URL` in the project environment variables. Leave the build command and output directory at their framework defaults. Do not add instance IDs or tokens to Vercel environment variables; each visitor enters their own credentials on the connection screen.

The full deployment includes server functions. A static-only deployment cannot send or receive messages. Build locally with `pnpm build`; verify the Vercel output with `NITRO_PRESET=vercel pnpm build`. See [Vercel hosting instructions](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel).
