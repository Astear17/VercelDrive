# VercelDrive

English | [Tieng Viet](README.vi-VN.md)

VercelDrive is a Next.js and TypeScript OneDrive directory listing app for Vercel. It lets you browse, preview, share, download, and optionally upload files from a configured OneDrive directory.

This repository is maintained by [Astear17](https://github.com/Astear17) and builds on the archived VercelDrive codebase with changes for one-click Vercel deployment, server-side environment variables, Redis token storage, and upload support.

## Features

- Public OneDrive folder browsing
- File preview, sharing, and direct download links
- Optional protected routes with `.password` files
- Optional file and folder uploads to the current folder
- Drag-and-drop upload where supported by the browser
- Large-file uploads through Microsoft Graph upload sessions
- Raw iPhone Live Photo component uploads, including HEIC/HEIF and MOV files
- Server-side upload password gate with short-lived upload authorization

## Demo

- Production: [2drv.vercel.app](https://2drv.vercel.app)

![demo](./public/demo.png)

## Setup Mode

Choose the permission model before creating your Microsoft Entra App Registration and deploying to Vercel.

| Mode | Best for | Microsoft Graph delegated permissions | Upload variables |
| --- | --- | --- | --- |
| Read-only | Public browsing, previews, sharing, and downloads only | `User.Read`, `Files.Read.All`, `offline_access` | Do not set `UPLOAD_PASSWORD` |
| Read/write | Browsing plus browser uploads and folder creation | `User.Read`, `Files.ReadWrite.All`, `offline_access` | Set `UPLOAD_PASSWORD`; optionally set `UPLOAD_CONFLICT_BEHAVIOR` |

If you start with read-only and later enable uploads, update the app permission to `Files.ReadWrite.All`, clear the old Redis/KV OAuth tokens, redeploy, and authenticate again. Existing tokens keep their old scope until they are replaced.

## Deploy To Vercel

Prepare these values before deploying:

- `NEXT_PUBLIC_SITE_TITLE`
- `USER_PRINCIPAL_NAME`
- `BASE_DIRECTORY`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `REDIS_URL` after connecting Redis
- `UPLOAD_PASSWORD` only when using read/write mode

### Read-only deployment

Use this when you only want visitors to browse, preview, share, and download files.

[![Deploy read-only with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

### Read/write deployment with uploads

Use this when you want authorized users to upload files or folders from the browser.

[![Deploy with uploads on Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

### Optional deployment variants

- Add `NEXT_PUBLIC_PROTECTED_ROUTES` if some folders require password access.
- Add `KV_PREFIX` if multiple deployments share the same Redis database.
- Add `NEXT_PUBLIC_EMAIL` if you want a contact link in the header.
- Add `UPLOAD_CONFLICT_BEHAVIOR` in read/write mode to control duplicate upload names. Supported values are `rename`, `replace`, and `fail`.

After the first deploy, connect Redis. Upstash Redis is a common choice on Vercel because the integration can inject `REDIS_URL` automatically. Redeploy after `REDIS_URL` is available, then open the site and complete the OAuth flow.

## Environment Variables

### Required

| Name | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_TITLE` | Site title shown in the UI. This value is public in the browser bundle. | `2Drive` |
| `USER_PRINCIPAL_NAME` | OneDrive account to access. | `example@outlook.com` |
| `BASE_DIRECTORY` | Root OneDrive directory exposed by the site. | `/` or `/Public Drive` |
| `CLIENT_ID` | Microsoft Entra App Registration client ID. | Azure application ID |
| `CLIENT_SECRET` | AES-obfuscated Azure client secret used by this project. | See documentation |
| `REDIS_URL` | Redis connection string for OAuth token storage. | Upstash Redis URL |

### Required only for read/write uploads

| Name | Description | Example |
| --- | --- | --- |
| `UPLOAD_PASSWORD` | Server-only password required before any upload action starts. | A strong private value |

### Optional

| Name | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Comma-separated protected folder paths. | `/private,/family` |
| `NEXT_PUBLIC_EMAIL` | Contact email shown in the header. | `admin@example.com` |
| `KV_PREFIX` | Redis key prefix for shared Redis databases. | `drive1_` |
| `UPLOAD_CONFLICT_BEHAVIOR` | OneDrive conflict behavior for uploaded files. | `rename`, `replace`, or `fail` |

Do not prefix `USER_PRINCIPAL_NAME`, `BASE_DIRECTORY`, `CLIENT_ID`, `CLIENT_SECRET`, `REDIS_URL`, `UPLOAD_PASSWORD`, Redis values, or Microsoft tokens with `NEXT_PUBLIC_`. Values with that prefix are included in the browser bundle.

## Uploads

Uploads require read/write mode, `Files.ReadWrite.All`, and `UPLOAD_PASSWORD`.

The upload button appears in folder views. After entering the upload password, users can:

- Select one or more files
- Select a whole folder with browsers that support `webkitdirectory`
- Drag and drop files or folders where directory drop APIs are available
- See per-file progress, total progress, success/failure state, retry actions, and active upload cancellation

Files are uploaded to the OneDrive folder currently open in the browser. Folder uploads preserve the relative folder tree. The app accepts every file type and does not filter by extension.

Large files use Microsoft Graph upload sessions. The server creates the session using the stored Microsoft access token, then the browser uploads chunks directly to the short-lived Graph upload URL. This keeps Microsoft access tokens server-side and avoids buffering full files in Vercel functions.

## iPhone Live Photos

iPhone Live Photos are usually exported as paired media files, commonly a HEIC or HEIF image plus a MOV video. VercelDrive does not convert, compress, rename, or strip metadata from selected files.

To preserve a Live Photo, upload both original components together. The safest option is to select the exported folder from iCloud, Photos, or the iPhone file export so the HEIC/HEIF and MOV files are uploaded with their original names and relative paths.

## Existing Deployment Migration

Existing read-only deployments will not automatically receive write permission. Choose one migration path.

### Option A: Update The Current Azure App

1. Open Azure Portal.
2. Open the existing App Registration.
3. Add delegated Microsoft Graph permission `Files.ReadWrite.All`.
4. Keep `User.Read` and `offline_access`.
5. Grant admin consent if your tenant requires it.
6. Regenerate the client secret if needed.
7. Update Vercel environment variables if the secret changed.
8. Add `UPLOAD_PASSWORD` and optionally `UPLOAD_CONFLICT_BEHAVIOR`.
9. Clear the old Redis/KV OAuth keys: `<KV_PREFIX>access_token` and `<KV_PREFIX>refresh_token`.
10. Redeploy and authenticate again.

An upload-authorized admin can also call `POST /api/upload/reset-auth-tokens` to clear stored OAuth tokens.

### Option B: Create A New Azure App

1. Create a new Azure App Registration.
2. Add the redirect URI used by the VercelDrive OAuth flow.
3. Add delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`.
4. Create a new client secret.
5. Update Vercel variables: `CLIENT_ID`, `CLIENT_SECRET`, `USER_PRINCIPAL_NAME`, `BASE_DIRECTORY`, `REDIS_URL` if needed, and `UPLOAD_PASSWORD`.
6. Redeploy and authenticate again.

## Troubleshooting

- Upload says permission denied: confirm `Files.ReadWrite.All` is configured, consent is granted if needed, old Redis tokens were cleared, and OAuth was completed again.
- The site still behaves as read-only: delete the Redis/KV `access_token` and `refresh_token` keys, including `KV_PREFIX` when configured.
- Folder upload is unavailable: use a Chromium-based browser for folder picker support. Other browsers may support only file selection.
- A Live Photo uploaded as only an image: select both the HEIC/HEIF image and MOV video, or upload the full export folder.
- Large upload failed: retry from a stable connection. Upload sessions can expire, and Microsoft Graph can throttle long-running uploads.
- Local build shows Redis connection warnings: configure `REDIS_URL` locally or ignore the warnings when only validating the static build.

## Security Notes

Enabling upload makes the site write-capable. Use a strong `UPLOAD_PASSWORD`, restrict deployment access where possible, and do not expose secrets through `NEXT_PUBLIC_` environment variables.

Upload authorization is checked server-side on every upload API request. The browser UI is not the security boundary.

## Development

Install dependencies and build with the package manager used by the lockfile:

```bash
pnpm install
pnpm build
```

If your global pnpm is too new for the lockfile, use pnpm 8:

```bash
npx pnpm@8 install --frozen-lockfile
npx pnpm@8 build
```

## Documentation

Project documentation is available at [2drv-docs.vercel.app](https://2drv-docs.vercel.app).

## License

[MIT License](LICENSE)

© 2021-2023 [spencer woo](https://spencerwoo.com)

© 2023 [iRedScarf](https://github.com/iRedScarf)

© 2026 [Astear17](https://github.com/Astear17)
