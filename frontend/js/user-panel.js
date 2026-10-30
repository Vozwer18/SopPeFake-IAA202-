(async () => {
  if (SopPe.isFileMode) return;
  const {api, esc, money} = SopPe;
  SopPe.mountNavbar();
  const message = document.getElementById('user-message');
  const orderBox = document.getElementById('user-orders');
  const refreshOrders = document.getElementById('refresh-orders');
  const statusNames = {pending:'Chờ xác nhận',confirmed:'Đã xác nhận',processing:'Đang chuẩn bị',packing:'Đang đóng gói',shipping:'Đang giao hàng',delivered:'Đã giao hàng',completed:'Hoàn thành',cancelled:'Đã hủy',canceled:'Đã hủy',returned:'Đã hoàn trả'};
  function orderDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN'); }
  async function loadOrders() {
    refreshOrders.disabled = true;
    orderBox.innerHTML = '<div class="empty">Đang tải đơn hàng…</div>';
    try {
      const orders = (await api('/api/orders')).data || [];
      document.getElementById('user-order-count').textContent = orders.length;
      document.getElementById('user-order-pending').textContent = orders.filter(order => order.status === 'pending').length;
      orderBox.innerHTML = orders.map(order => {
        const address = order.address || {};
        return `<article class="order-card" data-order-id="${esc(order.id)}" data-order-status="${esc(order.status)}" style="border:1px solid var(--line);border-radius:12px;padding:20px;margin-top:16px"><div class="section-title" style="align-items:flex-start;flex-wrap:wrap;margin-bottom:12px"><div><b>${esc(order.code || 'Đơn #' + order.id)}</b><p class="muted" style="margin:5px 0;font-size:12px">${esc(order.shopName || 'Cửa hàng')} · ${esc(orderDate(order.createdAt))}</p></div><span class="badge">${esc(statusNames[order.status] || order.status)}</span></div>${(order.items || []).map(item => `<div style="display:flex;gap:16px;justify-content:space-between;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--line)"><div><b>${esc(item.name)}</b><small class="muted" style="display:block">${esc(item.sku || '')} · Số lượng: ${Number(item.quantity)}</small></div><span>${money(item.subtotal ?? Number(item.price) * Number(item.quantity))}</span></div>`).join('')}<div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:14px"><div class="muted" style="font-size:12px">Thanh toán khi nhận hàng (COD)<br>Phí vận chuyển: ${money(order.shippingFee)}</div><b>Tổng tiền: ${money(order.total)}</b></div><details style="margin-top:15px;font-size:13px"><summary style="cursor:pointer;color:var(--primary)">Thông tin giao hàng</summary><p>${esc(address.receiverName || '')} · ${esc(address.receiverPhone || '')}</p><p>${[address.detailAddress,address.ward,address.district,address.province].filter(Boolean).map(esc).join(', ')}</p>${order.note ? `<p>Ghi chú: ${esc(order.note)}</p>` : ''}</details>${order.status === 'pending' ? `<button class="btn btn-outline" type="button" data-cancel-order="${esc(order.id)}" style="margin-top:16px">Hủy đơn hàng</button>` : ''}</article>`;
      }).join('') || '<div class="empty"><h3>Bạn chưa có đơn hàng</h3><p>Khám phá sản phẩm và đặt đơn hàng đầu tiên của bạn.</p><a class="btn btn-primary" href="product-list.html">Xem sản phẩm</a></div>';
    } catch (error) {
      document.getElementById('user-order-count').textContent = '—';
      document.getElementById('user-order-pending').textContent = '—';
      orderBox.innerHTML = `<div class="empty" role="alert">${esc(error.message || 'Chưa thể tải lịch sử đơn hàng.')}<p>Bấm Tải lại để thử lại.</p></div>`;
    } finally { refreshOrders.disabled = false; }
  }
  refreshOrders.addEventListener('click', loadOrders);
  orderBox.addEventListener('click', async event => {
    const button = event.target.closest('[data-cancel-order]');
    if (!button || !confirm('Bạn có chắc muốn hủy đơn hàng đang chờ xác nhận này?')) return;
    button.disabled = true;
    try {
      await api(`/api/orders/${encodeURIComponent(button.dataset.cancelOrder)}/cancel`, {method:'PATCH'});
      message.textContent = 'Đã hủy đơn hàng.';
      await loadOrders();
    } catch (error) { message.textContent = error.message || 'Không thể hủy đơn hàng.'; button.disabled = false; }
  });

  try {
    const auth = await api('/api/auth/me');
    const user = auth.data;
    if (user.role !== 'customer') {
      location.href = user.role === 'admin' ? 'admin-panel.html' : 'seller-panel.html';
      return;
    }
    document.getElementById('user-heading').textContent = `Xin chào, ${user.fullName || user.username}`;
    await loadOrders();
    document.getElementById('user-profile').innerHTML = [['Tên hiển thị',user.fullName || user.username],['Tên đăng nhập',user.username],['Email',user.email]].map(([label,value]) => `<div style="display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--line)"><dt class="muted">${esc(label)}</dt><dd style="margin:0;overflow-wrap:anywhere">${esc(value || 'Chưa cập nhật')}</dd></div>`).join('');
    try {
      const result = await api('/api/cart');
      const items = result.data?.cart_items || [];
      document.getElementById('user-cart-count').textContent = items.reduce((sum,item) => sum + Number(item.quantity || 0),0);
      document.getElementById('user-cart-total').textContent = money(items.reduce((sum,item) => sum + Number(item.product_variants?.price ?? item.added_price ?? 0) * Number(item.quantity || 0),0));
    } catch (error) { message.textContent = 'Thông tin tài khoản đã tải. Chưa thể tải tóm tắt giỏ hàng; bạn có thể thử lại trong mục Giỏ hàng.'; }
  } catch (error) {
    document.getElementById('user-profile').textContent = 'Chưa thể tải thông tin tài khoản.';
    message.textContent = error.message || 'Vui lòng đăng nhập để tiếp tục.';
    if (error.status === 401) location.href = 'login.html?next=%2Fuser-panel.html';
  }
})();
