(() => {
  const { api, esc, money, imageUrl } = SopPe;
  const list = document.getElementById('cart-list');
  const message = document.getElementById('cart-message');
  let items = [];
  async function loadCart() {
    try {
      const result = await api('/api/cart');
      items = result.data?.cart_items || [];
      let total = 0;
      list.innerHTML =
        items
          .map((item, index) => {
            const product = item.products || {};
            const variant = item.product_variants || {};
            const quantity = Number(item.quantity) || 0;
            const price = Number(variant.price ?? item.added_price) || 0;
            const image = imageUrl(item.image || variant.image);
            total += price * quantity;
            return `<article class="cart-item">${image ? `<img src="${esc(image)}" alt="${esc(product.name || 'Sản phẩm')}">` : '<div class="cart-img placeholder-img">SopPe</div>'}<div><h3><a href="product-detail.html?id=${encodeURIComponent(product.product_id || item.product_id)}">${esc(product.name || 'Sản phẩm')}</a></h3><b>${money(price)}</b><p class="muted">${esc(variant.sku || 'Mặc định')}</p>${!item.available ? '<p class="cart-warning">Sản phẩm đã ngừng bán. Bạn có thể xóa khỏi giỏ.</p>' : item.stock < quantity ? '<p class="cart-warning">Số lượng trong giỏ vượt tồn kho hiện tại (' + Number(item.stock) + ').</p>' : ''}<div class="qty"><button type="button" data-change="-1" data-index="${index}" ${quantity <= 1 || !item.available || !item.stock ? 'disabled' : ''} aria-label="Giảm số lượng">−</button><span>${quantity}</span><button type="button" data-change="1" data-index="${index}" ${!item.available || quantity >= Math.min(item.stock, 10000) ? 'disabled' : ''} aria-label="Tăng số lượng">+</button></div></div><button type="button" class="remove" data-remove="${index}">Xóa</button></article>`;
          })
          .join('') ||
        '<div class="empty"><h2>Giỏ hàng đang trống</h2><p>Khám phá sản phẩm và thêm những món bạn yêu thích.</p><a class="btn btn-primary" href="product-list.html">Xem sản phẩm</a></div>';
      document.getElementById('cart-total').textContent = money(total);
      list.querySelectorAll('[data-change]').forEach((button) =>
        button.addEventListener('click', () => {
          const item = items[Number(button.dataset.index)];
          const next = Number(item.quantity) + Number(button.dataset.change);
          const quantity =
            Number(button.dataset.change) < 0 ? Math.min(next, Number(item.stock)) : next;
          changeItem(item.cart_item_id, quantity);
        }),
      );
      list
        .querySelectorAll('[data-remove]')
        .forEach((button) =>
          button.addEventListener('click', () =>
            changeItem(items[Number(button.dataset.remove)].cart_item_id, 0),
          ),
        );
    } catch (error) {
      list.innerHTML = `<div class="empty" role="alert">${esc(error.message || 'Không thể tải giỏ hàng. Vui lòng thử lại.')}</div>`;
      document.getElementById('cart-total').textContent = '—';
      if (error.status === 401) location.href = 'login.html?next=%2Fcart.html';
    }
  }
  async function changeItem(id, quantity) {
    list.querySelectorAll('button').forEach((button) => (button.disabled = true));
    message.textContent = 'Đang cập nhật giỏ hàng…';
    try {
      await api(
        `/api/cart/item/${encodeURIComponent(id)}`,
        quantity <= 0
          ? { method: 'DELETE' }
          : { method: 'PUT', body: JSON.stringify({ quantity }) },
      );
      message.textContent =
        quantity <= 0 ? 'Đã xóa sản phẩm khỏi giỏ hàng.' : 'Đã cập nhật số lượng.';
      await loadCart();
      await refreshCartCount();
    } catch (error) {
      message.textContent = error.message || 'Không thể cập nhật giỏ hàng.';
      await loadCart();
    }
  }
  SopPe.mountNavbar();
  loadCart();
})();
