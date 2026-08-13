# VercelDrive

A self-hosted OneDrive file browser. Browse, preview, share, and download files from your OneDrive through a clean web interface — built with Next.js and designed to deploy on Vercel.

**Demo**: [2drv.vercel.app](https://2drv.vercel.app)

![VercelDrive demo](./public/demo.png)

## What it does

- Browse OneDrive folders in grid or list view
- Preview images, video, audio, PDFs, Office docs, EPUBs, Markdown, code, and plain text
- Sort by name, size, or date (folders always come first)
- Filter by file type or extension
- Search across your OneDrive with Ctrl+K
- Download files with the original filename preserved
- Select multiple files and download as a ZIP
- Upload files and folders from the browser (optional, password-protected)
- Password-protect specific folders
- Multi-language UI (English, Vietnamese, German, Spanish, Hindi, Indonesian, Turkish)
- Dark mode

## Deploy to Vercel

### 1. Create an Azure App Registration

Go to [Azure Portal > App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) and register a new application.

- Set the redirect URI to `http://localhost`
- Add delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`
- Create a client secret and note the **Application (client) ID** and **secret value**

> If you only need read-only access, `Files.Read.All` works instead of `Files.ReadWrite.All`.

### 2. Click a deploy button

Pick the setup that fits your needs. You will be prompted for environment variables during setup.

**Read-only (browse, preview, download):**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Read-only with protected folders:**

[![Deploy with protected routes](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,NEXT_PUBLIC_PROTECTED_ROUTES&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Read/write with uploads:**

[![Deploy with uploads](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Everything (uploads + protected folders + contact email):**

[![Deploy full](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD,NEXT_PUBLIC_PROTECTED_ROUTES,NEXT_PUBLIC_EMAIL&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

### 3. Connect Redis

After the first deploy, go to your Vercel project dashboard, open **Storage**, and connect an Upstash Redis database. The `REDIS_URL` variable will be injected automatically. Then **redeploy**.

### 4. Open the site and authenticate

Open your deployed URL. You will see a 3-step OAuth wizard — follow it to authorise your Microsoft account. Once done, the site will start showing your files.

## Environment Variables

### Required

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SITE_TITLE` | Site title in the browser tab and navbar | `My Drive` |
| `USER_PRINCIPAL_NAME` | Your Microsoft account email | `user@outlook.com` |
| `BASE_DIRECTORY` | Which OneDrive folder to show. `/` means the root. | `/` or `/Documents` |
| `CLIENT_ID` | Azure App Registration client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CLIENT_SECRET` | Azure client secret. The OAuth wizard encrypts this for you automatically. | *(paste raw value in wizard)* |
| `REDIS_URL` | Redis connection string. Auto-injected by Upstash after connecting. | `redis://default:xxx@host:port` |

### Optional

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Comma-separated folder paths that require a password. Each folder needs a `.password` file inside it on OneDrive. | *(none)* |
| `NEXT_PUBLIC_EMAIL` | Contact email shown in the navbar | *(none)* |
| `UPLOAD_PASSWORD` | Password required for all upload and delete actions. Uploads are disabled if this is not set. | *(none)* |
| `UPLOAD_CONFLICT_BEHAVIOR` | What to do when uploading a file that already exists: `rename`, `replace`, or `fail` | `rename` |
| `KV_PREFIX` | Redis key prefix, useful when multiple deployments share one Redis instance | *(none)* |

> **Important**: Never prefix secrets (`CLIENT_SECRET`, `UPLOAD_PASSWORD`, `REDIS_URL`) with `NEXT_PUBLIC_`. Variables with that prefix are exposed in the browser.

## First-time setup

After deploying and connecting Redis, open your site. You should see a setup wizard that walks you through authorising your Microsoft account in three steps:

1. The site shows you a link to get an authorisation code from Microsoft.
2. You paste the code back into the site.
3. The site exchanges the code for access and refresh tokens and stores them in Redis.

Once this is done, the site will display your OneDrive files. Tokens are refreshed automatically — you should not need to redo this unless you clear Redis or change the `CLIENT_SECRET`.

## Troubleshooting

**Site shows a blank page or errors after deploy**
Make sure all required environment variables are set, then redeploy. Missing `CLIENT_ID` or `CLIENT_SECRET` is the most common cause.

**Changed environment variables but nothing happened**
You need to redeploy after changing environment variables. Vercel does not pick up changes until the next build.

**OAuth wizard does not appear**
Check that `REDIS_URL` is set and working. The wizard requires a valid Redis connection to store tokens.

**Files do not show up**
Verify that `BASE_DIRECTORY` matches an actual folder path in your OneDrive. `/` shows the root. Make sure `USER_PRINCIPAL_NAME` is the correct Microsoft account email.

**Upload says permission denied**
Ensure your Azure App has `Files.ReadWrite.All` permission (not just `Files.Read.All`). After changing permissions, clear the stored tokens in Redis and re-authenticate.

**Folder upload not working in the browser**
Folder upload requires a Chromium-based browser for the `webkitdirectory` API.

## Credits

Based on [spencerwooo/onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index), with modifications for Vercel deployment, server-side token storage, uploads, and security improvements.

## License

[MIT](LICENSE)

<div align="center">
  <p><strong>Preview self-hosted over Vercel with FreeDNS subdomain</strong></p>
  <p>
    <img src="https://raw.githubusercontent.com/Astear17/VercelDrive/refs/heads/main/public/images/branding.png" />
  </p>
</div>
