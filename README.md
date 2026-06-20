# VercelDrive

[English](README.md) | [Tieng Viet](README.vi-VN.md)

A self-hosted OneDrive file browser built with Next.js and TypeScript, designed for one-click deployment on Vercel. Browse, preview, share, download, and optionally upload files from your OneDrive — no server required.

**Demo**: [2drv.vercel.app](https://2drv.vercel.app)

![demo](./public/demo.png)

## Features

- Browse and search files in your OneDrive directory
- Preview images, videos, audio, PDFs, Office documents, Markdown, code, and EPUBs
- Generate direct download and permalink links
- Password-protect specific folders with `.password` files
- Upload files and folders directly from the browser (optional)
- Large file uploads via Microsoft Graph upload sessions
- Drag-and-drop upload support
- iPhone Live Photo uploads (HEIC/HEIF + MOV)
- Multi-language UI (English, German, Spanish, Hindi, Indonesian, Turkish, Vietnamese)
- Dark mode support

## Quick Start

### 1. Create a Microsoft Entra App Registration

1. Go to [Azure Portal > App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Set the redirect URI to `http://localhost`
4. Add delegated permissions: `User.Read`, `Files.Read.All`, `offline_access`
5. Create a client secret
6. Note the **Application (client) ID** and **client secret value**

> For upload support, use `Files.ReadWrite.All` instead of `Files.Read.All`.

### 2. Deploy to Vercel

Click one of the buttons below. You will be prompted for environment variables during setup.

#### Read-only

Browse, preview, share, and download files. No upload capability.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Required variables**: `NEXT_PUBLIC_SITE_TITLE`, `USER_PRINCIPAL_NAME`, `BASE_DIRECTORY`, `CLIENT_ID`, `CLIENT_SECRET`

#### Read-only with protected routes

Same as above, but certain folders require a password to access.

[![Deploy with protected routes](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,NEXT_PUBLIC_PROTECTED_ROUTES&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Required variables**: all of the above + `NEXT_PUBLIC_PROTECTED_ROUTES`

#### Read/write with uploads

Authorized users can upload files and folders from the browser.

[![Deploy with uploads](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Required variables**: all read-only variables + `UPLOAD_PASSWORD`

#### Full deployment (uploads + protected routes + contact email)

All features enabled.

[![Deploy full](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD,NEXT_PUBLIC_PROTECTED_ROUTES,NEXT_PUBLIC_EMAIL&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Required variables**: all read-only variables + `UPLOAD_PASSWORD`, `NEXT_PUBLIC_PROTECTED_ROUTES`, `NEXT_PUBLIC_EMAIL`

### 3. Connect Redis

After the first deploy:

1. Go to your Vercel project dashboard
2. Navigate to **Storage** and connect an Upstash Redis database (or any Redis provider)
3. The `REDIS_URL` variable will be injected automatically
4. **Redeploy** your project

### 4. Authenticate

1. Open your deployed site
2. You will see the OAuth setup wizard
3. Follow the 3-step process to authorize your Microsoft account
4. The site will store tokens in Redis and begin working

## Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SITE_TITLE` | Site title shown in the browser tab and UI | `My Drive` |
| `USER_PRINCIPAL_NAME` | Microsoft account email | `user@outlook.com` |
| `BASE_DIRECTORY` | OneDrive folder to expose | `/` or `/Public` |
| `CLIENT_ID` | Azure App Registration client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CLIENT_SECRET` | Azure client secret (AES-encrypted by the app) | See [encryption note](#client-secret-encryption) |
| `REDIS_URL` | Redis connection string | `redis://default:xxx@host:port` |

### Upload mode

| Variable | Description | Default |
|---|---|---|
| `UPLOAD_PASSWORD` | Server-side password gate for all upload actions | *(none — uploads disabled without it)* |
| `UPLOAD_CONFLICT_BEHAVIOR` | What to do when a file with the same name exists | `rename` |

Supported values: `rename`, `replace`, `fail`

### Optional

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Comma-separated folder paths requiring password | *(none)* |
| `NEXT_PUBLIC_EMAIL` | Contact email shown in the header | *(none)* |
| `KV_PREFIX` | Redis key prefix for shared databases | *(none)* |

> **Security**: Do not prefix secrets (`CLIENT_SECRET`, `UPLOAD_PASSWORD`, `REDIS_URL`) with `NEXT_PUBLIC_`. Variables with that prefix are exposed in the browser.

## Client Secret Encryption

The `CLIENT_SECRET` environment variable must be AES-encrypted using the app's built-in obfuscation key. The OAuth setup wizard handles this automatically — paste your raw client secret when prompted, and the app will encrypt and store it.

## Uploads

When `UPLOAD_PASSWORD` is set and the Azure app has `Files.ReadWrite.All` permission:

- An upload button appears in folder views
- Users enter the upload password once per session
- Supports single file, multi-file, and folder uploads
- Drag and drop where browser APIs allow
- Per-file progress, retry, and cancellation
- Large files use chunked Microsoft Graph upload sessions
- Folder uploads preserve directory structure

## Migrating from Read-only to Read/Write

1. Update the Azure App permission from `Files.Read.All` to `Files.ReadWrite.All`
2. Grant admin consent if required by your tenant
3. Add `UPLOAD_PASSWORD` to Vercel environment variables
4. Clear stored OAuth tokens: call `POST /api/upload/reset-auth-tokens` or delete Redis keys `<KV_PREFIX>access_token` and `<KV_PREFIX>refresh_token`
5. Redeploy and re-authenticate

## Troubleshooting

| Problem | Solution |
|---|---|
| Upload says permission denied | Confirm `Files.ReadWrite.All` is granted, clear Redis tokens, re-authenticate |
| Site still behaves as read-only | Delete Redis keys `access_token` and `refresh_token` (include `KV_PREFIX` if set) |
| Folder upload unavailable | Use a Chromium-based browser for `webkitdirectory` support |
| Large upload failed | Retry on a stable connection; upload sessions can expire |
| Local build shows Redis warnings | Set `REDIS_URL` locally or ignore when only validating the build |

## Security

- Upload authorization is enforced server-side on every API request
- Use a strong `UPLOAD_PASSWORD` and restrict deployment access
- Never expose secrets via `NEXT_PUBLIC_` prefixed variables
- Tokens stored in Redis are AES-encrypted

## Development

```bash
pnpm install
pnpm build
```

If your global pnpm version is too new for the lockfile:

```bash
npx pnpm@8 install --frozen-lockfile
npx pnpm@8 build
```

## Documentation

Full documentation: [2drv-docs.vercel.app](https://2drv-docs.vercel.app)

## License

[MIT](LICENSE)

© 2021-2023 [spencer woo](https://spencerwoo.com) · © 2023 [iRedScarf](https://github.com/iRedScarf) · © 2026 [Astear17](https://github.com/Astear17)
