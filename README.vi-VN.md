# VercelDrive
Dự án này là bản sao từ [spencerwooo/onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index), dựa trên phiên bản đã được lưu trữ bởi tác giả gốc vào ngày 24/06/2023. Nó bao gồm một số chỉnh sửa nhỏ cho phép bạn triển khai miễn phí trên Vercel, dùng để trình chiếu, chia sẻ, xem trước và tải xuống các tệp OneDrive của bạn trên một trang web. Để biết phương pháp triển khai cụ thể, vui lòng xem hướng dẫn bên dưới.

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
   - `user.read`
   - `files.read.all`
   - `offline_access`

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

| Tên | Mô tả | Đường dẫn gốc | Ghi chú |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_TITLE` | Tiêu đề trang | `config/site.config.js` | Ví dụ: 2Drive |
| `USER_PRINCIPAL_NAME` | Tài khoản OneDrive | `config/site.config.js` | `example@outlook.com` |
| `BASE_DIRECTORY` | Thư mục OneDrive muốn chia sẻ | `config/site.config.js` | `/tên thư mục`, thư mục gốc là `/` |
| `CLIENT_ID` | Client ID của ứng dụng Azure | `config/api.config.js` | Nên tự đăng ký, hạn dùng 2 năm |
| `CLIENT_SECRET` | Client Secret của ứng dụng Azure | `config/api.config.js` | Cần mã hóa AES theo hướng dẫn |

### Biến tùy chọn

| Tên | Mô tả | Đường dẫn gốc | Ghi chú |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_PROTECTED_ROUTES` | Đường dẫn thư mục cần mật khẩu | `config/site.config.js` | `/route1,/route2` |
| `NEXT_PUBLIC_EMAIL` | Email liên hệ | `config/site.config.js` | `example@example.com` |
| `KV_PREFIX` | Tiền tố cho kho KV | `config/site.config.js` | Dùng khi triển khai nhiều Index |

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
