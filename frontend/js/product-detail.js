(() => {
  const {api, esc, money, imageUrl} = SopPe;
  const id = new URLSearchParams(location.search).get('id');
  const box = document.getElementById('product-detail');
  let product, selectedVariant, user = null;
  const validRating = value => Math.min(5, Math.max(0, Number(value) || 0));
  function photo(url, alt, extra = '') {
    const safe = imageUrl(url);
    return safe ? `<img src="${esc(safe)}" alt="${esc(alt)}" ${extra}>` : '';
  }
  function render() {
    const images = (product.images || []).filter(imageUrl);
    const customer = user?.role === 'customer';
    const stock = Math.max(0, Number(product.stock || 0));
    box.innerHTML = `<div class="product-detail-wrapper"><div class="product-gallery"><div class="main-image placeholder-img" id="main-image">${photo(images[0], product.name) || 'Chưa có ảnh sản phẩm'}</div><div class="thumbs">${images.map((url,index) => `<button type="button" class="thumb ${index === 0 ? 'active' : ''}" data-image="${index}" aria-label="Xem ảnh ${index + 1}">${photo(url, `Ảnh ${index + 1}`)}</button>`).join('')}</div></div><div class="product-info"><span class="badge">SopPe Fake Marketplace</span><h1>${esc(product.name)}</h1><div class="rating-line"><b>★ ${validRating(product.rating).toFixed(1)}</b><span>${Number(product.reviewCount || 0)} đánh giá</span><span>${Number(product.sold || 0)} đã bán</span></div><div class="price" id="price">${money(selectedVariant?.price ?? product.price)}</div><div class="info-row"><div class="info-label">Phân loại</div><div class="variants">${(product.variants || []).map((variant,index) => `<button type="button" class="variant-btn ${index === 0 ? 'active' : ''}" data-variant="${index}" aria-pressed="${index === 0}">${esc(variant.sku || 'Mặc định')}</button>`).join('') || '<span class="muted">Mặc định</span>'}</div></div><p class="muted">${stock} sản phẩm có sẵn</p>${customer ? `<div class="info-row"><label class="info-label" for="qty">Số lượng</label><div class="quantity-box"><button type="button" data-quantity="-1" aria-label="Giảm số lượng">−</button><input id="qty" type="number" value="1" min="1" max="${Math.max(1, stock)}" inputmode="numeric"><button type="button" data-quantity="1" aria-label="Tăng số lượng">+</button></div></div><div class="action-row"><button type="button" class="btn btn-primary" id="add-cart" ${!selectedVariant || !stock ? 'disabled' : ''}>Thêm vào giỏ hàng</button><a class="btn btn-outline" href="cart.html">Xem giỏ hàng</a></div><p id="cart-message" role="status" aria-live="polite"></p>` : `<div class="notice"><p>Bạn đang xem sản phẩm với quyền khách. Đăng nhập tài khoản người mua để sử dụng giỏ hàng.</p><a class="btn btn-primary" href="login.html?next=${encodeURIComponent(location.pathname + location.search)}">Đăng nhập</a></div>`}<div class="shop-card"><div class="shop-main"><div class="shop-logo">S</div><div><b>${esc(product.shop?.name || 'Cửa hàng')}</b><div class="muted">★ ${validRating(product.shop?.rating).toFixed(1)} · Cửa hàng trên SopPe Fake</div></div></div></div></div></div>`;
    box.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
      document.getElementById('main-image').innerHTML = photo(images[Number(button.dataset.image)], product.name);
      box.querySelectorAll('[data-image]').forEach(item => item.classList.toggle('active', item === button));
    }));
    box.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
      selectedVariant = product.variants[Number(button.dataset.variant)];
      document.getElementById('price').textContent = money(selectedVariant.price);
      box.querySelectorAll('[data-variant]').forEach(item => {
        item.classList.toggle('active', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
    }));
    box.querySelectorAll('[data-quantity]').forEach(button => button.addEventListener('click', () => {
      const input = document.getElementById('qty');
      input.value = Math.max(1, Math.min(stock, (Number(input.value) || 1) + Number(button.dataset.quantity)));
    }));
    document.getElementById('add-cart')?.addEventListener('click', addToCart);
  }
  async function addToCart() {
    const button = document.getElementById('add-cart');
    const message = document.getElementById('cart-message');
    const quantity = Number(document.getElementById('qty').value);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > Number(product.stock)) {
      message.textContent = 'Vui lòng chọn số lượng hợp lệ trong phạm vi tồn kho.';
      return;
    }
    button.disabled = true;
    message.textContent = 'Đang thêm vào giỏ…';
    try {
      await api('/api/cart', {method:'POST', body:JSON.stringify({product_id:Number(id), variant_id:selectedVariant.variant_id, quantity})});
      message.textContent = 'Đã thêm sản phẩm vào giỏ hàng.';
      await SopPe.mountNavbar();
    } catch (error) {
      message.textContent = error.message || 'Không thể thêm vào giỏ hàng.';
      if (error.status === 401) location.href = `login.html?next=${encodeURIComponent(location.pathname + location.search)}`;
    } finally { button.disabled = false; }
  }
  function renderReviews() {
    const reviews = product.reviews || [];
    document.getElementById('review-summary').textContent = `${reviews.length} đánh giá · ${validRating(product.rating).toFixed(1)}/5 sao`;
    document.getElementById('review-list').innerHTML = reviews.map(review => {
      const stars = Math.round(validRating(review.rating));
      const date = review.createdAt ? new Date(review.createdAt) : null;
      return `<article class="review-item"><div class="avatar">${esc(String(review.userName || 'U')[0])}</div><div><b>${esc(review.userName || 'Người mua')}</b><div class="stars" aria-label="${stars} trên 5 sao">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div><small class="muted">${date && !Number.isNaN(date.getTime()) ? esc(date.toLocaleDateString('vi-VN')) : ''}</small><p>${esc(review.comment || 'Người mua không để lại nhận xét.')}</p><div class="review-images">${(review.media || []).map(url => photo(url, 'Ảnh đánh giá', 'loading="lazy"')).join('')}</div></div></article>`;
    }).join('') || '<div class="empty">Chưa có đánh giá cho sản phẩm này.</div>';
  }
  async function init() {
    SopPe.mountNavbar();
    if (SopPe.isFileMode) {
      box.innerHTML = '<div class="empty card"><h2>Chi tiết sản phẩm cần kết nối máy chủ</h2><p>Bạn đang mở tệp HTML trực tiếp. Chạy <b>START-WINDOWS.cmd</b> trong thư mục dự án để xem dữ liệu sản phẩm.</p><a class="btn btn-primary" href="http://localhost:3000/product-list.html">Mở website đang chạy</a></div>';
      return;
    }
    if (!id || !/^\d+$/.test(id) || Number(id) < 1) {
      box.innerHTML = '<div class="empty card" role="alert">Đường dẫn sản phẩm không hợp lệ.</div>';
      return;
    }
    try {
      const [result, auth] = await Promise.all([api(`/api/products/${encodeURIComponent(id)}`), api('/api/auth/me').catch(() => null)]);
      product = result.data;
      user = auth?.data || null;
      selectedVariant = product.variants?.[0] || null;
      document.title = `${product.name} · SopPe Fake`;
      render();
      document.getElementById('product-description').textContent = product.description || 'Người bán chưa cập nhật mô tả.';
      document.getElementById('description-section').hidden = false;
      document.getElementById('reviews-section').hidden = false;
      renderReviews();
    } catch (error) { box.innerHTML = `<div class="empty card" role="alert">${esc(error.message || 'Không thể tải sản phẩm.')}</div>`; }
  }
  init();
})();
