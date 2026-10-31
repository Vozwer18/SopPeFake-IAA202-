# Đặt hàng và thanh toán QR cho bài demo

Luồng này dùng chuyển khoản thủ công: shop tải ảnh QR nhận tiền, khách đặt hàng
từ giỏ rồi chuyển tiền bằng ứng dụng ngân hàng. Website không tự đọc giao dịch
ngân hàng. Người bán kiểm tra tiền thực nhận rồi bấm xác nhận.

## Cập nhật lên Render

Code nằm trên nhánh `codex/render-free-demo`. Vào service ứng dụng trên Render,
chọn **Manual Deploy → Deploy latest commit** nếu chưa tự deploy. Lệnh khởi động
`npm run start:demo` sẽ áp dụng migration mới trước khi mở web.

Migration `20261101010000_qr_checkout` chỉ thêm:

- `shops.payment_qr_url`: QR nhận tiền hiện tại của shop.
- `orders.payment_qr_url`: QR áp dụng cho đơn tại lúc đặt.
- `orders.checkout_token` và unique index: chống tạo đơn trùng khi gửi lại yêu cầu.

Không xóa bảng, không reset tài khoản/sản phẩm và không cần import lại SQL. Các
bảng `orders`, `order_items`, `payments`, `addresses`, `order_status_history`,
`reviews` và `inventories` đã có được dùng lại. Nếu chạy local, tạo Prisma Client
mới rồi áp dụng migration trước khi start ứng dụng.

Đơn cũ được import từ ngoài không có mã checkout của luồng này vẫn được giữ,
nhưng không bật các nút tự cập nhật thanh toán/tồn kho cho chúng.

## 1. Người bán tải QR

1. Đăng nhập tài khoản seller đã được duyệt.
2. Vào **Cửa hàng**. Mỗi shop có mục **QR nhận tiền**.
3. Bấm **Tải ảnh QR** và chọn ảnh QR nhận chuyển khoản của mình. Nên dùng QR
   không ghi sẵn số tiền; khách sẽ nhập số tiền và nội dung theo từng đơn.
4. Ảnh hiện lên là đã lưu. Có thể dùng **Thay ảnh QR** để cập nhật.

Các định dạng PNG/JPG/WebP và giới hạn ảnh của website vẫn áp dụng (giao diện
giới hạn 1 MB). Với cấu hình Render Free `MEDIA_STORAGE=database`, ảnh QR cũng
được lưu trong MySQL và còn sau khi restart. Đơn đã đặt giữ QR cũ; thay QR chỉ
áp dụng cho đơn mới.

## 2. Người mua đặt hàng

1. Đăng nhập customer, chọn đúng SKU và số lượng rồi thêm vào giỏ.
2. Mở **Giỏ hàng**. Nếu shop chưa có QR, sản phẩm ngừng bán hoặc vượt tồn kho,
   nút đặt hàng bị khóa và có thông báo để cập nhật giỏ.
3. Điền tên người nhận, số điện thoại, tỉnh/thành, quận/huyện, phường/xã và địa
   chỉ cụ thể. Ghi chú là tùy chọn.
4. Bấm **Đặt hàng và xem QR**.
5. Mở trang **Đơn hàng** để xem số tiền, mã đơn và QR. Quét QR trong ứng dụng
   ngân hàng, nhập đúng số tiền và ghi mã đơn làm nội dung chuyển khoản.

Giỏ nhiều shop được tách thành một đơn cho từng shop, mỗi đơn có QR/số tiền/mã
riêng. Phí vận chuyển của luồng demo này là **0 đồng**, không dùng bảng giá dịch
vụ vận chuyển để tự tính. Giá và tổng tiền được tính lại ở server tại lúc đặt,
không lấy số tiền do trình duyệt gửi lên.

Đơn mới ở trạng thái **Chờ xác nhận thanh toán**. Đặt hàng giữ chỗ đúng SKU;
chưa tự đánh dấu đã chuyển tiền. Hãy chờ người bán xác nhận sau khi thực nhận.

## 3. Người bán xác nhận

Vào **Đơn hàng**, bấm **Cập nhật trạng thái** để tải lại nếu khách vừa đặt:

1. Kiểm tra đủ số tiền và đúng mã đơn trong tài khoản ngân hàng của mình.
2. Bấm **Đã nhận thanh toán**. Đơn chuyển sang trạng thái cùng tên.
3. Sau khi đã giao hàng cho đơn vị vận chuyển, bấm **Hàng đã gửi**.

Không thể bấm gửi hàng khi chưa xác nhận nhận tiền. Mỗi seller chỉ xem và cập
nhật được đơn của shop mình, kể cả khi đổi ID đơn trong request.

## 4. Người mua nhận hàng và đánh giá

Vào **Đơn hàng** từ thanh tài khoản, giỏ hàng hoặc trang tài khoản:

1. Bấm **Cập nhật trạng thái** để xem cập nhật từ shop.
2. Khi trạng thái là **Hàng đã gửi** và đã thật sự nhận hàng, bấm **Đã nhận hàng**.
3. Form đánh giá xuất hiện: chọn 1–5 sao, nhập nhận xét nếu muốn, rồi **Gửi đánh giá**.

Chỉ người mua của đơn đã nhận mới đánh giá được sản phẩm có trong đơn đó. Mỗi
sản phẩm được đánh giá một lần trong một đơn, kể cả đơn có nhiều SKU của cùng
sản phẩm. Đánh giá hiển thị trên trang chi tiết sản phẩm; điểm sản phẩm và shop
được cập nhật theo đánh giá hiển thị. Không có bước duyệt đánh giá riêng trong
luồng demo này.

## Hủy đơn và tồn kho

Khách có nút **Hủy đơn chưa thanh toán** khi shop chưa xác nhận nhận tiền. Chỉ
dùng khi chưa chuyển khoản. Hủy sẽ giải phóng hàng giữ chỗ; không tự hoàn tiền
ngân hàng hoặc đưa hàng trở lại giỏ. Đơn đã xác nhận tiền/gửi hàng không thể
hủy bằng nút này.

Khi đặt, tăng `reserved_quantity`. Khi gửi hàng, giảm cả tổng tồn và số giữ chỗ.
Khi nhận hàng, cập nhật số đã bán và doanh thu đơn hoàn tất. Bấm lại hoặc retry
các nút không tạo đơn, trừ tồn, cộng đã bán hay tạo đánh giá lần thứ hai.

Luồng chưa có tự động hết hạn đơn chờ thanh toán, tích hợp ngân hàng, hoàn tiền,
mã vận đơn hoặc webhook. Trong bài demo, khách hủy đơn chưa trả tiền để giải
phóng hàng và hai bên dùng nút cập nhật để tải trạng thái mới.

## Kiểm tra nhanh khi trình bày

Dùng hai cửa sổ/trình duyệt cho seller và customer: tải QR → thêm giỏ → đặt hàng
→ thấy QR → seller xác nhận tiền → seller gửi → customer nhận → đánh giá → mở
trang sản phẩm để xem sao/nhận xét.

`npm test` gồm kiểm thử đơn hàng mới; riêng phần mới là `npm run test:orders`.
Các bài tích hợp cần `TEST_DATABASE_URL` của database thử nghiệm kết thúc `_test`.
Không chạy chúng trên database Aiven đang dùng demo. Đã kiểm tra HTTP/MySQL cho
quyền sở hữu, nhiều shop, giữ chỗ, retry, mua món cuối cùng và đánh giá sau nhận.
