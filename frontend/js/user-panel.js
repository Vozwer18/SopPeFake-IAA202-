(async () => {
  const {api, esc, money} = SopPe;
  SopPe.mountNavbar();
  const message = document.getElementById('user-message');
  try {
    const auth = await api('/api/auth/me');
    const user = auth.data;
    if (user.role !== 'customer') {
      location.href = user.role === 'admin' ? 'admin-panel.html' : 'seller-panel.html';
      return;
    }
    document.getElementById('user-heading').textContent = `Xin chào, ${user.fullName || user.username}`;
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
