# Demo IAA202: Render + Aiven MySQL

Phương án này dành cho việc demo trong vài ngày: Render Free chạy Express và
giao diện; Aiven MySQL Free lưu tài khoản, sản phẩm và ảnh. Website chạy trên
server, máy cá nhân không cần bật. Chưa có website hay tài khoản hosting được
tạo thay bạn: cần đăng ký hai tài khoản và cấu hình theo các bước sau.

## 1. Tạo MySQL miễn phí trên Aiven

1. Vào [Aiven Console](https://console.aiven.io/), đăng ký tài khoản.
2. Tạo service **MySQL**, chọn **Free**. Kiểm tra màn hình xác nhận là gói Free,
   không chọn Developer hay gói trả phí dùng trial credit. Gói Free không yêu
   cầu thẻ thanh toán theo tài liệu Aiven hiện tại.
3. Chờ service ở trạng thái **Running**.
4. Trong **Overview / Connection information**, lấy **Service URI** và tải
   **CA certificate**. Giữ nguyên tên database thật trong URI (thường là
   `defaultdb`); không thay bằng tên database localhost.

Chuẩn bị `DATABASE_URL`: giữ nguyên phần URI từ `mysql://` đến hết tên database,
bỏ query cũ nếu có, rồi thêm:

```text
?sslcert=/etc/secrets/aiven-ca.pem&sslaccept=strict&connection_limit=3&connect_timeout=30&pool_timeout=30
```

Ví dụ minh họa, **không phải thông tin để dùng thật**:

```text
mysql://USER:PASSWORD@HOST:PORT/defaultdb?sslcert=/etc/secrets/aiven-ca.pem&sslaccept=strict&connection_limit=3&connect_timeout=30&pool_timeout=30
```

Dùng Service URI do Aiven cung cấp để mật khẩu được mã hóa URL đúng. Không dùng
`localhost`, URL MySQL local hay biến tham chiếu `${{MySQL.MYSQL_URL}}` của Railway.
Các tham số TLS ở trên dành cho Prisma 6 đang có trong dự án; giữ kiểm tra chứng
chỉ bằng `sslaccept=strict`.

## 2. Cập nhật GitHub

Push **toàn bộ phiên bản mã nguồn mới** lên repository của bạn. Thư mục gốc cần có:

```text
Dockerfile
render.yaml
DEPLOY_FREE.md
backend/package.json
backend/scripts/start-demo.js
backend/prisma/migrations/
frontend/
```

Nếu đang dùng repository cũ, cần commit và push cả file mới, không chỉ file HTML.
Giữ `.env` chứa mật khẩu ngoài GitHub. Không cần tải `node_modules` hay SQL demo lên
hosting. Các migration trong mã nguồn sẽ tạo bảng trên database Aiven mới, trống.
Database localhost không tự chuyển lên online.

## 3. Tạo ứng dụng Render Free

Đăng ký [Render](https://dashboard.render.com/), chọn **New → Web Service** và
kết nối repository GitHub. Cấu hình:

| Mục | Giá trị |
| --- | --- |
| Language / Runtime | `Docker` |
| Root Directory | Để trống để dùng gốc repository |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | Gốc repository (`.` nếu được hỏi) |
| Instance Type / Plan | **Free** |
| Docker Command | `npm run start:demo` |
| Health Check Path | `/api/health` |

Docker Command có thể nằm trong **Advanced** hoặc **Settings** tùy giao diện.
Phải đặt lệnh `npm run start:demo`: lệnh này tạo bảng/migrate trước khi mở web.
Không cần Pre-deploy Command, disk hoặc dịch vụ Postgres của Render.

Trong **Environment Variables**, nhập:

| Biến | Giá trị |
| --- | --- |
| `DATABASE_URL` | URI Aiven đã thêm tham số TLS ở bước 1 |
| `JWT_SECRET` | Khóa ngẫu nhiên ít nhất 32 ký tự, giữ ổn định qua các lần deploy |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `TRUST_PROXY` | `1` |
| `MEDIA_STORAGE` | `database` |

Có thể tạo JWT_SECRET bằng Node.js trên máy bạn:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Trong **Environment → Secret Files → Add Secret File**:

- **Filename**: `aiven-ca.pem`.
- **Contents**: toàn bộ nội dung CA certificate Aiven đã cung cấp, gồm cả dòng
  `-----BEGIN CERTIFICATE-----` và `-----END CERTIFICATE-----`.

Render sẽ đặt file tại `/etc/secrets/aiven-ca.pem`. Nếu chưa có mục Secret Files
trong màn hình tạo service, tạo service trước rồi thêm file trong trang Environment.
Lần khởi động đầu có thể báo thiếu chứng chỉ cho đến khi bạn thêm file và deploy lại.

Chọn **Create / Deploy**, chờ đến **Live**. Mở địa chỉ HTTPS `.onrender.com` mà
Render trả về. Không cần mua tên miền riêng.

Nếu dùng **New → Blueprint** thay cho Web Service, file `render.yaml` đã chuẩn bị
sẵn gói Free, lệnh khởi động, MEDIA_STORAGE và tự sinh JWT_SECRET. Điền DATABASE_URL,
sau đó thêm Secret File `aiven-ca.pem` như trên. Chỉ chọn một cách tạo service.

## 4. Tạo admin mà không cần terminal trả phí

Trong Environment của ứng dụng, tạm thêm:

```text
BOOTSTRAP_ADMIN=1
ADMIN_EMAIL=email-quan-tri-cua-ban
ADMIN_PASSWORD=mat-khau-rieng-cua-ban
```

Email phải hợp lệ; mật khẩu ít nhất 12 ký tự, tối đa 72 byte UTF-8. Đây là thông
tin bạn tự chọn, không dùng nguyên chữ minh họa ở trên.

Chọn **Save and deploy**. Khi khởi động, ứng dụng áp dụng migration rồi tạo admin
và ghi thông báo `Administrator created`. Đăng nhập ở trang `/login.html`.

Sau khi đăng nhập thành công, xóa `ADMIN_EMAIL`, `ADMIN_PASSWORD`, đặt
`BOOTSTRAP_ADMIN=0` (hoặc xóa biến), rồi lưu và deploy lại. Tài khoản vẫn nằm trong
MySQL. Nếu bootstrap được chạy lại với cùng email admin đang hoạt động, lệnh giữ
nguyên tài khoản và mật khẩu; không reset. Nếu email thuộc tài khoản thường,
lệnh dừng thay vì tự cấp quyền admin.

## 5. Chuẩn bị bài trình bày

1. Mở `/api/health`, nhận `status: "OK"` để kiểm tra web server.
2. Mở `/api/categories`, nhận JSON thành công để kiểm tra MySQL. Database mới có
   danh sách rỗng là bình thường.
3. Đăng ký người bán; đăng nhập admin để duyệt người bán.
4. Người bán tạo shop, danh mục và vài sản phẩm có ảnh; admin duyệt sản phẩm.
5. Đăng ký khách hàng để demo đăng nhập và giỏ hàng.
6. Chọn **Manual Deploy → Deploy latest commit** một lần. Kiểm tra lại tài khoản,
   sản phẩm và ảnh vẫn còn. Trong chế độ `MEDIA_STORAGE=database`, ảnh được ghi vào
   bảng `uploaded_images`, không phụ thuộc ổ đĩa của Render.
7. Trước buổi trình bày khoảng 5 phút, mở website và thử đăng nhập để dịch vụ đã
   sẵn sàng. Có thể mở link trên điện thoại bằng mạng di động để xác nhận truy cập
   từ Internet.

Render Free tự nghỉ sau 15 phút không có truy cập; lượt truy cập tiếp theo có thể
chờ khoảng một phút để khởi động. Không cần chạy bot ping liên tục. Dữ liệu và ảnh
trong MySQL vẫn còn khi web service nghỉ. Nếu Aiven tạm dừng service do không hoạt
động, mở Console để bật lại trước khi demo.

Chế độ ảnh MySQL phù hợp số lượng sản phẩm demo nhỏ. Nén ảnh trước khi tải lên,
ưu tiên vài trăm KB mỗi ảnh để tiết kiệm dung lượng và thời gian tải; giới hạn
upload hiện có vẫn là 6 MB/ảnh, tối đa 8 ảnh mỗi lần. Ảnh từng lưu ở localhost
không tự chuyển vào MySQL: tải lại những ảnh cần cho bài demo qua giao diện online.

## Khi sửa code hoặc kết thúc bài

Push code mới rồi deploy trên Render. Giữ database Aiven và JWT_SECRET; startup
chỉ chạy các migration còn thiếu, không import lại dữ liệu mẫu hay reset bảng.
File `.env` local vẫn dùng cấu hình local và `MEDIA_STORAGE=filesystem` mặc định.

Sau khi chấm xong, sao lưu nếu cần rồi xóa dịch vụ demo khi không dùng nữa. Chọn
đúng gói Free ở cả hai nền tảng; nếu giao diện đề nghị trả phí, dừng ở bước đó để
kiểm tra lại gói, không cần nâng cấp cho luồng demo này.

Website hiện có danh mục, seller/admin và giỏ hàng. Thanh toán, checkout và xử lý
đơn chưa nằm trong các chức năng đã triển khai.

## Xử lý lỗi

| Lỗi | Cách kiểm tra |
| --- | --- |
| `JWT_SECRET must be configured...` | Thêm khóa đủ dài trong Environment của Render |
| Prisma `P1001` | Aiven phải Running; HOST/PORT và tên database lấy từ Service URI; kiểm tra giới hạn IP nếu bạn đã bật chúng |
| Prisma `P1011` / lỗi TLS | Kiểm tra Secret File đúng tên, đủ nội dung CA, đường dẫn `/etc/secrets/aiven-ca.pem` và `sslaccept=strict`; không tắt kiểm tra chứng chỉ |
| Prisma `P3005` | Database có bảng từ trước: dùng database demo mới trống; dữ liệu cũ cần quy trình baseline, không reset tùy tiện |
| `uploaded_images` không tồn tại | Cần push migration thứ hai và đặt Docker Command là `npm run start:demo` |
| Web mở được nhưng danh mục lỗi | `/api/health` chỉ kiểm tra HTTP; xem log database và `/api/categories` |
| Lưu ảnh lỗi hoặc ảnh mất sau restart | Kiểm tra `MEDIA_STORAGE=database`, migration mới đã chạy; ảnh cũ trên filesystem cần tải lại |
| Không có admin | Bật đủ ba biến bootstrap, Save and deploy, xem log; mật khẩu tối thiểu 12 ký tự |
| Render yêu cầu nâng cấp cho Shell / Disk / Pre-deploy | Luồng demo này không cần các tính năng đó; dùng Docker Command và ảnh trong MySQL |

Nguồn: [Render Free](https://render.com/docs/free),
[Render Docker](https://render.com/docs/docker),
[biến môi trường và Secret Files](https://render.com/docs/configure-environment-variables),
[Aiven MySQL Free](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier),
[tạo Aiven MySQL](https://aiven.io/docs/products/mysql/get-started),
[Prisma 6 MySQL/TLS](https://www.prisma.io/docs/orm/v6/overview/databases/mysql).
