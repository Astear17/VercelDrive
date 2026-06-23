# VercelDrive

[English](README.md) | [Tiếng Việt](README.vi-VN.md)

A self-hosted OneDrive file browser built with Next.js and TypeScript. Browse, preview, sort, filter, download, and upload files from your OneDrive through a clean web interface. Designed for one-click deployment on Vercel.

**Demo**: [2drv.vercel.app](https://2drv.vercel.app)

![VercelDrive demo](./public/demo.png)

## Overview

VercelDrive connects to a Microsoft OneDrive account via the Microsoft Graph API and exposes a configured folder through a web interface. It runs entirely on Vercel's serverless infrastructure — no separate server is needed.

The application supports browsing folders and files in both grid and list views, with sorting by name, date, or size. Folders are always listed before files. A type filter lets you narrow the view to specific file types or extensions present in the current directory.

Files can be previewed directly in the browser. Supported formats include images, video, audio, PDFs, Office documents, EPUBs, Markdown, code, and plain text. For Markdown and code files, a Preview/Raw tab lets you switch between the rendered view and the original source text.

Downloads preserve the original filename and extension, including Unicode and Vietnamese characters. Multiple files can be selected and downloaded as a ZIP archive. Folder downloads are packaged recursively.

When upload mode is enabled, authorized users can upload files and folders directly from the browser, including drag-and-drop and large file uploads via chunked Microsoft Graph upload sessions.

## Features

### Browsing

- Grid view (masonry gallery) and list view
- Breadcrumb navigation
- Full-text search across OneDrive (Ctrl+K / Cmd+K)
- Automatic README.md rendering at the bottom of folder listings
- Pagination with automatic crawling and manual "Load more" for large folders

### Preview

- Images (JPEG, PNG, GIF, WebP, HEIC)
- Video with subtitle support (MP4, MKV, WebM, FLV, MOV, M3U8)
- Audio with native controls (MP3, M4A, FLAC, OGG, WAV, OPUS)
- PDF documents
- Office documents (Word, PowerPoint, Excel via Office Online viewer)
- EPUB books
- Markdown with rendered preview and Raw source tab
- Code files with syntax highlighting and Raw source tab
- Plain text, subtitles (SRT, VTT), logs, diffs
- URL shortcut files

### Sorting and Filtering

- Sort by name (A–Z / Z–A), size, or date
- Folders always appear before files
- Filter by type: All, Folders, Files, specific extensions, or files with no extension
- Type filter options are generated from the current directory contents

### Downloading

- Single file download with original filename and extension preserved
- Multi-file selection and batch download as ZIP
- Recursive folder download as ZIP
- Copy direct permalink to clipboard
- Customisable direct links with file extension support

### Upload (optional)

- Single file, multi-file, and folder upload
- Drag-and-drop support
- Chunked upload sessions for large files via Microsoft Graph
- Per-file progress, retry, and cancellation
- Folder uploads preserve directory structure
- Server-side password gate for all upload and delete actions

### Interface

- Dark Windows 11 / Nilesoft-inspired design
- Geist Sans for general UI text
- Geist Mono for code, raw text, and terminal-style content
- Responsive layout
- Multi-language UI: English, German, Spanish, Hindi, Indonesian, Turkish, Vietnamese

### Security

- OAuth tokens stored in Redis (Upstash), never exposed to the browser
- Password-protected folders with client-side SHA-256 hashing
- HMAC-signed, HttpOnly cookies for upload/delete authorisation
- Short-lived signed URLs for secure file access (15-minute expiry)
- Per-IP rate limiting on auth endpoints
- Protected content is never cached

## Screenshots

<!-- Replace placeholders with actual screenshots when available -->

| Home (Grid) | Home (List) |
|---|---|
| ![Grid view](./public/screenshots/home-grid.png) | ![List view](./public/screenshots/home-list.png) |

| File Preview | Raw View |
|---|---|
| ![File preview](./public/screenshots/file-preview.png) | ![Raw view](./public/screenshots/raw-view.png) |

> The screenshot paths above are placeholders. The main demo image is shown above.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 13](https://nextjs.org/) (Pages Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| API | Microsoft Graph API |
| Storage | [Upstash Redis](https://upstash.com/) (for OAuth tokens) |
| Icons | [Font Awesome](https://fontawesome.com/) |
| Hosting | [Vercel](https://vercel.com/) |
| Package Manager | pnpm 8 |

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **pnpm** 8 (the project uses `pnpm@8.15.9` via `packageManager` field)
- A **Microsoft account** with OneDrive
- An **Azure App Registration** (see below)
- A **Vercel account** (for deployment) or a local Redis instance (for development)

### Azure App Registration

1. Go to [Azure Portal > App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Set the redirect URI to `http://localhost`
4. Add delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`
5. Create a client secret
6. Note the **Application (client) ID** and **client secret value**

> For read-only deployments, `Files.Read.All` is sufficient instead of `Files.ReadWrite.All`.

### Installation

```bash
git clone https://github.com/Astear17/VercelDrive.git
cd VercelDrive
pnpm install
```

If your global pnpm version does not match the lockfile:

```bash
npx pnpm@8 install --frozen-lockfile
```

### Environment Variables

#### Required

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SITE_TITLE` | Site title shown in the browser tab and UI | `My Drive` |
| `USER_PRINCIPAL_NAME` | Microsoft account email | `user@outlook.com` |
| `BASE_DIRECTORY` | OneDrive folder to expose | `/` or `/Documents` |
| `CLIENT_ID` | Azure App Registration client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CLIENT_SECRET` | Azure client secret (AES-encrypted by the app's OAuth wizard) | See [Client Secret Encryption](#client-secret-encryption) |
| `REDIS_URL` | Redis connection string | `redis://default:xxx@host:port` |

#### Upload mode

| Variable | Description | Default |
|---|---|---|
| `UPLOAD_PASSWORD` | Server-side password required for all upload and delete actions | *(uploads disabled without it)* |
| `UPLOAD_CONFLICT_BEHAVIOR` | What to do when a file with the same name exists | `rename` |

Supported values for `UPLOAD_CONFLICT_BEHAVIOR`: `rename`, `replace`, `fail`

#### Optional

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Comma-separated folder paths requiring a password | *(none)* |
| `NEXT_PUBLIC_EMAIL` | Contact email shown in the header | *(none)* |
| `KV_PREFIX` | Redis key prefix for shared databases | *(none)* |

> **Security**: Never prefix secrets (`CLIENT_SECRET`, `UPLOAD_PASSWORD`, `REDIS_URL`) with `NEXT_PUBLIC_`. Variables with that prefix are exposed in the browser.

### Client Secret Encryption

The `CLIENT_SECRET` environment variable must be AES-encrypted using the app's built-in obfuscation key. The OAuth setup wizard handles this automatically — paste your raw client secret when prompted, and the app will encrypt and store it.

### Development

```bash
pnpm dev
```

This starts the Next.js development server at `http://localhost:3000`.

### Build

```bash
pnpm build
```

Or with a pinned pnpm version:

```bash
npx pnpm@8 build
```

### Deployment

#### Deploy to Vercel

Click one of the buttons below to deploy. You will be prompted for environment variables during setup.

**Read-only (browse, preview, download):**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Read-only with protected routes:**

[![Deploy with protected routes](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,NEXT_PUBLIC_PROTECTED_ROUTES&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Read/write with uploads:**

[![Deploy with uploads](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Full deployment (uploads + protected routes + contact email):**

[![Deploy full](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD,NEXT_PUBLIC_PROTECTED_ROUTES,NEXT_PUBLIC_EMAIL&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

#### Connect Redis

After the first deploy:

1. Go to your Vercel project dashboard
2. Navigate to **Storage** and connect an Upstash Redis database (or any Redis provider)
3. The `REDIS_URL` variable will be injected automatically
4. **Redeploy** the project

#### Authenticate

1. Open your deployed site
2. The OAuth setup wizard will appear
3. Follow the 3-step process to authorise your Microsoft account
4. Tokens are stored in Redis and the site begins working

## Usage

1. **Browse**: Open the site to see the root OneDrive folder. Navigate folders by clicking them.
2. **Switch views**: Use the view switcher in the top-right to toggle between Grid and List layouts.
3. **Sort**: Use the sort dropdown to order items by name, size, or date. Folders always appear before files.
4. **Filter**: Use the type filter to show all items, only folders, only files, or specific file extensions present in the current directory.
5. **Search**: Press Ctrl+K (Cmd+K on Mac) to open the search modal and search across your OneDrive.
6. **Preview**: Click a file to open its preview. Images, video, audio, PDFs, Office documents, EPUBs, Markdown, code, and text files are supported.
7. **Raw view**: For Markdown and code files, click the **Raw** tab to see the original source text. Click **Preview** to return to the rendered view.
8. **Download**: Click the Download button in the file preview to download a single file. Select multiple files in a folder and download them as a ZIP.
9. **Upload** (if enabled): Click the upload button in a folder view, enter the upload password, and select files or folders to upload.

## Raw / Plain View

For Markdown and code files, the file viewer includes **Preview** and **Raw** tabs.

- **Preview** (default): Renders Markdown with full formatting (headings, lists, code blocks, images, math). Code files are shown with syntax highlighting.
- **Raw**: Displays the original source text as plain text in a monospace font. This is useful for copying content or inspecting the raw file structure.

Raw view is only available for safe text-based file types (Markdown, code, config, text, subtitles, logs, etc.). It is not available for binary files such as images, video, audio, PDFs, or archives.

Raw content is always displayed as text — HTML, JavaScript, and SVG files are shown as source code, never executed or rendered as active content.

## Download Filename Handling

Downloads preserve the original filename and extension from OneDrive. This includes:

- Vietnamese and other Unicode filenames (using RFC 5987 `filename*` encoding)
- Files with spaces, multiple dots, or special characters
- The correct file extension is always retained

The download response uses `Content-Disposition: attachment` with both an ASCII-safe fallback filename and a UTF-8 encoded filename for modern browsers.

## Project Structure

```
├── config/
│   ├── api.config.js        # Microsoft Graph API endpoints and settings
│   └── site.config.js       # Site title, icons, fonts, footer, links
├── public/
│   ├── fonts/               # Geist Sans and Geist Mono font files
│   ├── locales/             # i18n translation files (7 languages)
│   └── ...
├── src/
│   ├── components/
│   │   ├── previews/        # File preview components (image, video, audio, PDF, code, markdown, etc.)
│   │   ├── FileListing.tsx   # Main file listing with sorting, filtering, and preview routing
│   │   ├── FolderControls.tsx # Sort and type filter controls
│   │   ├── Navbar.tsx        # Navigation bar with search, language switch, and links
│   │   ├── UploadPanel.tsx   # Upload UI with drag-drop and progress tracking
│   │   └── ...
│   ├── pages/
│   │   ├── api/             # API routes (file listing, raw download, search, upload, delete, etc.)
│   │   ├── verceldrive-oauth/ # OAuth setup wizard (3 steps)
│   │   └── [...path].tsx    # Dynamic file/folder route
│   ├── styles/
│   │   └── globals.css      # Global styles, font faces, masonry grid
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utilities (auth, fetching, file icons, sorting, etc.)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

## Known Limitations

- OneDrive API limits folder listings to 200 items per page. Pagination is handled automatically, but very large folders may require multiple loads.
- Rate limiting is in-memory per serverless instance. It resets on cold start and is not distributed across instances.
- Folder upload requires a Chromium-based browser for `webkitdirectory` API support.
- The legacy `odpt` query parameter for raw file links is deprecated but still supported for backward compatibility. Use signed URLs for new integrations.

## Credits

VercelDrive is based on the archived [spencerwooo/onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index) project (snapshot from June 2023), with significant modifications for Vercel deployment, server-side token storage, upload support, and security hardening.

The interface design draws inspiration from Windows 11 and [Nilesoft Shell](https://nilesoft.org/) aesthetics.

## License

[MIT](LICENSE)

© 2021–2023 [spencer woo](https://spencerwoo.com) · © 2023 [iRedScarf](https://github.com/iRedScarf) · © 2026 [Astear17](https://github.com/Astear17)
