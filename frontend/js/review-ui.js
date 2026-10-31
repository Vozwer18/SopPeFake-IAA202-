(() => {
  // Treat reviews and seller replies as plain text, including HTML-like input.
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function reply(value) {
    const box = node('div', null, 'seller-reply');
    box.append(node('b', 'Phản hồi của shop'), node('p', value.text));
    return box;
  }
  function form({ title, orders, initial = '', onSave, seller = false }) {
    const form = node('form', null, 'review-form');
    form.dataset.reviewComposer = seller ? 'seller' : 'customer';
    form.append(node('h3', title));
    function field(label, control) {
      const wrap = node('label', label);
      wrap.append(control); form.append(wrap); return control;
    }
    if (orders) {
      const select = field('Đơn hàng đã nhận', node('select'));
      select.name = 'orderId'; select.required = true;
      for (const order of orders) {
        const option = node('option', order.code); option.value = String(order.id); select.append(option);
      }
      const rating = field('Số sao', node('select')); rating.name = 'rating';
      for (let n = 5; n >= 1; n--) {
        const option = node('option', `${n} ★`); option.value = String(n); rating.append(option);
      }
    }
    const input = field(seller ? 'Nội dung phản hồi' : 'Nhận xét', node('textarea'));
    input.name = seller ? 'reply' : 'comment'; input.rows = 3; input.maxLength = 2000;
    input.required = seller; input.value = initial;
    const status = node('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const button = node('button', seller ? 'Lưu phản hồi' : 'Gửi đánh giá', 'btn btn-primary');
    button.type = 'submit'; form.append(button, status);
    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (busy) return;
      busy = true; button.disabled = true; status.textContent = 'Đang lưu…';
      try {
        await onSave(Object.fromEntries(new FormData(form)));
        status.textContent = seller ? 'Đã lưu phản hồi.' : 'Cảm ơn bạn đã đánh giá sản phẩm.';
      } catch (error) { status.textContent = error.message || 'Không thể lưu. Vui lòng thử lại.'; }
      finally { busy = false; button.disabled = false; }
    });
    return form;
  }
  function sellerCard(review) {
    const card = node('article', null, 'card seller-review-card'); card.dataset.reviewId = String(review.id);
    const link = node('a', review.productName); link.href = `product-detail.html?id=${encodeURIComponent(review.productId)}`;
    const heading = node('h3'); heading.append(link);
    card.append(heading, node('small', review.shop, 'muted'), node('p', `${review.userName} · ${review.rating}/5 ★`), node('p', review.comment || 'Người mua không để lại nhận xét.', 'review-comment'));
    const response = node('div'); if (review.sellerReply) response.append(reply(review.sellerReply));
    card.append(response, form({ title: 'Phản hồi người mua', seller: true, initial: review.sellerReply?.text || '', onSave: async data => {
      const result = await SopPe.api(`/api/seller/reviews/${review.id}/reply`, { method: 'PUT', body: JSON.stringify({ reply: data.reply }) });
      response.replaceChildren(reply(result.data.sellerReply));
    } }));
    return card;
  }
  window.ReviewUI = { node, reply, form, sellerCard };
})();
