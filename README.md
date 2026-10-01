# MAX chat via GREEN-API

React chat with Mantine components, TanStack Router file routes, and TanStack Start in SPA mode. The interface renders in the browser; server functions call GREEN-API using the credentials entered by the user. Credentials are saved in sessionStorage for the current browser tab and sent to server functions in POST bodies, never in navigation URLs.

## Local setup

1. Run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `GREEN_API_URL` to the API URL shown for your instance, usually `https://api.green-api.com`. Instance credentials are not read from `.env`.
3. Authorize the MAX instance in the GREEN-API console. For HTTP API receiving, leave `webhookUrl` empty and set `incomingWebhook` to `yes` in instance settings. Wait for settings to apply, then send a new text message from the recipient's MAX account. Previously disabled notifications are not replayed. Another app polling the same instance can consume its notifications.
4. Run `pnpm dev` and open `http://localhost:3000`.
5. Enter `idInstance` and `apiTokenInstance` on the connection screen. The app validates them via `GetSettings`. Use “Сменить инстанс” in the sidebar to clear the session and connect another instance.

The app checks receiving settings and shows a warning if incoming notifications are disabled or a webhook URL is set. One receiver runs while the app is connected, including on the new-chat screen. Incoming text messages remain in memory across chat navigation. Chat history is reloaded after a page refresh.

Enter a Russian phone number in international format to create a chat. The app calls `CheckAccount` to get the MAX chat ID, `SendMessage` to send text, and `ReceiveNotification` plus `DeleteNotification` to show replies. The latest 50 text messages are loaded from `GetChatHistory` when a chat opens.

The app needs a server runtime for its server functions. Deploy the full TanStack Start output, not just the generated static shell. Do not put instance credentials in `VITE_` variables. Use HTTPS in production because credentials are sent to the server. sessionStorage is accessible to JavaScript on this origin. All chat screens require instance credentials. Server functions validate credentials and scope upstream requests and cached reads to that instance. The app does not provide a separate user registration system.

## Structure

- `src/routes`: TanStack file-based route declarations, without Next.js or App Router.
- `src/components`: feature folders `Layout`, `NewChat`, and `Chat`, with conversation logic beside its components.
- `src/contexts` and `src/hooks`: chat context and reusable hooks.
- `src/services`: GREEN-API server functions.
- `src/lib`: server-only GREEN-API request helpers and display utilities.
- `src/constants` and `src/types`: reusable values and project types.

Public modules use folder barrels and `@/` imports. Server-only helpers are imported directly. UI uses Mantine's default dark theme and components without custom UI wrappers or Tailwind.

## Vercel

The Nitro Vite plugin builds the TanStack Start server functions for Vercel. Import the repository with framework preset **TanStack Start**, use Node.js 24, and set `GREEN_API_URL` in the project environment variables. Leave the build command and output directory at their framework defaults. Do not add instance IDs or tokens to Vercel environment variables; each visitor enters their own credentials on the connection screen.

The full deployment includes server functions. A static-only deployment cannot send or receive messages. Build locally with `pnpm build`; verify the Vercel output with `NITRO_PRESET=vercel pnpm build`. See [Vercel hosting instructions](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel).
