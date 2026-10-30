(() => {
  if (SopPe.isFileMode) return;
  const {api, esc, money, imageUrl} = SopPe;
  const list = document.getElementById('cart-list');
  const message = document.getElementById('cart-message');
  let items = [], checkoutBusy = false;
  const checkoutSection = document.getElementById('checkout-section');
  const checkoutButton = document.getElementById('checkout-btn');
  async function loadCart() {
    try {
      const result = await api('/api/cart');
      items = result.data?.cart_items || [];
      let total = 0;
      list.innerHTML = items.map((item,index) => {
        const product = item.products || {};
        const variant = item.product_variants || {};
        const quantity = Number(item.quantity) || 0;
        const price = Number(variant.price ?? item.added_price) || 0;
        const image = imageUrl(variant.image);
        total += price * quantity;
        return `<article class="cart-item">${image ? `<img src="${esc(image)}" alt="${esc(product.name || 'Sản phẩm')}">` : '<div class="cart-img placeholder-img">SopPe</div>'}<div><h3><a href="product-detail.html?id=${encodeURIComponent(product.product_id || item.product_id)}">${esc(product.name || 'Sản phẩm')}</a></h3><b>${money(price)}</b><p class="muted">${esc(variant.sku || 'Mặc định')}</p><div class="qty"><button type="button" data-change="-1" data-index="${index}" aria-label="Giảm số lượng">−</button><span>${quantity}</span><button type="button" data-change="1" data-index="${index}" aria-label="Tăng số lượng">+</button></div></div><button type="button" class="remove" data-remove="${index}">Xóa</button></article>`;
      }).join('') || '<div class="empty"><h2>Giỏ hàng đang trống</h2><p>Khám phá sản phẩm và thêm những món bạn yêu thích.</p><a class="btn btn-primary" href="product-list.html">Xem sản phẩm</a></div>';
      document.getElementById('cart-total').textContent = money(total);
      checkoutSection.hidden = items.length === 0;
      checkoutButton.disabled = !items.length || checkoutBusy;
      list.querySelectorAll('[data-change]').forEach(button => button.addEventListener('click', () => {
        const item = items[Number(button.dataset.index)];
        const quantity = Number(item.quantity) + Number(button.dataset.change);
        changeItem(item.cart_item_id, quantity);
      }));
      list.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => changeItem(items[Number(button.dataset.remove)].cart_item_id, 0)));
    } catch (error) {
      list.innerHTML = `<div class="empty" role="alert">${esc(error.message || 'Không thể tải giỏ hàng. Vui lòng thử lại.')}</div>`;
      document.getElementById('cart-total').textContent = '—';
      checkoutSection.hidden = true;
      checkoutButton.disabled = true;
      if (error.status === 401) location.href = 'login.html?next=%2Fcart.html';
    }
  }
  async function changeItem(id, quantity) {
    if (checkoutBusy) return;
    checkoutButton.disabled = true;
    list.querySelectorAll('button').forEach(button => button.disabled = true);
    message.textContent = 'Đang cập nhật giỏ hàng…';
    try {
      await api(`/api/cart/item/${encodeURIComponent(id)}`, quantity <= 0 ? {method:'DELETE'} : {method:'PUT', body:JSON.stringify({quantity})});
      message.textContent = quantity <= 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng.' : 'Đã cập nhật số lượng.';
      await loadCart();
      await SopPe.mountNavbar();
    } catch (error) {
      message.textContent = error.message || 'Không thể cập nhật giỏ hàng.';
      list.querySelectorAll('button').forEach(button => button.disabled = false);
      checkoutButton.disabled = !items.length;
    }
  }
  document.getElementById('checkout-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (checkoutBusy || !items.length) return;
    const status = document.getElementById('checkout-message');
    checkoutBusy = true;
    checkoutButton.disabled = true;
    list.querySelectorAll('button').forEach(button => button.disabled = true);
    status.textContent = 'Đang xác nhận đơn hàng…';
    try {
      const body = Object.fromEntries(new FormData(event.target));
      const result = await api('/api/orders', {method:'POST', body:JSON.stringify(body)});
      const orders = Array.isArray(result.data) ? result.data : [];
      const success = document.getElementById('checkout-success');
      success.innerHTML = `<h2>Đặt hàng thành công</h2><p>Đơn hàng của bạn đã được gửi đến cửa hàng. Bạn sẽ thanh toán khi nhận hàng.</p>${orders.map(order => `<p><b>${esc(order.code || 'Đơn #' + order.id)}</b> · Tổng tiền: ${money(order.total)}</p>`).join('')}<a class="btn btn-primary" href="user-panel.html">Theo dõi đơn hàng của bạn</a>`;
      success.hidden = false;
      event.target.reset();
      status.textContent = '';
      await loadCart();
      await SopPe.mountNavbar();
      success.scrollIntoView({behavior:'smooth', block:'center'});
    } catch (error) {
      status.textContent = error.message || 'Không thể đặt hàng. Vui lòng kiểm tra giỏ hàng và thử lại.';
      if (error.status === 401) location.href = 'login.html?next=%2Fcart.html';
    } finally {
      checkoutBusy = false;
      checkoutButton.disabled = !items.length;
      list.querySelectorAll('button').forEach(button => button.disabled = false);
    }
  });
  SopPe.mountNavbar();
  loadCart();
})();
