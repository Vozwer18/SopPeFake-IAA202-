(() => {
  const { api, esc, money, imageUrl, message } = SopPe;
  const labels = { pending: 'Chờ xác nhận thanh toán', confirmed: 'Đã nhận thanh toán', packing: 'Đang chuẩn bị hàng', shipping: 'Hàng đã gửi', completed: 'Đã nhận hàng', cancelled: 'Đã hủy', refund: 'Hoàn tiền' };
  function render(order, role = 'customer') {
    const address = order.address, qr = imageUrl(order.qrUrl), paid = order.paymentStatus === 'paid';
    const button = (action, text, confirmText) => `<button type="button" class="btn ${action === 'cancel' ? 'btn-outline' : 'btn-primary'}" data-order-action="${action}" data-order-id="${order.id}" data-confirm="${esc(confirmText)}">${text}</button>`;
    let actions = '';
    if (role === 'seller') {
      if (order.canConfirmPayment) actions += button('paid', 'Đã nhận thanh toán', `Xác nhận bạn đã nhận đủ ${money(order.total)} cho đơn ${order.code}?`);
      if (order.canShip) actions += button('shipped', 'Hàng đã gửi', 'Xác nhận bạn đã gửi hàng cho người mua?');
    } else {
      if (order.canReceive) actions += button('received', 'Đã nhận hàng', 'Bạn đã nhận được hàng? Xác nhận này sẽ mở quyền đánh giá.');
      if (order.canCancel) actions += button('cancel', 'Hủy đơn chưa thanh toán', 'Hủy đơn này? Chỉ hủy khi bạn chưa chuyển tiền cho shop.');
    }
    const products = [...new Map(order.items.map(item => [item.productId, item])).values()];
    const reviews = role === 'customer' ? products.map(item => item.review
      ? `<div class="order-review"><b>Đánh giá của bạn · ${item.review.rating}/5 ★</b><p>${esc(item.review.comment || '')}</p></div>`
      : item.canReview ? `<form class="order-review review-form" data-review data-order-id="${order.id}" data-product-id="${item.productId}"><h3>Đánh giá ${esc(item.name)}</h3><label>Số sao<select name="rating" required><option value="5">5 ★ — Rất hài lòng</option><option value="4">4 ★ — Hài lòng</option><option value="3">3 ★ — Bình thường</option><option value="2">2 ★ — Chưa hài lòng</option><option value="1">1 ★ — Không hài lòng</option></select></label><label>Nhận xét<textarea name="comment" maxlength="2000" rows="3" placeholder="Chia sẻ trải nghiệm nhận hàng của bạn"></textarea></label><button class="btn btn-primary">Gửi đánh giá</button></form>` : '').join('') : '';
    return `<article class="card order-card" id="order-${order.id}"><header class="order-head"><div><span class="eyebrow">${esc(order.shop)}</span><h2>${esc(order.code)}</h2><small class="muted">${esc(new Date(order.createdAt).toLocaleString('vi-VN'))}</small></div><span class="status ${esc(order.status)}">${esc(labels[order.status] || order.status)}</span></header><div class="order-items">${order.items.map(item => `<div class="order-item"><div><b>${esc(item.name)}</b><small>${esc(item.sku || 'Mặc định')} · ${item.quantity} × ${money(item.price)}</small></div><strong>${money(item.subtotal)}</strong></div>`).join('')}</div><div class="order-total"><span>Phí vận chuyển: ${money(order.shippingFee)}</span><strong>Tổng: ${money(order.total)}</strong></div><div class="order-address"><b>Người nhận: ${esc(address.name)} · ${esc(address.phone)}</b><p>${esc([address.detail, address.ward, address.district, address.province].filter(Boolean).join(', '))}</p>${order.note ? `<p>Ghi chú: ${esc(order.note)}</p>` : ''}</div><p class="order-payment-status">Thanh toán: <b>${paid ? 'Shop đã xác nhận nhận tiền' : order.status === 'cancelled' ? 'Đơn đã hủy' : 'Chờ shop xác nhận nhận tiền'}</b></p>${role === 'customer' && order.status === 'pending' && !paid && qr ? `<div class="qr-payment"><a href="${esc(qr)}" target="_blank" rel="noopener"><img src="${esc(qr)}" alt="QR thanh toán của ${esc(order.shop)}"></a><div><h3>Chuyển khoản cho shop</h3><p>Số tiền: <strong>${money(order.total)}</strong></p><p>Nội dung: <code>${esc(order.code)}</code></p><p class="muted">Quét QR bằng ứng dụng ngân hàng và ghi đúng mã đơn. Người bán sẽ xác nhận sau khi nhận đủ tiền.</p><a href="${esc(qr)}" target="_blank" rel="noopener">Mở ảnh QR lớn hơn ↗</a></div></div>` : ''}${actions ? `<div class="actions order-actions">${actions}</div>` : ''}${reviews}</article>`;
  }
  function bind(container, role, reload, failure = error => message(error.message, 'error')) {
    container.addEventListener('click', async event => {
      const button = event.target.closest('[data-order-action]');
      if (!button || button.disabled) return;
      if (!confirm(button.dataset.confirm)) return;
      button.disabled = true;
      try {
        await api(`${role === 'seller' ? '/api/seller/orders' : '/api/orders'}/${button.dataset.orderId}/${button.dataset.orderAction}`, { method: 'POST' });
        message('Đã cập nhật đơn hàng.'); await reload();
      } catch (error) { failure(error); } finally { button.disabled = false; }
    });
    container.addEventListener('submit', async event => {
      const form = event.target.closest('[data-review]');
      if (!form || role !== 'customer') return;
      event.preventDefault();
      const button = event.submitter;
      if (button.disabled) return;
      button.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form));
        await api(`/api/orders/${form.dataset.orderId}/reviews`, { method: 'POST', body: JSON.stringify({ ...data, productId: form.dataset.productId }) });
        message('Cảm ơn bạn đã đánh giá sản phẩm.'); await reload();
      } catch (error) { failure(error); } finally { button.disabled = false; }
    });
  }
  window.OrderUI = { render, bind };
})();
