# Đưa SopPe Fake lên online bằng Railway

Bản mã nguồn này đã có cấu hình triển khai. Bạn cần tạo tài khoản Railway,
đưa mã nguồn lên GitHub, rồi làm các bước bên dưới. Hiện chưa có website online
hay tên miền được tạo sẵn cho bạn.

Express phục vụ cả giao diện và API trên cùng một tên miền HTTPS. MySQL lưu
tài khoản/sản phẩm; một volume riêng lưu ảnh tải lên. Sau khi triển khai thành
công, website chạy trên Railway và bạn có thể tắt máy tính cá nhân.

Railway tính phí theo gói và tài nguyên sử dụng; xem [giá hiện tại](https://railway.com/pricing)
trước khi chọn gói. Không cần mua tên miền riêng để bắt đầu.

## 1. Đưa đúng mã nguồn lên GitHub

Nếu tải bản ZIP, giải nén toàn bộ. Thư mục gốc phải chứa cùng lúc:

```text
Dockerfile
railway.json
backend/
  package.json
  prisma/migrations/
frontend/
```

Đăng nhập [GitHub](https://github.com), tạo repository cho dự án (có thể để
Private). Đưa toàn bộ mã nguồn đã giải nén vào đó; có thể dùng GitHub Desktop:
**File → Add local repository** (hoặc tạo repository từ thư mục), commit rồi
**Publish repository / Push origin**. Nếu đã có repository của dự án, cập nhật
các file mới vào repository đó.

Giữ các file ẩn `.gitignore` và `.dockerignore`. Không đưa `.env`, `node_modules`
hoặc mật khẩu lên GitHub. File `backend/.env.example` là mẫu cấu hình local,
không phải cấu hình cơ sở dữ liệu online.

## 2. Tạo tài khoản và MySQL

1. Vào [Railway](https://railway.com), đăng nhập/đăng ký bằng GitHub.
2. Tạo **New Project → Empty Project**.
3. Trong project, chọn **New / Create → Database → MySQL**.
4. Giữ tên service là `MySQL` để khớp biến mẫu ở bước 4.
5. Chờ MySQL chạy; kiểm tra service có volume dữ liệu tại `/var/lib/mysql`.

Dùng cơ sở dữ liệu **mới và trống** cho lần triển khai đầu theo hướng dẫn này.
Các file SQL demo trong `database/` không cần import. Nếu muốn chuyển dữ liệu
localhost đang có, đọc phần chuyển dữ liệu ở cuối trước khi triển khai.

## 3. Thêm ứng dụng

Trong cùng project, chọn **New / Create → GitHub Repo**, cấp quyền đọc repository
cho Railway và chọn đúng repository/nhánh chứa bản mã nguồn đã cập nhật.

Trong **Settings** của service ứng dụng:

- **Root Directory**: để gốc repository (`/`), không chọn `backend` hoặc `frontend`.
- File cấu hình là `/railway.json` ở gốc. Railway sẽ dùng `Dockerfile`.
- Giữ một instance ứng dụng khi dùng volume ảnh.

Nếu Railway tự chạy ngay và báo thiếu biến môi trường, làm tiếp bước 4–5 rồi
deploy lại. Không cần tạo lại service.

## 4. Cấu hình biến môi trường

Mở **service ứng dụng → Variables**, thêm các biến sau:

| Tên biến | Giá trị |
| --- | --- |
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` |
| `JWT_SECRET` | Chuỗi ngẫu nhiên riêng, tối thiểu 32 ký tự |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `TRUST_PROXY` | `1` |
| `RAILWAY_RUN_UID` | `0` |

`DATABASE_URL` là **reference variable**: dùng **Add Reference** để chọn
`MYSQL_URL` từ service MySQL. Nếu tên service khác `MySQL`, chọn đúng service;
không dùng địa chỉ `localhost` hay `127.0.0.1` của máy bạn.

Tạo `JWT_SECRET` trên máy đã cài Node.js bằng lệnh:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Dán kết quả vào Variables, không đưa vào mã nguồn và không đổi khóa mỗi lần
deploy. `TRUST_PROXY=1` áp dụng cho HTTPS qua proxy của Railway.
`RAILWAY_RUN_UID=0` cho phép ghi vào volume Railway vốn được mount bằng root.

## 5. Gắn ổ lưu ảnh

Trong project, chọn service **ứng dụng**, thêm **Volume / Attach Volume** và đặt
**Mount Path** chính xác:

```text
/app/backend/public/products
```

Volume này khác volume MySQL. Thiếu nó, ảnh tải lên có thể mất khi thay container.
Ảnh localhost không tự được tải lên Railway. Nếu có ảnh cũ, xem phần chuyển dữ liệu.

## 6. Deploy và lấy đường dẫn HTTPS

Lưu/áp dụng các thay đổi rồi **Deploy / Redeploy** ứng dụng. Cấu hình đã chuẩn bị:

| Giai đoạn | Việc chạy |
| --- | --- |
| Build | Node.js 22, `npm ci`, tạo Prisma Client cho Linux, đóng gói frontend/API |
| Pre-deploy | `npm run db:deploy` áp dụng các migration chưa chạy |
| Start | `node src/server.js` |
| Health check | `/api/health` |

Migration đầu tạo các bảng từ schema hiện tại, không tự thêm tài khoản, sản phẩm
hay danh mục mẫu. Các lần deploy tiếp theo không chạy lại migration đã áp dụng.
Không dùng `db push --accept-data-loss`, reset hoặc import lại SQL ở mỗi lần khởi động.

Khi deployment thành công, mở **Settings → Networking / Public Networking →
Generate Domain**, chọn cổng `3000` nếu được hỏi. Railway cấp một địa chỉ HTTPS
dạng `https://<ten-duoc-cap>.up.railway.app`. Dùng địa chỉ Railway thực sự trả về;
đây chỉ là mô tả định dạng, không phải link đã được tạo.

Mở địa chỉ đó trên điện thoại bằng mạng di động để kiểm tra truy cập từ Internet.
Giao diện và API đi chung tên miền, không cần thay URL trong JavaScript.

## 7. Tạo tài khoản quản trị

Khách có thể đăng ký ở trang đăng nhập. Tài khoản quản trị đầu tiên cần được tạo
bằng lệnh, không có tài khoản/mật khẩu mặc định.

Trong Variables của ứng dụng, tạm thêm `ADMIN_EMAIL` và `ADMIN_PASSWORD` (mật khẩu
tối thiểu 12 ký tự, tối đa 72 byte UTF-8), áp dụng thay đổi và chờ ứng dụng chạy.

Mở terminal trên máy bạn, cài [Railway CLI](https://docs.railway.com/cli), rồi:

```sh
npm install -g @railway/cli
railway login
railway link
railway ssh
```

Khi link/SSH, chọn đúng project, môi trường và **service ứng dụng**. CLI có thể
yêu cầu đăng ký SSH key lần đầu. Trong terminal của container ứng dụng, chạy:

```sh
cd /app/backend
npm run admin:create
exit
```

Xóa hai biến `ADMIN_EMAIL`, `ADMIN_PASSWORD` sau khi tạo xong và áp dụng thay đổi.
Lệnh không ghi đè hoặc đổi mật khẩu tài khoản đã tồn tại. Không dùng
`railway run` trên máy cá nhân với URL MySQL nội bộ: lệnh đó chạy ở máy cá nhân.

## 8. Kiểm tra website và cập nhật sau này

1. Mở `/api/health`: nhận JSON có `status: "OK"`. Endpoint này kiểm tra tiến trình
   HTTP, chưa chứng minh MySQL hoạt động.
2. Mở `/api/categories`: trả dữ liệu thành công (ban đầu danh sách rỗng) để kiểm
   tra kết nối và bảng MySQL.
3. Đăng ký khách hàng, đăng nhập và đăng xuất qua địa chỉ HTTPS.
4. Đăng ký người bán, dùng admin duyệt người bán, sau đó tạo shop/danh mục/sản phẩm
   có ảnh và dùng admin duyệt sản phẩm để hiển thị công khai.
5. Redeploy một lần và kiểm tra lại dữ liệu cùng ảnh đã tải lên.

Các lần sửa sau: commit/push vào nhánh GitHub mà Railway đang theo dõi. Giữ nguyên
MySQL, volume ảnh và `JWT_SECRET`. Khi thay schema, tạo migration mới trong môi
trường phát triển, xem lại SQL rồi commit cùng mã nguồn. Bật sao lưu cho MySQL
và volume ảnh trước khi sử dụng với dữ liệu cần giữ.

Website hiện hỗ trợ danh mục, quản trị, người bán và giỏ hàng. Thanh toán,
checkout, xử lý đơn, khôi phục mật khẩu và giới hạn thử đăng nhập chưa được triển
khai trong dự án hiện tại.

## Nếu muốn giữ dữ liệu và ảnh từ localhost

Cách ít rủi ro nhất để bắt đầu là database online trống. Nếu cần dữ liệu cũ:

1. Sao lưu MySQL và thư mục `backend/public/products` trước khi chuyển.
2. So sánh schema database cũ với `backend/prisma/schema.prisma`; xử lý chênh lệch
   trước khi đánh dấu migration đã có. Không áp dụng migration khởi tạo lên
   database đã có bảng.
3. Import bản sao dữ liệu vào MySQL online bằng công cụ MySQL phù hợp. Nếu schema
   khớp đầy đủ và database chưa có lịch sử Prisma Migrate, baseline bằng
   `npx prisma migrate resolve --applied 20261031000000_initial` trong môi trường
   có kết nối MySQL online, sau đó `npm run db:deploy`.
4. Chép ảnh vào volume ứng dụng, giữ nguyên tên file để các URL `/products/...`
   đang lưu trong database tiếp tục hoạt động. Railway hỗ trợ quản lý file volume
   qua CLI/SFTP; không commit ảnh người dùng lên GitHub để làm cơ chế lưu trữ.

Nếu cần baseline trước lần deploy đầu, có thể tạm đặt Pre-deploy Command trong
`railway.json` thành lệnh `prisma migrate resolve` ở trên, deploy một lần sau khi
đã kiểm tra/import schema; sau đó trả về `npm run db:deploy`. Baseline chỉ dùng
một lần với schema đã khớp, không đặt lệnh đó làm bước triển khai cố định.

## Lỗi thường gặp

| Biểu hiện | Cách kiểm tra |
| --- | --- |
| Không tìm thấy Dockerfile hoặc thiếu frontend | Root Directory phải là gốc repo; kiểm tra đã push đầy đủ file |
| `JWT_SECRET must be configured...` | Thêm khóa đủ dài vào Variables của ứng dụng, rồi deploy lại |
| Prisma `P1001` / không kết nối database | MySQL phải chạy, cùng project/môi trường; reference `MYSQL_URL` phải đúng |
| Prisma `P3005` / database không trống | Dùng database mới hoặc làm quy trình baseline sau khi kiểm tra schema |
| Prisma `P3018` / migration thất bại | Đọc lỗi SQL; sửa nguyên nhân và khôi phục migration theo Prisma, không reset dữ liệu |
| Domain báo không phản hồi | Kiểm tra deployment, log, `PORT=3000` và target port `3000` |
| `EACCES` khi lưu ảnh | Kiểm tra mount path và `RAILWAY_RUN_UID=0` |
| Ảnh mất sau redeploy | Kiểm tra volume gắn đúng service ứng dụng và đúng mount path |
| Trang mở được nhưng danh mục lỗi | Health check HTTP không kiểm tra DB; xem `/api/categories` và log Prisma |

Tài liệu Railway: [Dockerfile](https://docs.railway.com/builds/dockerfiles),
[MySQL](https://docs.railway.com/databases/mysql),
[biến tham chiếu](https://docs.railway.com/variables),
[volume và quyền ghi](https://docs.railway.com/volumes),
[pre-deploy](https://docs.railway.com/deployments/pre-deploy-command),
[SSH](https://docs.railway.com/cli/ssh).
