# VercelDrive

Dự án này là bản sao từ [spencerwooo/onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index), dựa trên phiên bản đã được lưu trữ bởi tác giả gốc vào ngày 24/06/2023. Nó bao gồm một số chỉnh sửa nhỏ cho phép bạn triển khai miễn phí trên Vercel, dùng để trình chiếu, chia sẻ, xem trước, tải xuống và tải lên các tệp OneDrive của bạn trên một trang web. Để biết phương pháp triển khai cụ thể, vui lòng xem hướng dẫn bên dưới.

## Các chỉnh sửa

- Một số biến trước đây cần được thiết lập trong các tệp cấu hình `api.config.js` và `site.config.js` trong thư mục `config/` nay được chuyển sang thiết lập trong biến môi trường của Vercel. Nhờ đó, bạn có thể nhấn nút triển khai một-click trong tài liệu này, nhập các giá trị biến môi trường trong quá trình triển khai và hoàn tất triển khai.
  > Trong phiên bản này, một số biến nhạy cảm được đặt bằng các biến môi trường không có tiền tố `NEXT_PUBLIC_`. Điều này nhằm tránh việc người truy cập trang web có thể dễ dàng lấy được tài khoản OneDrive, ClientID và ClientSecret của bạn.
- Phiên bản này cũng tự động đóng kênh xác thực OAuth sau khi hoàn tất xác thực, nhằm ngăn chặn việc kẻ xấu lấy thông tin cấu hình thông qua URL xác thực OAuth.
- Commit mới nhất sửa lỗi trong `src/components/previews/VideoPreview.tsx` gây ra lỗi `pnpm install exited with exitcode 1`. Tôi đã sửa tại commit [15c685c](https://github.com/Astear17/onedrive-vercel-index/commit/15c685c06ff223d58e8d5f7eebf61a74fccde8e6) và loại bỏ mọi ký tự `\` gây lỗi 404 trên HTML dù server phản hồi bình thường.

## Demo

- Bản Production của phiên bản One-Click Deploy: https://2drv.vercel.app
- Bản Demo (KHÔNG DUY TRÌ) của tác giả gốc: https://drive.swo.moe
  ![demo](https://github.com/Astear17/VercelDrive/raw/main/public/demo.png)

## Bắt đầu

### Chuẩn bị

1. **Thiết lập quyền API cho tài khoản OneDrive của bạn.**
   Dự án này lấy danh sách tệp và liên kết tải xuống bằng cách gọi API của OneDrive, vì vậy việc thiết lập quyền API là bắt buộc. Vui lòng xem hướng dẫn tại:  
   https://ovi.swo.moe/docs/advanced#register-a-new-application
   Ba quyền API cần thiết:

   - `User.Read`
   - `Files.ReadWrite.All`
   - `offline_access`

   Các bản triển khai cũ dùng quyền tệp chỉ đọc phải đổi sang `Files.ReadWrite.All` và xác thực OAuth lại.

2. **Chuẩn bị năm biến môi trường cần thiết (nhấn để xem) để điền vào khi triển khai trên Vercel.**

### Triển khai lên Vercel

1. **Khi đã chuẩn bị xong, bạn có thể nhấn nút dưới đây để triển khai:**

   (Nút triển khai Vercel – giữ nguyên như bản gốc)

- Nếu bạn có thư mục cần bảo vệ bằng mật khẩu → dùng `NEXT_PUBLIC_PROTECTED_ROUTES`
- Nếu bạn có nhiều tài khoản OneDrive dùng chung một Redis → dùng `KV_PREFIX`
- Nếu bạn triển khai nhiều OneDrive-Index và tất cả đều có thư mục cần bảo vệ → dùng cả `NEXT_PUBLIC_PROTECTED_ROUTES` & `KV_PREFIX`

2. **Sau khi triển khai lần đầu, trang sẽ báo lỗi 404 vì bạn chưa kết nối Redis.**

   `REDIS_URL`: Nếu bạn mới dùng Redis lần đầu, nên dùng Upstash vì miễn phí và tích hợp sâu với Vercel.  
   Hướng dẫn: https://docs.upstash.com/redis/howto/vercelintegration  
   Sau khi tạo database Redis và tích hợp với Vercel, biến môi trường sẽ được tự động thêm vào.

3. **Sau khi thiết lập `REDIS_URL`, hãy triển khai lại dự án.**

4. **Khi truy cập trang lần đầu, bạn sẽ được hướng dẫn thực hiện xác thực OAuth.**  
   Xem hướng dẫn của tác giả gốc: https://ovi.swo.moe/zh/docs/getting-started#authentication

## Biến môi trường

### Biến bắt buộc

| Tên                      | Mô tả                                    | Đường dẫn gốc           | Ghi chú                                                             |
| ------------------------ | ---------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_TITLE` | Tiêu đề trang                            | `config/site.config.js` | Ví dụ: 2Drive                                                       |
| `USER_PRINCIPAL_NAME`    | Tài khoản OneDrive                       | `config/site.config.js` | `example@outlook.com`                                               |
| `BASE_DIRECTORY`         | Thư mục OneDrive muốn chia sẻ            | `config/site.config.js` | `/tên thư mục`, thư mục gốc là `/`                                  |
| `CLIENT_ID`              | Client ID của ứng dụng Azure             | `config/api.config.js`  | Nên tự đăng ký, hạn dùng 2 năm                                      |
| `CLIENT_SECRET`          | Client Secret của ứng dụng Azure         | `config/api.config.js`  | Cần mã hóa AES theo hướng dẫn                                       |
| `UPLOAD_PASSWORD`        | Mật khẩu phía server để cho phép tải lên | -                       | Không dùng tiền tố `NEXT_PUBLIC_`; nên đặt mật khẩu dài và riêng tư |

### Biến tùy chọn

| Tên                            | Mô tả                                  | Đường dẫn gốc           | Ghi chú                                     |
| ------------------------------ | -------------------------------------- | ----------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Đường dẫn thư mục cần mật khẩu         | `config/site.config.js` | `/route1,/route2`                           |
| `NEXT_PUBLIC_EMAIL`            | Email liên hệ                          | `config/site.config.js` | `example@example.com`                       |
| `KV_PREFIX`                    | Tiền tố cho kho KV                     | `config/site.config.js` | Dùng khi triển khai nhiều Index             |
| `UPLOAD_CONFLICT_BEHAVIOR`     | Cách xử lý khi trùng tên trên OneDrive | -                       | `rename` (mặc định), `replace`, hoặc `fail` |

## Tải lên

Người có mật khẩu tải lên có thể nhấn **Upload** trong bất kỳ thư mục nào để tải tệp vào đúng đường dẫn OneDrive hiện tại. Bảng tải lên hỗ trợ chọn tệp, chọn thư mục bằng `webkitdirectory` trên trình duyệt Chromium, và kéo-thả tệp/thư mục nếu trình duyệt hỗ trợ đọc thư mục. Cấu trúc thư mục con được giữ nguyên.

Tệp lớn dùng Microsoft Graph upload session. Trình duyệt tải từng phần lên URL Graph ngắn hạn do server tạo, nên Vercel không phải giữ toàn bộ tệp trong bộ nhớ và access token Microsoft vẫn chỉ nằm ở server.

Ứng dụng chấp nhận mọi loại tệp. Với iPhone Live Photos, hãy tải lên cả hai thành phần gốc, thường là ảnh `.HEIC`/`.HEIF` và video `.MOV`, tốt nhất bằng cách chọn cả thư mục export từ iPhone/iCloud/Photos. Ứng dụng không lọc, đổi tên, nén, chuyển đổi hay xóa metadata; tên tệp, phần mở rộng, cấu trúc thư mục và thời gian sửa đổi được giữ lại khi Microsoft Graph cho phép.

Bật tải lên nghĩa là website có quyền ghi vào OneDrive. Hãy dùng `UPLOAD_PASSWORD` mạnh và chỉ chia sẻ deployment cho người quản trị/người tin cậy. Duyệt công khai vẫn giữ hành vi hiện tại trừ khi bạn cấu hình protected routes.

## Nâng cấp bản triển khai cũ

Các site VercelDrive đã triển khai trước đây đang có OAuth token chỉ đọc. Sau khi bật tải lên, cần xóa token cũ và xác thực lại với quyền ghi.

Cách A: chỉnh App Registration hiện tại.

1. Vào Azure Portal và mở App Registration đang dùng.
2. Thêm delegated Microsoft Graph permission `Files.ReadWrite.All`.
3. Giữ `User.Read` và `offline_access`.
4. Grant/admin-consent nếu tenant yêu cầu.
5. Tạo lại client secret nếu cần, rồi cập nhật `CLIENT_SECRET` trên Vercel nếu secret thay đổi.
6. Thêm `UPLOAD_PASSWORD` và tùy chọn `UPLOAD_CONFLICT_BEHAVIOR`.
7. Xóa token OAuth cũ trong Redis/KV để buộc đăng nhập lại. Xóa `<KV_PREFIX>access_token` và `<KV_PREFIX>refresh_token`, hoặc đăng nhập bằng mật khẩu tải lên rồi POST `/api/upload/reset-auth-tokens`.
8. Redeploy và xác thực OAuth lại khi mở site.

Cách B: tạo App Registration mới.

1. Thêm redirect URI theo OAuth callback hiện tại của VercelDrive.
2. Thêm delegated permissions: `User.Read`, `Files.ReadWrite.All`, `offline_access`.
3. Tạo client secret mới.
4. Cập nhật biến môi trường Vercel: `CLIENT_ID`, `CLIENT_SECRET`, `USER_PRINCIPAL_NAME`, `BASE_DIRECTORY`, `REDIS_URL` nếu cần, và `UPLOAD_PASSWORD`.
5. Redeploy và xác thực OAuth lại khi mở site.

## Xử lý lỗi tải lên

- **Upload báo permission denied:** kiểm tra Azure app có `Files.ReadWrite.All`, đã consent nếu cần, và site đã OAuth lại sau khi đổi quyền.
- **Deployment cũ vẫn chỉ đọc:** xóa key Redis/KV `access_token` và `refresh_token`, có tính cả `KV_PREFIX` nếu dùng, rồi OAuth lại.
- **Không chọn được thư mục:** dùng trình duyệt Chromium cho folder picker. Trình duyệt khác có thể chỉ hỗ trợ chọn tệp.
- **Live Photo chỉ lên ảnh:** hãy chọn cả file gốc `.HEIC`/`.HEIF` và `.MOV`, hoặc chọn cả thư mục export.
- **Tệp lớn lỗi trên Vercel:** thử lại với mạng ổn định. Upload session có thể hết hạn và Microsoft Graph có thể throttle các upload rất lớn hoặc kéo dài.

## Tài liệu

Xem thêm hướng dẫn tại: https://ovi.swo.moe/docs/getting-started

## Rủi ro bảo mật

- Trong bản gốc, `userPrincipalName`, `clientId`, và `obfuscatedClientSecret` bị lộ trong mã nguồn trang web.

  Phiên bản này kiểm tra xem người dùng đã xác thực OAuth chưa. Nếu rồi, sẽ chuyển về trang chủ; nếu chưa, mới tiếp tục quy trình OAuth. Điều này giúp hạn chế việc lộ thông tin qua URL OAuth.

- Do thiết kế của Next.js, biến môi trường bắt đầu bằng `NEXT_PUBLIC_` sẽ xuất hiện trên client. Vì vậy, bất kỳ ai cũng có thể xem giá trị của chúng.

  Phiên bản này dùng biến không có tiền tố `NEXT_PUBLIC_` cho `userPrincipalName`, `clientId`, `obfuscatedClientSecret`, và `baseDirectory` để giảm nguy cơ lộ thông tin.

## Danh sách việc cần làm

- Đưa mật khẩu vào biến môi trường thay vì file `.password`.  
  Tuy nhiên, cách này khó đặt mật khẩu khác nhau cho từng thư mục.

- Thiết kế lại LOGO vì logo cũ độ tương phản thấp và không đồng nhất với phong cách trang.

## Giấy phép

MIT License: https://github.com/Astear17/VercelDrive/blob/main/LICENSE

© 2021–2023 spencer woo  
© 2023 iRedScarf  
© 2026 Astear17  
Được tạo bởi spencer woo | Chỉnh sửa bởi Astear17
