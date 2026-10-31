# Một sản phẩm có nhiều SKU

Tính năng dùng các bảng `product_variants` và `inventories` đã có. Không thêm
cột, bảng hay migration. Sản phẩm cũ có một SKU vẫn hoạt động.

## Cách dùng trên website

1. Đăng nhập bằng tài khoản **seller đã được duyệt**.
2. Vào **Sản phẩm → Thêm sản phẩm**, hoặc chọn **Sửa** sản phẩm đang có.
3. Nhập tên, cửa hàng và danh mục như trước.
4. Trong **Phân loại / SKU**, nhập SKU, giá và tồn kho của dòng đầu.
5. Bấm **+ Thêm SKU** để thêm dòng. Ví dụ:

   | SKU | Giá | Tồn kho |
   | --- | --- | --- |
   | `AO-DEN-M` | 150000 | 10 |
   | `AO-DEN-L` | 170000 | 5 |
   | `AO-TRANG-M` | 160000 | 2 |

6. Bấm **Lưu sản phẩm**. Sản phẩm mới/chỉnh sửa chuyển về nháp để admin duyệt.
7. Sau khi được duyệt, người mua chọn SKU trên trang chi tiết. Giá, số lượng
   có thể mua và mặt hàng trong giỏ đều theo đúng SKU được chọn.

Mã SKU là duy nhất trong toàn bộ hệ thống. Để trống lúc tạo để sinh mã tự động;
khi sửa mà để trống, hệ thống giữ mã cũ. Mỗi sản phẩm tối đa 32 SKU, tính cả
SKU đã ngừng bán.

Với dòng mới chưa lưu, dùng **Xóa dòng** để bỏ. Với SKU đã lưu, dùng **Ngừng bán**
hoặc trạng thái **Ngừng bán**, rồi lưu; có thể chọn **Bán lại** sau. Hệ thống giữ
ID cũ để không làm hỏng liên kết giỏ hàng/đơn trước đó. SKU ngừng bán không xuất
hiện trong danh sách lựa chọn của người mua. Giỏ cũ đánh dấu SKU đó không còn bán.

Tồn kho trên form là số lượng tổng của SKU. Nếu có hàng đang giữ chỗ, form hiển
thị số đang giữ và không cho giảm tổng xuống thấp hơn số đó. Tồn có thể mua là
tổng trừ hàng giữ chỗ. Giữ ít nhất một SKU đang bán; muốn ngừng toàn bộ sản phẩm,
dùng nút **Ẩn** ở danh sách sản phẩm.

## Cập nhật bản online

Mã nằm trên nhánh `codex/render-free-demo`. Sau khi cập nhật code, trong Render
chọn **Manual Deploy → Deploy latest commit** nếu dịch vụ chưa tự triển khai.
Khi trạng thái **Live**, tải lại trang seller, mở sản phẩm để thấy nút **+ Thêm SKU**.
Không cần chạy thêm SQL, import lại dữ liệu hoặc sửa database Aiven.

## API và tương thích

`POST /api/seller/products` và `PATCH /api/seller/products/:id` nhận:

```json
{
  "name": "Áo thun",
  "shopId": 1,
  "categoryId": 1,
  "variants": [
    {"sku": "AO-DEN-M", "price": 150000, "stock": 10, "status": "active"},
    {"sku": "AO-DEN-L", "price": 170000, "stock": 5, "status": "active"}
  ]
}
```

Khi sửa, giữ `id` của SKU hiện có trong từng dòng; dòng không có `id` tạo SKU mới.
Một SKU đang có nhưng không nằm trong danh sách gửi lên sẽ được ngừng bán.
API từ chối ID SKU của sản phẩm khác, danh sách rỗng, hơn 32 dòng, mã trùng,
giá/tồn kho không hợp lệ và tồn dưới số đã giữ chỗ. Lưu nhiều SKU trong một
transaction: lỗi ở một dòng không lưu dở những dòng còn lại.

Payload cũ với `price`, `stock`, `sku` cấp sản phẩm vẫn dùng được. Khi sửa theo
payload cũ, API sửa SKU đầu đang hoạt động và giữ các SKU khác. Giỏ hàng và API
chi tiết tiếp tục dùng `variant_id` sẵn có.

## Kiểm tra

`npm test` chạy unit tests, kiểm thử marketplace hiện có và kiểm thử nhiều SKU.
Riêng bộ mới: `npm run test:variants`. Các kiểm thử tích hợp cần
`TEST_DATABASE_URL` trỏ tới database thử nghiệm có tên kết thúc `_test` và schema
đã khởi tạo; không chạy trên database Aiven đang demo.
