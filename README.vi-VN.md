# VercelDrive

[English](README.md) | Tiếng Việt

VercelDrive là ứng dụng liệt kê thư mục OneDrive dùng Next.js và TypeScript, có thể triển khai trên Vercel. Ứng dụng hỗ trợ duyệt thư mục, xem trước, chia sẻ, tải xuống và tải lên tệp trong thư mục OneDrive đã cấu hình.

Kho mã này dựa trên dự án `spencerwooo/VercelDrive` đã lưu trữ ngày 24/06/2023, kèm các thay đổi để triển khai một-click trên Vercel, dùng biến môi trường phía server, lưu OAuth token trong Redis và hỗ trợ tải lên.

## Tính năng

- Duyệt thư mục OneDrive công khai
- Xem trước, chia sẻ và tải tệp trực tiếp
- Bảo vệ một số thư mục bằng file `.password`
- Tải tệp và thư mục lên đúng thư mục đang mở
- Kéo-thả để tải lên nếu trình duyệt hỗ trợ
- Tải tệp lớn bằng Microsoft Graph upload session
- Tải nguyên bản thành phần iPhone Live Photo, gồm HEIC/HEIF và MOV
- Chặn thao tác tải lên bằng mật khẩu phía server và quyền tải lên ngắn hạn

## Demo

