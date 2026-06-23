# VercelDrive

[English](README.md) | [Tiếng Việt](README.vi-VN.md)

Ứng dụng duyệt tệp OneDrive tự lưu trữ, xây dựng bằng Next.js và TypeScript. Duyệt, xem trước, sắp xếp, lọc, tải xuống và tải lên tệp từ OneDrive qua giao diện web. Thiết kế để triển khai một-click trên Vercel.

**Demo**: [2drv.vercel.app](https://2drv.vercel.app)

![VercelDrive demo](./public/demo.png)

## Tổng Quan

VercelDrive kết nối với tài khoản Microsoft OneDrive qua Microsoft Graph API và hiển thị thư mục đã cấu hình qua giao diện web. Ứng dụng chạy hoàn toàn trên hạ tầng serverless của Vercel — không cần máy chủ riêng.

Ứng dụng hỗ trợ duyệt thư mục và tệp ở cả hai chế độ lưới và danh sách, với khả năng sắp xếp theo tên, ngày hoặc kích thước. Thư mục luôn hiển thị trước tệp. Bộ lọc loại cho phép thu hẹp phạm vi hiển thị theo loại tệp hoặc phần mở rộng có trong thư mục hiện tại.

Tệp có thể được xem trước trực tiếp trên trình duyệt. Các định dạng được hỗ trợ bao gồm hình ảnh, video, âm thanh, PDF, tài liệu Office, EPUB, Markdown, mã nguồn và văn bản thuần. Với tệp Markdown và mã nguồn, tab Xem trước/Gốc cho phép chuyển đổi giữa chế độ hiển thị đã định dạng và nội dung gốc.

Tải xuống giữ nguyên tên tệp và phần mở rộng gốc, bao gồm ký tự Unicode và tiếng Việt. Nhiều tệp có thể được chọn và tải xuống dưới dạng tệp ZIP. Tải thư mục được đóng gói đệ quy.

Khi bật chế độ tải lên, người dùng được ủy quyền có thể tải tệp và thư mục lên trực tiếp từ trình duyệt, bao gồm kéo-thả và tải tệp lớn qua Microsoft Graph upload session phân đoạn.

## Tính Năng

### Duyệt thư mục

- Chế độ lưới (gallery) và danh sách
- Điều hướng breadcrumb
- Tìm kiếm toàn văn bản qua OneDrive (Ctrl+K / Cmd+K)
- Tự động hiển thị README.md ở cuối danh sách thư mục
- Phân trang tự động và nút "Tải thêm" cho thư mục lớn

### Xem trước

- Hình ảnh (JPEG, PNG, GIF, WebP, HEIC)
- Video với phụ đề (MP4, MKV, WebM, FLV, MOV, M3U8)
- Âm thanh với điều khiển gốc (MP3, M4A, FLAC, OGG, WAV, OPUS)
- Tài liệu PDF
- Tài liệu Office (Word, PowerPoint, Excel qua Office Online viewer)
- Sách EPUB
- Markdown với xem trước đã render và tab Gốc
- Tệp mã nguồn với tô sáng cú pháp và tab Gốc
- Văn bản thuần, phụ đề (SRT, VTT), nhật ký, diff
- Tệp lối tắt URL

### Sắp xếp và Lọc

- Sắp xếp theo tên (A–Z / Z–A), kích thước hoặc ngày
- Thư mục luôn hiển thị trước tệp
- Lọc theo loại: Tất cả, Thư mục, Tệp, phần mở rộng cụ thể, hoặc tệp không có phần mở rộng
- Tùy chọn bộ lọc được tạo từ nội dung thư mục hiện tại

### Tải xuống

- Tải tệp đơn với tên và phần mở rộng gốc
- Chọn nhiều tệp và tải xuống hàng loạt dưới dạng ZIP
- Tải thư mục đệ quy dưới dạng ZIP
- Sao chép liên kết trực tiếp vào clipboard
- Tùy chỉnh liên kết trực tiếp với hỗ trợ phần mở rộng

### Tải lên (tùy chọn)

- Tải lên tệp đơn, nhiều tệp và thư mục
- Hỗ trợ kéo-thả
- Upload session phân đoạn cho tệp lớn qua Microsoft Graph
- Theo dõi tiến trình, thử lại và hủy từng tệp
- Tải thư mục giữ nguyên cấu trúc thư mục con
- Kiểm soát bằng mật khẩu phía server cho mọi thao tác tải lên và xóa

### Giao diện

- Thiết kế tối phong cách Windows 11 / Nilesoft
- Geist Sans cho văn bản giao diện
- Geist Mono cho mã nguồn, văn bản thô và nội dung kiểu terminal
- Bố cục responsive
- Đa ngôn ngữ: English, Deutsch, Español, हिन्दी, Indonesia, Türkçe, Tiếng Việt

### Bảo mật

- OAuth token lưu trong Redis (Upstash), không bao giờ lộ ra trình duyệt
- Thư mục được bảo vệ bằng mật khẩu với băm SHA-256 phía client
- Cookie HMAC-signed, HttpOnly cho phân quyền tải lên/xóa
- Liên kết ký thời hạn ngắn (15 phút)
- Giới hạn tần suất theo IP cho các điểm cuối xác thực
- Nội dung được bảo vệ không bao giờ được lưu cache

## Ảnh Chụp Màn Hình

<!-- Thay thế bằng ảnh chụp thực tế khi có -->

| Trang chủ (Lưới) | Trang chủ (Danh sách) |
|---|---|
| ![Chế độ lưới](./public/screenshots/home-grid.png) | ![Chế độ danh sách](./public/screenshots/home-list.png) |

| Xem trước tệp | Xem Raw |
|---|---|
| ![Xem trước](./public/screenshots/file-preview.png) | ![Xem Raw](./public/screenshots/raw-view.png) |

> Các đường dẫn ảnh trên là placeholder. Ảnh demo chính hiển thị ở trên.

## Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|---|---|
| Framework | [Next.js 13](https://nextjs.org/) (Pages Router) |
| Ngôn ngữ | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| API | Microsoft Graph API |
| Lưu trữ | [Upstash Redis](https://upstash.com/) (lưu OAuth token) |
| Icon | [Font Awesome](https://fontawesome.com/) |
| Hosting | [Vercel](https://vercel.com/) |
| Package Manager | pnpm 8 |

## Bắt Đầu

### Yêu cầu

- **Node.js** 18 trở lên
- **pnpm** 8 (dự án dùng `pnpm@8.15.9` qua trường `packageManager`)
- **Tài khoản Microsoft** có OneDrive
- **Azure App Registration** (xem bên dưới)
- **Tài khoản Vercel** (triển khai) hoặc Redis local (phát triển)

### Đăng ký Azure App

1. Vào [Azure Portal > App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Đăng ký ứng dụng mới
3. Đặt redirect URI là `http://localhost`
4. Thêm delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`
5. Tạo client secret
6. Ghi lại **Application (client) ID** và **giá trị client secret**

> Với triển khai chỉ đọc, `Files.Read.All` là đủ thay vì `Files.ReadWrite.All`.

### Cài đặt

```bash
git clone https://github.com/Astear17/VercelDrive.git
cd VercelDrive
pnpm install
```

Nếu phiên bản pnpm global không khớp với lockfile:

```bash
npx pnpm@8 install --frozen-lockfile
```

### Biến Môi Trường

#### Bắt buộc

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_SITE_TITLE` | Tiêu đề trang hiển thị trên tab trình duyệt và giao diện | `My Drive` |
| `USER_PRINCIPAL_NAME` | Email tài khoản Microsoft | `user@outlook.com` |
| `BASE_DIRECTORY` | Thư mục OneDrive cần hiển thị | `/` hoặc `/Documents` |
| `CLIENT_ID` | Client ID của Azure App Registration | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CLIENT_SECRET` | Client secret Azure (được mã hóa AES bởi wizard OAuth) | Xem [Mã hóa Client Secret](#mã-hóa-client-secret) |
| `REDIS_URL` | Chuỗi kết nối Redis | `redis://default:xxx@host:port` |

#### Chế độ tải lên

| Biến | Mô tả | Mặc định |
|---|---|---|
| `UPLOAD_PASSWORD` | Mật khẩu phía server bắt buộc cho mọi thao tác tải lên và xóa | *(tắt tải lên nếu không đặt)* |
| `UPLOAD_CONFLICT_BEHAVIOR` | Xử lý khi tệp tải lên trùng tên | `rename` |

Giá trị hỗ trợ cho `UPLOAD_CONFLICT_BEHAVIOR`: `rename`, `replace`, `fail`

#### Tùy chọn

| Biến | Mô tả | Mặc định |
|---|---|---|
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Danh sách đường dẫn thư mục cần mật khẩu, phân tách bằng dấu phẩy | *(không có)* |
| `NEXT_PUBLIC_EMAIL` | Email liên hệ hiển thị trên header | *(không có)* |
| `KV_PREFIX` | Tiền tố Redis key khi dùng chung cơ sở dữ liệu | *(không có)* |

> **Bảo mật**: Không bao giờ đặt tiền tố `NEXT_PUBLIC_` cho các biến bí mật (`CLIENT_SECRET`, `UPLOAD_PASSWORD`, `REDIS_URL`). Biến có tiền tố này sẽ bị lộ ra trình duyệt.

### Mã hóa Client Secret

Biến môi trường `CLIENT_SECRET` phải được mã hóa AES bằng khóa obfuscation có sẵn trong ứng dụng. Wizard OAuth sẽ tự động xử lý — dán client secret gốc khi được yêu cầu, ứng dụng sẽ mã hóa và lưu trữ.

### Chạy Local

```bash
pnpm dev
```

Khởi động server phát triển Next.js tại `http://localhost:3000`.

### Build

```bash
pnpm build
```

Hoặc với phiên bản pnpm cố định:

```bash
npx pnpm@8 build
```

### Triển Khai

#### Triển khai lên Vercel

Nhấn nút bên dưới để triển khai. Bạn sẽ được yêu cầu nhập biến môi trường trong quá trình thiết lập.

**Chỉ đọc (duyệt, xem trước, tải xuống):**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Chỉ đọc với thư mục được bảo vệ:**

[![Deploy with protected routes](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,NEXT_PUBLIC_PROTECTED_ROUTES&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Đọc/ghi với tải lên:**

[![Deploy with uploads](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

**Triển khai đầy đủ (tải lên + thư mục bảo vệ + email liên hệ):**

[![Deploy full](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD,NEXT_PUBLIC_PROTECTED_ROUTES,NEXT_PUBLIC_EMAIL&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

#### Kết nối Redis

Sau lần triển khai đầu tiên:

1. Vào bảng điều khiển dự án Vercel
2. Vào **Storage** và kết nối cơ sở dữ liệu Upstash Redis (hoặc nhà cung cấp Redis khác)
3. Biến `REDIS_URL` sẽ được tự động thêm
4. **Triển khai lại** dự án

#### Xác thực

1. Mở trang web đã triển khai
2. Wizard OAuth sẽ xuất hiện
3. Làm theo quy trình 3 bước để ủy quyền tài khoản Microsoft
4. Token được lưu trong Redis và trang web bắt đầu hoạt động

## Cách Sử Dụng

1. **Duyệt**: Mở trang web để xem thư mục gốc OneDrive. Nhấn vào thư mục để mở.
2. **Chuyển chế độ xem**: Dùng nút chuyển ở góc trên bên phải để đổi giữa Lưới và Danh sách.
3. **Sắp xếp**: Dùng menu thả xuống để sắp xếp theo tên, kích thước hoặc ngày. Thư mục luôn hiển thị trước tệp.
4. **Lọc**: Dùng bộ lọc loại để hiển thị tất cả, chỉ thư mục, chỉ tệp, hoặc phần mở rộng cụ thể trong thư mục hiện tại.
5. **Tìm kiếm**: Nhấn Ctrl+K (Cmd+K trên Mac) để mở hộp tìm kiếm và tìm qua toàn bộ OneDrive.
6. **Xem trước**: Nhấn vào tệp để mở xem trước. Hỗ trợ hình ảnh, video, âm thanh, PDF, Office, EPUB, Markdown, mã nguồn và văn bản.
7. **Xem Gốc**: Với tệp Markdown và mã nguồn, nhấn tab **Gốc** để xem văn bản nguồn. Nhấn **Xem trước** để quay lại chế độ đã render.
8. **Tải xuống**: Nhấn nút Tải xuống trong màn hình xem trước để tải tệp. Chọn nhiều tệp trong thư mục và tải xuống dưới dạng ZIP.
9. **Tải lên** (nếu bật): Nhấn nút tải lên trong chế độ xem thư mục, nhập mật khẩu, chọn tệp hoặc thư mục để tải lên.

## Xem Raw / Plain

Với tệp Markdown và mã nguồn, trình xem tệp có tab **Xem trước** và **Gốc**.

- **Xem trước** (mặc định): Markdown được render đầy đủ (tiêu đề, danh sách, khối mã, hình ảnh, công thức). Tệp mã nguồn hiển thị với tô sáng cú pháp.
- **Gốc**: Hiển thị văn bản nguồn dưới dạng văn bản thuần với font monospace. Hữu ích khi sao chép nội dung hoặc kiểm tra cấu trúc tệp gốc.

Chế độ Gốc chỉ khả dụng cho các loại tệp văn bản an toàn (Markdown, mã nguồn, cấu hình, văn bản, phụ đề, nhật ký, v.v.). Không khả dụng cho tệp nhị phân như hình ảnh, video, âm thanh, PDF hoặc tệp nén.

Nội dung Gốc luôn hiển thị dưới dạng văn bản — tệp HTML, JavaScript và SVG được hiển thị dưới dạng mã nguồn, không bao giờ được thực thi hoặc render thành nội dung động.

## Xử Lý Tên File Khi Tải Xuống

Tải xuống giữ nguyên tên tệp và phần mở rộng gốc từ OneDrive, bao gồm:

- Tên tệp tiếng Việt và Unicode (sử dụng mã hóa RFC 5987 `filename*`)
- Tệp có khoảng trắng, nhiều dấu chấm hoặc ký tự đặc biệt
- Phần mở rộng tệp luôn được giữ nguyên

Phản hồi tải xuống sử dụng `Content-Disposition: attachment` với cả tên tệp ASCII an toàn và tên tệp UTF-8 cho trình duyệt hiện đại.

## Cấu Trúc Dự Án

```
├── config/
│   ├── api.config.js        # Điểm cuối Microsoft Graph API và cài đặt
│   └── site.config.js       # Tiêu đề, icon, font, footer, liên kết
├── public/
│   ├── fonts/               # Tệp font Geist Sans và Geist Mono
│   ├── locales/             # Tệp dịch i18n (7 ngôn ngữ)
│   └── ...
├── src/
│   ├── components/
│   │   ├── previews/        # Thành phần xem trước (ảnh, video, audio, PDF, mã, markdown, v.v.)
│   │   ├── FileListing.tsx   # Danh sách tệp chính với sắp xếp, lọc và định tuyến xem trước
│   │   ├── FolderControls.tsx # Điều khiển sắp xếp và bộ lọc loại
│   │   ├── Navbar.tsx        # Thanh điều hướng với tìm kiếm, chuyển ngôn ngữ và liên kết
│   │   ├── UploadPanel.tsx   # Giao diện tải lên với kéo-thả và theo dõi tiến trình
│   │   └── ...
│   ├── pages/
│   │   ├── api/             # Đường dẫn API (danh sách tệp, tải xuống, tìm kiếm, tải lên, xóa, v.v.)
│   │   ├── verceldrive-oauth/ # Wizard thiết lập OAuth (3 bước)
│   │   └── [...path].tsx    # Đường dẫn động cho tệp/thư mục
│   ├── styles/
│   │   └── globals.css      # Style toàn cục, khai báo font, lưới masonry
│   ├── types/               # Định nghĩa kiểu TypeScript
│   └── utils/               # Tiện ích (xác thực, fetch, icon tệp, sắp xếp, v.v.)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

## Giới Hạn Hiện Tại

- Microsoft Graph API giới hạn 200 mục mỗi trang danh sách thư mục. Phân trang được xử lý tự động, nhưng thư mục rất lớn có thể cần tải nhiều lần.
- Giới hạn tần suất hoạt động trong bộ nhớ trên mỗi instance serverless. Dữ liệu đặt lại khi cold start và không được chia sẻ giữa các instance.
- Tải thư mục yêu cầu trình duyệt Chromium để hỗ trợ API `webkitdirectory`.
- Tham số truy vấn `odpt` cũ cho liên kết tệp thô đã ngừng sử dụng nhưng vẫn được hỗ trợ để tương thích ngược. Nên dùng signed URL cho tích hợp mới.

## Ghi Công

VercelDrive dựa trên dự án [spencerwooo/onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index) đã lưu trữ (snapshot tháng 6/2023), với các sửa đổi đáng kể để triển khai trên Vercel, lưu token phía server, hỗ trợ tải lên và tăng cường bảo mật.

Thiết kế giao diện lấy cảm hứng từ Windows 11 và [Nilesoft Shell](https://nilesoft.org/).

## Giấy Phép

[MIT](LICENSE)

© 2021–2023 [spencer woo](https://spencerwoo.com) · © 2023 [iRedScarf](https://github.com/iRedScarf) · © 2026 [Astear17](https://github.com/Astear17)
