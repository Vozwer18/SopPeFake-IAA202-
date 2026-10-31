# Đánh giá sản phẩm, phản hồi của shop và kiểm tra bảo mật

## Dùng sau khi cập nhật Render

Vào service ứng dụng → **Manual Deploy → Deploy latest commit**, dùng nhánh
`codex/render-free-demo`. `npm run start:demo` tự áp dụng migration
`20261101020000_review_replies` trước khi mở web. Migration chỉ thêm ba cột
nullable vào `reviews`: nội dung phản hồi, thời điểm phản hồi đầu tiên và thời
điểm sửa phản hồi. Không reset dữ liệu hoặc tạo lại tài khoản.

**Người mua:** vào **Đơn hàng**, sau khi shop xác nhận thanh toán và gửi hàng,
bấm **Đã nhận hàng** khi thực sự nhận được hàng. Mở lại trang sản phẩm, kéo đến
**Đánh giá sản phẩm → Viết đánh giá**, chọn đơn đã nhận, số sao và gửi nhận xét.
Cũng có thể đánh giá ngay tại đơn hàng. Mỗi sản phẩm trong mỗi đơn chỉ được
đánh giá một lần, kể cả khi mua nhiều SKU. Trang sản phẩm giải thích lý do nếu
chưa đủ điều kiện và có liên kết đến đơn mua.

**Người bán:** trong bảng điều khiển, vào **Đánh giá**, bấm **Cập nhật đánh giá**
nếu khách vừa gửi. Nhập nội dung và **Lưu phản hồi**. Có thể sửa phản hồi của
shop; không được sửa nhận xét hoặc số sao của khách. Phản hồi hiển thị công khai
trên trang sản phẩm và trong đơn mua của khách. Chỉ shop sở hữu sản phẩm mới
xem danh sách quản lý và phản hồi đánh giá hiển thị của sản phẩm đó.

## XSS

- Nhận xét, tên người mua, tên sản phẩm và phản hồi đều được hiển thị như văn
  bản. HTML trong các trường này không được thực thi. Thành phần phản hồi và
  form mới dùng `textContent`/`textarea.value`; các template cũ dùng `SopPe.esc`.
- API không loại bỏ ký tự HTML khỏi dữ liệu: việc phòng XSS nằm ở xử lý đúng
  ngữ cảnh khi hiển thị. Không đổi sang hiển thị HTML trực tiếp.
- Phản hồi bắt buộc là chuỗi có nội dung, tối đa 2.000 ký tự. API chỉ cập nhật
  ba trường phản hồi, bỏ qua các trường giả mạo như `rating`, `comment`, `user_id`.
- Bổ sung CSP giới hạn script từ cùng origin, chặn inline script, object, base
  URL và framing; giữ CSS inline để tương thích giao diện hiện tại.
- Sửa gửi form đánh giá ở Đơn hàng khi `event.submitter` rỗng, đồng thời chặn
  gửi lặp khi yêu cầu đang chạy.

Đã thử Chromium với payload `<img onerror>`, `<svg onload>`, `<script>` và
chuỗi đóng `textarea` trong tên, mô tả, nhận xét và phản hồi. Đã kiểm tra trang
sản phẩm, đơn mua, danh sách phản hồi của shop và nội dung textarea sau tải lại.
Trong lượt kiểm tra escaping đã bật `bypassCSP` để không phụ thuộc vào CSP:
không tạo phần tử/script từ nội dung và không thực thi mã. Lượt riêng với CSP
bình thường chặn script inline. Tìm kiếm chứa HTML cũng không thực thi mã.
Giao diện trang sản phẩm đã kiểm tra ở chiều rộng 375px.

## SQL injection

Trong mã runtime `backend/src`, truy vấn dùng Prisma ORM; các câu SQL trực tiếp
dùng tagged `$queryRaw`/`$executeRaw` với tham số bind. Các danh sách `IN` dùng
`Prisma.join` với ID số từ dữ liệu đã kiểm tra. Không tìm thấy `Unsafe`,
`Prisma.raw` hoặc ghép chuỗi đầu vào thành câu SQL trong phạm vi này.

Đã gửi các chuỗi `1 OR 1=1`, `' OR '1'='1' --`, `1; DROP TABLE users;--` vào
ID sản phẩm, bộ lọc danh mục, API điều kiện đánh giá, gửi đánh giá, phản hồi,
tìm kiếm và đăng nhập. ID bị từ chối với 400, đăng nhập không vượt qua xác thực,
tìm kiếm xử lý chuỗi như dữ liệu; bảng và số tài khoản không bị thay đổi.
Chuỗi SQL trong phản hồi được lưu như văn bản.

**Kết quả:** chưa phát hiện SQL injection hoặc XSS khai thác được trong phần
mã và các luồng đã kiểm tra. Đây là rà soát mã nguồn và kiểm thử chức năng trên
MySQL thử nghiệm riêng, không phải kiểm thử xâm nhập website/Aiven đang chạy
hoặc cam kết toàn bộ hệ thống không còn lỗ hổng.

## Kiểm thử hồi quy

Các kiểm thử API nằm trong `backend/test/orders.integration.test.js`, gồm điều
kiện đánh giá, quyền sở hữu, phản hồi ẩn, dữ liệu vượt giới hạn, giả mạo trường,
chuỗi SQL injection và security headers, cùng luồng QR/tồn kho trước đó.

```sh
# Chỉ dùng database thử nghiệm riêng, tên kết thúc bằng _test.
cd backend
export TEST_DATABASE_URL='mysql://TEST_USER:TEST_PASSWORD@127.0.0.1:3306/soppe_test'
DATABASE_URL="$TEST_DATABASE_URL" npm run db:deploy
npm test
npm run test:demo
```

Đợt kiểm tra này: 58 kiểm thử trong `npm test` và 1 kiểm thử khởi động demo
đều qua, cộng kiểm tra Chromium nêu trên. Không sử dụng dữ liệu Aiven thật.
