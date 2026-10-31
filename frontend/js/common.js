/* Shared same-origin client. Business permissions are enforced by the API. */
(() => {
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const money = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      Number(value || 0),
    );
  const imageUrl = (value) => {
    try {
      const url = new URL(value || '', location.origin);
      return value && ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const fallbackImage =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#edf5ff"/><path d="M120 150h160v120H120z M120 250l50-50 40 40 30-30 40 40" fill="none" stroke="#62748d" stroke-width="8"/><circle cx="245" cy="180" r="12" fill="#62748d"/></svg>',
    );
  document.addEventListener(
    'error',
    (event) => {
      const image = event.target;
      if (image instanceof HTMLImageElement && !image.dataset.fallback) {
        image.dataset.fallback = 'true';
        image.src = fallbackImage;
      }
    },
    true,
  );
  const localPreview = location.protocol === 'file:';
  const previewMessage = 'Bạn đang xem file HTML trực tiếp. Hãy chạy backend và mở http://localhost:3000 để tải dữ liệu và sử dụng chức năng này.';
  if (localPreview) {
    const notice = document.createElement('aside');
    notice.className = 'notice local-preview-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = previewMessage + ' ';
    const link = document.createElement('a');
    link.href = 'http://localhost:3000';
    link.textContent = 'Mở SopPe Fake trên server →';
    notice.append(link);
    document.body.prepend(notice);
  }
  async function api(path, options = {}) {
    if (localPreview) throw new Error(previewMessage);
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: options.body
        ? { 'Content-Type': 'application/json', ...options.headers }
        : options.headers,
    });
    const result = await response
      .json()
      .catch(() => ({ message: 'Phản hồi từ máy chủ không hợp lệ.' }));
    if (!response.ok || result.success === false) {
      const error = new Error(result.message || 'Không thể hoàn tất yêu cầu.');
      error.status = response.status;
      throw error;
    }
    return result;
  }
  const statusLabel = (status) =>
    ({
      active: 'Hoạt động',
      visible: 'Hiển thị',
      draft: 'Chờ duyệt',
      pending: 'Chờ duyệt',
      hidden: 'Đã ẩn',
      banned: 'Đã khóa',
      blocked: 'Đã khóa',
      suspended: 'Tạm ngừng',
      inactive: 'Tạm ngừng',
    })[status] ||
    status ||
    'Chưa cập nhật';
  function openModal(modal) {
    modal.returnFocus = document.activeElement;
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    modal
      .querySelector('input:not([type="hidden"]):not(:disabled),button,select,textarea')
      ?.focus();
  }
  function closeModal(modal) {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
    if (modal.returnFocus?.isConnected) modal.returnFocus.focus();
  }
  document.addEventListener('keydown', (event) => {
    const modal = document.querySelector('.modal.open');
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal);
    }
    if (event.key !== 'Tab') return;
    const items = [
      ...modal.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]'),
    ].filter((el) => !el.disabled && el.getClientRects().length);
    const first = items[0],
      last = items.at(-1);
    if (
      event.shiftKey &&
      (document.activeElement === first || !modal.contains(document.activeElement))
    ) {
      event.preventDefault();
      last?.focus();
    }
    if (
      !event.shiftKey &&
      (document.activeElement === last || !modal.contains(document.activeElement))
    ) {
      event.preventDefault();
      first?.focus();
    }
  });
  async function loadPanelSection(targetId, loader, columns) {
    const target = document.getElementById(targetId);
    const content = (text) =>
      columns
        ? `<tr><td colspan="${columns}" class="empty">${text}</td></tr>`
        : `<div class="empty card">${text}</div>`;
    target.innerHTML = content('Đang tải…');
    try {
      await loader();
    } catch (error) {
      if (error.status === 401) {
        location.href = 'login.html';
        return;
      }
      target.innerHTML = content(
        `<div role="alert">${esc(error.message)}</div><button class="btn btn-outline" type="button">Thử lại</button>`,
      );
      target.querySelector('button').onclick = () => loadPanelSection(targetId, loader, columns);
    }
  }
  function message(text, kind = 'success') {
    let box = document.getElementById('page-message');
    if (!box) {
      box = document.createElement('div');
      box.id = 'page-message';
      box.setAttribute('role', 'status');
      document.body.append(box);
    }
    box.className = `toast ${kind}`;
    box.textContent = text;
    box.hidden = false;
    clearTimeout(message.timer);
    message.timer = setTimeout(() => {
      box.hidden = true;
    }, 6000);
  }
  function productCard(p) {
    const image = imageUrl(p.image);
    return `<a class="home-product product-card card" href="product-detail.html?id=${encodeURIComponent(p.id)}"><div class="pic product-image placeholder-img">${image ? `<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy">` : '<span>Chưa có ảnh</span>'}</div><div class="body product-body"><h3>${esc(p.name)}</h3><div class="price product-price">${Number(p.maxPrice) > Number(p.price) ? 'Từ ' : ''}${money(p.price)}</div><div class="meta"><span>${esc(p.shop || '')}</span><span>Đã bán ${Number(p.sold || 0)}</span></div></div></a>`;
  }
  async function filesToData(files) {
    const list = [...files];
    if (list.length > 8) throw new Error('Chọn tối đa 8 ảnh.');
    if (
      list.some(
        (f) => !['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 1024 * 1024,
      )
    )
      throw new Error('Ảnh phải là PNG/JPG/WebP và không quá 1 MB mỗi ảnh.');
    return Promise.all(
      list.map(
        (f) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: f.name, data: reader.result });
            reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
            reader.readAsDataURL(f);
          }),
      ),
    );
  }
  async function mountNavbar() {
    const node = document.getElementById('navbar');
    if (!node) return null;
    try {
      if (!node.querySelector('#global-search')) {
        const response = await fetch('components/navbar.html');
        if (!response.ok) throw new Error('Không thể tải thanh điều hướng.');
        node.innerHTML = await response.text();
      }
    } catch (error) {
      node.innerHTML =
        '<nav class="container notice"><a href="index.html">Trang chủ</a> · <a href="product-list.html">Sản phẩm</a> · <a href="login.html">Tài khoản</a></nav>';
      message(error.message, 'error');
      return null;
    }
    if (localPreview) {
      document.getElementById('global-search').onsubmit = event => {
        event.preventDefault();
        location.href = 'product-list.html?q=' + encodeURIComponent(document.getElementById('search-input').value.trim());
      };
      return null;
    }
    let user = null;
    try {
      user = (await api('/api/auth/me')).data;
    } catch (e) {
      if (e.status !== 401) message('Chưa tải được thông tin phiên đăng nhập.', 'error');
    }
    window.currentUser = user;
    const account = document.getElementById('nav-account');
    if (user) {
      const panel =
        user.role === 'admin'
          ? 'admin-panel.html'
          : user.role === 'seller'
            ? 'seller-panel.html'
            : 'user-panel.html';
      account.innerHTML = `<a href="${panel}">${esc(user.fullName || user.username)}</a><button class="text-button" id="logout-link">Đăng xuất</button>`;
      document.getElementById('logout-link').onclick = logout;
    }
    document.getElementById('cart-link').hidden = user?.role !== 'customer';
    document.getElementById('browse-mode').textContent = user
      ? 'Khám phá sản phẩm từ các cửa hàng'
      : 'Guest panel · Xem sản phẩm';
    document.getElementById('global-search').onsubmit = (e) => {
      e.preventDefault();
      location.href =
        'product-list.html?q=' +
        encodeURIComponent(document.getElementById('search-input').value.trim());
    };
    document.getElementById('search-input').value =
      new URLSearchParams(location.search).get('q') || '';
    try {
      const categories = (await api('/api/categories')).data || [];
      document.getElementById('nav-categories').innerHTML = categories
        .map(
          (c) =>
            `<a href="product-list.html?categoryId=${encodeURIComponent(c.id)}">${esc(c.name)}</a>`,
        )
        .join('');
    } catch {
      document.getElementById('nav-categories').textContent = '';
    }
    if (user?.role === 'customer') await refreshCartCount();
    return user;
  }
  async function refreshCartCount() {
    try {
      const j = await api('/api/cart');
      const count = (j.data?.cart_items || []).reduce((n, i) => n + Number(i.quantity || 0), 0);
      const el = document.getElementById('cart-count');
      if (el) el.textContent = count;
    } catch {}
  }
  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      location.href = 'guest-panel.html';
    } catch (e) {
      message(e.message, 'error');
    }
  }
  window.SopPe = {
    esc,
    money,
    imageUrl,
    api,
    message,
    productCard,
    filesToData,
    mountNavbar,
    logout,
    statusLabel,
    openModal,
    closeModal,
    loadPanelSection,
  };
  window.refreshCartCount = refreshCartCount;
})();