- Bản production: [2drv.vercel.app](https://2drv.vercel.app)
- Demo gốc, không còn duy trì: [drive.swo.moe](https://drive.swo.moe)

![demo](https://github.com/Astear17/VercelDrive/raw/main/public/demo.png)

## Quyền Microsoft Graph

Azure App Registration cần các delegated Microsoft Graph permissions sau:

- `User.Read`
- `Files.ReadWrite.All`
- `offline_access`

Các deployment cũ dùng quyền chỉ đọc phải chuyển sang `Files.ReadWrite.All`. Sau khi đổi quyền, hãy xóa OAuth token cũ trong Redis/KV và xác thực lại để ứng dụng nhận token mới có quyền ghi.

## Triển Khai Lên Vercel

Chuẩn bị các biến sau trước khi triển khai:

- `NEXT_PUBLIC_SITE_TITLE`
- `USER_PRINCIPAL_NAME`
- `BASE_DIRECTORY`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `UPLOAD_PASSWORD`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstear17%2FVercelDrive&env=NEXT_PUBLIC_SITE_TITLE,USER_PRINCIPAL_NAME,BASE_DIRECTORY,CLIENT_ID,CLIENT_SECRET,UPLOAD_PASSWORD&buildCommand=pnpm+build&framework=nextjs&installCommand=pnpm+install)

Các biến tùy chọn:

- Thêm `NEXT_PUBLIC_PROTECTED_ROUTES` nếu có thư mục cần mật khẩu.
- Thêm `KV_PREFIX` nếu nhiều deployment dùng chung một Redis.
- Thêm cả hai biến nếu nhiều deployment cùng dùng protected folders.

Sau lần deploy đầu tiên, hãy kết nối Redis. Upstash Redis thường phù hợp với Vercel vì integration có thể tự thêm `REDIS_URL`. Sau khi có `REDIS_URL`, redeploy rồi mở site để hoàn tất OAuth.

## Biến Môi Trường

### Bắt buộc

| Tên                      | Mô tả                                                    | Ví dụ                      |
| ------------------------ | -------------------------------------------------------- | -------------------------- |
| `NEXT_PUBLIC_SITE_TITLE` | Tiêu đề hiển thị trên giao diện                          | `2Drive`                   |
| `USER_PRINCIPAL_NAME`    | Tài khoản OneDrive cần truy cập                          | `example@outlook.com`      |
| `BASE_DIRECTORY`         | Thư mục OneDrive gốc được công khai qua site             | `/` hoặc `/Public Drive`   |
| `CLIENT_ID`              | Client ID của Azure App Registration                     | Azure application ID       |
| `CLIENT_SECRET`          | Client secret Azure đã được AES-obfuscate theo dự án này | Xem tài liệu gốc           |
| `REDIS_URL`              | Chuỗi kết nối Redis để lưu OAuth token                   | Upstash Redis URL          |
| `UPLOAD_PASSWORD`        | Mật khẩu phía server bắt buộc trước mọi thao tác tải lên | Một giá trị mạnh, riêng tư |

### Tùy chọn

| Tên                            | Mô tả                                                   | Ví dụ                            |
| ------------------------------ | ------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Danh sách thư mục cần mật khẩu, phân tách bằng dấu phẩy | `/private,/family`               |
| `NEXT_PUBLIC_EMAIL`            | Email liên hệ hiển thị trên header                      | `admin@example.com`              |
| `KV_PREFIX`                    | Tiền tố Redis key khi dùng chung Redis                  | `drive1_`                        |
| `UPLOAD_CONFLICT_BEHAVIOR`     | Cách xử lý khi tệp tải lên bị trùng tên                 | `rename`, `replace`, hoặc `fail` |

Không đặt `UPLOAD_PASSWORD`, `CLIENT_SECRET`, Redis URL hay Microsoft token với tiền tố `NEXT_PUBLIC_`. Biến có tiền tố này sẽ được đóng gói vào mã JavaScript gửi xuống trình duyệt.

## Tải Lên

Nút upload xuất hiện trong giao diện thư mục. Sau khi nhập mật khẩu tải lên, người dùng có thể:

- Chọn một hoặc nhiều tệp
- Chọn cả thư mục trên trình duyệt hỗ trợ `webkitdirectory`
- Kéo-thả tệp hoặc thư mục nếu trình duyệt hỗ trợ directory drop API
- Theo dõi tiến trình từng tệp, tiến trình tổng, trạng thái thành công/thất bại, thử lại và hủy upload đang chạy

Tệp được tải lên đúng thư mục OneDrive đang mở trên trình duyệt. Khi tải cả thư mục, cấu trúc thư mục con được giữ nguyên. Ứng dụng chấp nhận mọi loại tệp và không lọc theo phần mở rộng.

Tệp lớn dùng Microsoft Graph upload session. Server tạo upload session bằng access token Microsoft đang lưu, sau đó trình duyệt tải từng chunk trực tiếp lên Graph upload URL ngắn hạn. Cách này giữ access token ở server và tránh việc Vercel Function phải giữ toàn bộ tệp trong bộ nhớ.

## iPhone Live Photos

iPhone Live Photos thường được export thành một cặp tệp, phổ biến là ảnh HEIC/HEIF và video MOV. VercelDrive không chuyển đổi, nén, đổi tên hay xóa metadata khỏi tệp đã chọn.

Để giữ đúng Live Photo, hãy tải lên cả hai thành phần gốc cùng nhau. Cách an toàn nhất là chọn cả thư mục export từ iCloud, Photos hoặc iPhone Files để HEIC/HEIF và MOV được tải lên với tên gốc và đường dẫn tương đối ban đầu.

## Nâng Cấp Deployment Cũ

Các deployment hiện có sẽ không tự nhận quyền ghi mới. Chọn một trong hai cách sau.

### Cách A: Cập Nhật Azure App Hiện Tại

1. Mở Azure Portal.
2. Mở App Registration đang dùng.
3. Thêm delegated Microsoft Graph permission `Files.ReadWrite.All`.
4. Giữ `User.Read` và `offline_access`.
5. Grant admin consent nếu tenant yêu cầu.
6. Tạo lại client secret nếu cần.
7. Cập nhật biến môi trường trên Vercel nếu secret thay đổi.
8. Thêm `UPLOAD_PASSWORD` và tùy chọn `UPLOAD_CONFLICT_BEHAVIOR`.
9. Xóa OAuth key cũ trong Redis/KV: `<KV_PREFIX>access_token` và `<KV_PREFIX>refresh_token`.
10. Redeploy và xác thực OAuth lại.

Admin đã mở khóa quyền upload cũng có thể gọi `POST /api/upload/reset-auth-tokens` để xóa OAuth token đang lưu.

### Cách B: Tạo Azure App Mới

1. Tạo Azure App Registration mới.
2. Thêm redirect URI đang dùng trong OAuth flow của VercelDrive.
3. Thêm delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`.
4. Tạo client secret mới.
5. Cập nhật biến môi trường Vercel: `CLIENT_ID`, `CLIENT_SECRET`, `USER_PRINCIPAL_NAME`, `BASE_DIRECTORY`, `REDIS_URL` nếu cần, và `UPLOAD_PASSWORD`.
6. Redeploy và xác thực OAuth lại.

## Xử Lý Lỗi

- **Upload báo permission denied:** kiểm tra `Files.ReadWrite.All`, consent nếu cần, xóa Redis token cũ và OAuth lại.
- **Site vẫn chỉ đọc:** xóa Redis/KV key `access_token` và `refresh_token`, có tính cả `KV_PREFIX` nếu đang dùng.
- **Không chọn được thư mục:** dùng trình duyệt Chromium để có folder picker. Trình duyệt khác có thể chỉ chọn được tệp.
- **Live Photo chỉ lên ảnh:** chọn cả ảnh HEIC/HEIF và video MOV, hoặc tải lên cả thư mục export.
- **Tệp lớn upload thất bại:** thử lại với mạng ổn định. Upload session có thể hết hạn và Microsoft Graph có thể throttle upload kéo dài.
- **Build local báo lỗi kết nối Redis:** cấu hình `REDIS_URL` local hoặc bỏ qua cảnh báo nếu chỉ kiểm tra static build.

## Ghi Chú Bảo Mật

Bật upload nghĩa là site có quyền ghi vào OneDrive. Hãy dùng `UPLOAD_PASSWORD` mạnh, hạn chế người truy cập deployment nếu có thể, và không đưa secret vào biến `NEXT_PUBLIC_`.

Quyền upload được kiểm tra ở server trong mọi API upload. Việc ẩn nút trên giao diện không phải là lớp bảo mật chính.

## Phát Triển

Cài dependency và build bằng package manager phù hợp với lockfile:

```bash
pnpm install
pnpm build
```

Nếu pnpm global quá mới so với lockfile, dùng pnpm 8:

```bash
npx pnpm@8 install --frozen-lockfile
npx pnpm@8 build
```

## Tài Liệu Gốc

Tài liệu dự án gốc có tại [ovi.swo.moe/docs/getting-started](https://ovi.swo.moe/docs/getting-started).

## Giấy Phép

[MIT License](LICENSE)

© 2021-2023 [spencer woo](https://spencerwoo.com)

© 2023 [iRedScarf](https://github.com/iRedScarf)

© 2026 [Astear17](https://github.com/Astear17)
