(() => {
  const container = document.getElementById('customer-orders'), notice = document.getElementById('orders-message');
  let requestId = 0, focusOrder = new URLSearchParams(location.search).get('order');
  async function reload() {
    const current = ++requestId;
    document.getElementById('refresh-orders').disabled = true;
    try {
      const result = await SopPe.api('/api/orders');
      if (current !== requestId) return;
      container.innerHTML = result.data.length ? result.data.map(order => OrderUI.render(order)).join('') : '<div class="empty card"><h2>Chưa có đơn hàng</h2><p>Chọn sản phẩm trong giỏ và đặt hàng để thanh toán qua QR.</p><a class="btn btn-primary" href="cart.html">Mở giỏ hàng</a></div>';
      notice.textContent = '';
      if (focusOrder && /^\d+$/.test(focusOrder)) { document.getElementById('order-' + focusOrder)?.scrollIntoView({ block: 'start' }); focusOrder = null; }
    } catch (error) {
      notice.textContent = error.message;
      if (error.status === 401) location.href = 'login.html?next=%2Forders.html';
    } finally { if (current === requestId) document.getElementById('refresh-orders').disabled = false; }
  }
  OrderUI.bind(container, 'customer', reload, error => { notice.textContent = error.message; });
  document.getElementById('refresh-orders').onclick = reload;
  SopPe.mountNavbar(); reload();
})();
