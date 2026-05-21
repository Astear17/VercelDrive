# VercelDrive (One-Click Deploy Version)

This project is a clone from [spencerwooo/VercelDrive](https://github.com/spencerwooo/VercelDrive), based on the archived version from the original author dated June 24, 2023. It includes some minor modifications that allow you to deploy it on Vercel for free, showcasing, sharing, previewing, downloading, and uploading your OneDrive files on a webpage. For specific deployment methods, please refer to the instructions below.

## Modifications

- Some variables that needed to be set in the `api.config.js` and `site.config.js` configuration files in the `config/` are now set in the environment variables of Vercel. In this way, you can directly click the one-click deployment button in this document, enter the values of the environment variables during the deployment process, and then complete the deployment.

> In this version, some sensitive variables are set using environment variables with prefixes other than `NEXT_PUBLIC_`. This is done to prevent casual website visitors from easily obtaining your OneDrive account, ClientID, and ClientSecret information.

- Additionally, this version is set to automatically close the OAuth authentication channel after OAuth authentication is completed. This is to prevent malicious individuals from easily obtaining user configuration information through the OAuth authentication URL link.
- Latest commit for this is fixing src/components/previews/VideoPreview.tsx to giving an error which push up to `pnpm install exited with exitcode 1`. I have fixed this at [15c685c](https://github.com/Astear17/VercelDrive/commit/15c685c06ff223d58e8d5f7eebf61a74fccde8e6) and removing every single `\` form the code, which cause up 404 on HTML even if the server did response normally.

## Demo

The [Production](https://2drv.vercel.app) of this One-Click Deploy version. | The [Demo](https://drive.swo.moe) (UNMAINTAINED) by the original author.

![demo](./public/demo.png)

## Getting Started

### Preparations

1. **Setting up the API permissions for your OneDrive account.**

- This project retrieves the file list and download links by calling OneDrive's API, so setting up the API permissions for your OneDrive account is essential. Please refer to the [docs about seting up the API](https://ovi.swo.moe/docs/advanced#register-a-new-application).

> The three API permissions that need to be set up are: `User.Read`, `Files.ReadWrite.All`, `offline_access`.

> Current upload-enabled deployments require delegated Microsoft Graph permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`. Update any older read-only file permission to `Files.ReadWrite.All`, then re-authenticate the site.

2. **Prepare the five [necessary environmental variables (click to view)](#necessary-variables) to be filled in during deployment on Vercel.**

### Deploying to Vercel

3. **Once you're prepared, you can click the button below to deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

> - If you have folders that need password protection.
>
> [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,NEXT_PUBLIC_PROTECTED_ROUTES,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install) with `NEXT_PUBLIC_PROTECTED_ROUTES`
>
> - If you have multiple OneDrive accounts that need to use the same Redis database.
>
> [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,KV_PREFIX&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install) with `KV_PREFIX`
>
> - If you need to deploy multiple OneDrive-Index, and all have folders that need password protection.
>
> [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,NEXT_PUBLIC_PROTECTED_ROUTES,CLIENT_ID,CLIENT_SECRET,KV_PREFIX&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install) with `NEXT_PUBLIC_PROTECTED_ROUTES` & `KV_PREFIX`

4. **After the initial successful deployment, the deployed page will return a 404 error because we still need to connect to the Redis database.**

> `REDIS_URL`:If you are encountering Redis database for the first time, I strongly recommend using Upstash, which is free and deeply integrated with Vercel. For details, refer to [Vercel Integration](https://docs.upstash.com/redis/howto/vercelintegration). Follow the instructions to set it up in Vercel's [Upstash Integration](https://vercel.com/integrations/upstash)(simply create a new database in the `Redis` of Upstash, then create a new integration in `Vercel Integrations`, and associate the just deployed OneDrive-Index project with the Redis database), it will automatically fill in the environment variables after project deployment.

5. **After `REDIS_URL` is successfully set, redeploy the project again.**

6. **After successful deployment, when you visit your `VercelDrive` page for the first time, it will guide you to perform OAuth authentication (quite simple). For details, please refer to the [Instructions](https://ovi.swo.moe/zh/docs/getting-started#authentication) written by the original author.**

## Environment Variables

### Necessary Variables

| Name                     | Description                                                   | Original Path           | Note                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_TITLE` | Title of the display page                                     | `config/site.config.js` | e.g. 2Drive                                                                                                                                                                                                                                                                                                                                    |
| `USER_PRINCIPAL_NAME`    | Your OneDrive account                                         | `config/site.config.js` | `example@outlook.com`                                                                                                                                                                                                                                                                                                                          |
| `BASE_DIRECTORY`         | The OneDrive directory you want to share                      | `config/site.config.js` | `/directory name`, root directory is `/`                                                                                                                                                                                                                                                                                                       |
| `CLIENT_ID`              | The client ID of the app you registered in Microsoft Azure    | `config/api.config.js`  | The one provided by the original author has expired, it is recommended to register one yourself, the validity period can be set to two years (anyway, you have to set the API permissions of the account, by the way). The acquisition method refers to the [DOCS](https://ovi.swo.moe/docs/advanced#using-your-own-clientid-and-clientsecret) |
| `CLIENT_SECRET`          | The client secret of the app registered in Microsoft Azure    | `config/api.config.js`  | The acquisition method is the same, especially note that this **needs to encrypt the original secret with AES** (can be done in the [DOCS](https://ovi.swo.moe/docs/advanced#modify-configs-in-apiconfigjs))                                                                                                                                   |
| `UPLOAD_PASSWORD`        | Server-only password required before upload actions can start | -                       | Do not use `NEXT_PUBLIC_`; use a long private password                                                                                                                                                                                                                                                                                         |

### Optional Variables

| Name                           | Description                                       | Original Path           | Note                                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_PROTECTED_ROUTES` | The path of the folder that needs password access | `config/site.config.js` | Format: `/route1,/route2`, multiple paths are separated by `,`                                                                                                                                     |
| `NEXT_PUBLIC_EMAIL`            | Contact Email displayed in the upper right corner | `config/site.config.js` | `example@example.com`                                                                                                                                                                              |
| `KV_PREFIX`                    | Prefix for KV storage (key-value pair storage)    | `config/site.config.js` | Upstash only provides a free `Redis` database, if you want to deploy multiple OneDrive-Index, you can set different `KV_PREFIX` values for different Index, so there will be no key value conflict |
| `UPLOAD_CONFLICT_BEHAVIOR`     | OneDrive upload conflict behavior                 | -                       | `rename` (default), `replace`, or `fail`                                                                                                                                                           |

## Uploads

Authenticated upload users can click **Upload** in any folder view to upload files into the current OneDrive path. The upload panel supports normal file selection, Chromium-style folder selection with `webkitdirectory`, and drag-and-drop files/folders where the browser exposes directory entries. Folder uploads preserve the relative folder tree.

Large files use Microsoft Graph upload sessions. The browser uploads chunks directly to the short-lived Graph upload URL created by the server, so Vercel does not load entire large files into memory and Microsoft access tokens stay server-side.

Any file type is accepted. iPhone Live Photos are not converted or filtered: upload both the original HEIC/HEIF image and MOV video components from your iPhone/iCloud/Photos export, preferably by selecting the containing folder. The app sends the raw files as selected and preserves file names, extensions, folder structure, and last-modified timestamps where Microsoft Graph accepts them.

Uploads are write-capable. Use a strong `UPLOAD_PASSWORD`, keep deployments private/admin-only where possible, and remember that the existing public browsing behavior remains public unless protected routes are configured.

## Existing Deployment Migration

Existing deployed VercelDrive sites have read-only OAuth tokens. After enabling uploads, old tokens must be invalidated and the site must complete OAuth again with the new write scope.

Option A: reconfigure the current Azure App Registration.

1. Open Azure Portal and select the existing App Registration.
2. Add delegated Microsoft Graph permission `Files.ReadWrite.All`.
3. Keep `User.Read` and `offline_access`.
4. Grant/admin-consent if your tenant requires it.
5. Regenerate the client secret if needed, then update `CLIENT_SECRET` in Vercel if it changes.
6. Add `UPLOAD_PASSWORD` and optionally `UPLOAD_CONFLICT_BEHAVIOR`.
7. Clear old Redis/KV OAuth keys so the app forces fresh OAuth. Delete `<KV_PREFIX>access_token` and `<KV_PREFIX>refresh_token` from Redis, or authenticate as an upload user and POST `/api/upload/reset-auth-tokens`.
8. Redeploy and re-authenticate when the site opens.

Option B: create a new Azure App Registration.

1. Add the redirect URI used by the current VercelDrive OAuth callback.
2. Add delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`.
3. Create a new client secret.
4. Update Vercel environment variables: `CLIENT_ID`, `CLIENT_SECRET`, `USER_PRINCIPAL_NAME`, `BASE_DIRECTORY`, `REDIS_URL` if needed, and `UPLOAD_PASSWORD`.
5. Redeploy and re-authenticate when the site opens.

## Upload Troubleshooting

- **Upload says permission denied:** confirm the Azure app has `Files.ReadWrite.All`, consent was granted if required, and the site has re-authenticated after the permission change.
- **Old deployment still has read-only token:** delete the Redis/KV `access_token` and `refresh_token` keys, including `KV_PREFIX` if configured, then OAuth again.
- **Folder upload not available:** use a Chromium-based browser for the folder picker. Other browsers may still support file uploads but not recursive folder selection.
- **Live Photo uploaded as only image:** select both original files from the export, usually `.HEIC`/`.HEIF` plus `.MOV`, or select the whole export folder.
- **Large upload failed on Vercel:** retry from a stable connection. The app uses Graph upload sessions, but the session URL can expire and Graph may throttle very large or long-running uploads.

## Documentation

**For more usage methods, please refer to the [DOCS](https://ovi.swo.moe/docs/getting-started) written by the original author.**

## Security Risks

- In the archived version of the original author, the `userPrincipalName`, `clientId`, and `obfuscatedClientSecret` of the OneDrive account of the deployer are exposed in the source code of the web page.

> This version checks whether authentication has already been passed when performing the OAuth authentication process. If it has, it redirects to the homepage, otherwise, it proceeds with the OAuth authentication process. It attempts to prevent individuals with malicious intent from obtaining the values of `clientId` and `obfuscatedClientSecret` through the link address of OAuth authentication.

- Because of the design decision of Next.js, environment variables starting with `NEXT_PUBLIC_` are not only available on the server side, but also on the client side (browser). This means that any environment variable starting with `NEXT_PUBLIC_` will be included in the built JavaScript file and will be sent to the user's browser. Therefore, anyone visiting your website can view the values of these environment variables by viewing the source code of the website or network requests.

> This version uses non-`NEXT_PUBLIC_` prefixed environment variables for the `userPrincipalName`, `clientId`, `obfuscatedClientSecret`, and `baseDirectory` variables, making it as difficult as possible for website visitors to easily obtain your OneDrive account, ClientID, and ClientSecret information.

## Todo List

- Put the password in the environment variables instead of the `.password` file.

> However, in this way, it is more difficult to set different access passwords for different encrypted directories.

- Redesign the LOGO. The contrast of the original LOGO is too low, and it is not consistent enough with the style of other icons and fonts on the page.

## License

[MIT License](LICENSE)

© 2021-2023 [spencer woo](https://spencerwoo.com)

© 2023 [iRedScarf](https://github.com/iRedScarf)

© 2026 [Astear17](https://github.com/Astear17)

<div align="center">
    Made by <a href="https://spencerwoo.com">spencer woo</a> | Modified by <a href="https://github.com/Astear17">Astear17
</div>
