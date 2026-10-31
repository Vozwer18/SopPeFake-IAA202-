(() => {
  const {
    api,
    esc,
    money,
    imageUrl,
    message,
    filesToData,
    statusLabel,
    openModal,
    closeModal,
    loadPanelSection,
  } = SopPe;
  let shops = [],
    users = [];
  const titles = {
    dashboard: 'Tổng quan hệ thống',
    users: 'Quản lý tài khoản',
    products: 'Kiểm duyệt sản phẩm',
    sellers: 'Quản lý nhà bán',
    shops: 'Quản lý cửa hàng',
    shipping: 'Vận chuyển',
  };
  document.querySelectorAll('.side-link[data-view]').forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll('.side-link[data-view]')
          .forEach((x) => x.classList.toggle('active', x === b));
        document
          .querySelectorAll('.panel-view')
          .forEach((p) => p.classList.toggle('active', p.id === 'view-' + b.dataset.view));
        document.getElementById('page-title').textContent = titles[b.dataset.view];
      }),
  );
  document.getElementById('logout').onclick = SopPe.logout;
  const status = (s) => `<span class="status ${esc(s)}">${esc(statusLabel(s))}</span>`;
  const select = (kind, id, items) =>
    `<select class="status-select" data-kind="${kind}" data-id="${id}" aria-label="Đổi trạng thái"><option value="">Đổi trạng thái</option>${items.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>`;
  const empty = (n, text) => `<tr><td colspan="${n}" class="empty">${text}</td></tr>`;
  async function overview() {
    const j = await api('/api/admin/overview');
    Object.entries(j.data || {}).forEach(([k, v]) => {
      const el = document.getElementById('a-' + k);
      if (el) el.textContent = v;
    });
  }
  async function loadUsers() {
    users = (await api('/api/admin/users')).data || [];
    document.getElementById('admin-users').innerHTML =
      users
        .map(
          (u) =>
            `<tr><td><b>${esc(u.full_name || u.username)}</b><small class="muted" style="display:block">@${esc(u.username)}</small></td><td>${esc(u.email)}</td><td><select class="role-select" data-id="${u.user_id}" aria-label="Vai trò của ${esc(u.username)}">${[
              ['customer', 'Người mua'],
              ['seller', 'Nhà bán'],
              ['admin', 'Quản trị viên'],
            ]
              .map(
                ([v, n]) => `<option value="${v}" ${u.role === v ? 'selected' : ''}>${n}</option>`,
              )
              .join('')}</select></td><td>${status(u.status)}</td><td>${select('users', u.user_id, [
              ['active', 'Hoạt động'],
              ['pending', 'Chờ duyệt'],
              ['blocked', 'Khóa tài khoản'],
            ])}</td></tr>`,
        )
        .join('') || empty(5, 'Chưa có tài khoản.');
  }
  async function loadProducts() {
    const items = (await api('/api/admin/products')).data || [];
    document.getElementById('admin-products').innerHTML =
      items
        .map(
          (p) =>
            `<tr><td><div class="product-mini">${p.image ? `<img src="${esc(imageUrl(p.image))}" alt="">` : '<span class="mini-placeholder">S</span>'}<b>${esc(p.name)}</b></div></td><td>${esc(p.shop || '')}</td><td>${money(p.price)}</td><td>${status(p.status)}</td><td><div class="actions"><button type="button" class="btn btn-outline" data-preview="${p.id}">Xem chi tiết</button>${select(
              'products',
              p.id,
              [
                ['active', 'Duyệt hiển thị'],
                ['draft', 'Chuyển về nháp'],
                ['hidden', 'Ẩn sản phẩm'],
                ['banned', 'Cấm sản phẩm'],
              ],
            )}<label class="btn btn-soft file-button">Thêm ảnh<input class="product-images visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple data-id="${p.id}"></label></div></td></tr>`,
        )
        .join('') || empty(5, 'Chưa có sản phẩm để kiểm duyệt.');
  }
  async function loadSellers() {
    const items = (await api('/api/admin/sellers')).data || [];
    document.getElementById('admin-sellers').innerHTML =
      items
        .map(
          (s) =>
            `<tr><td><b>${esc(s.seller_name || s.users?.full_name || 'Nhà bán')}</b></td><td>${esc(s.users?.email || '')}</td><td>${(s.shops || []).map((x) => esc(x.shop_name)).join(', ') || 'Chưa có cửa hàng'}</td><td>${status(s.status)}</td><td>${select(
              'sellers',
              s.seller_id,
              [
                ['active', 'Duyệt hoạt động'],
                ['pending', 'Chờ duyệt'],
                ['suspended', 'Tạm ngừng'],
              ],
            )}</td></tr>`,
        )
        .join('') || empty(5, 'Chưa có nhà bán đăng ký.');
  }
  async function loadShops() {
    shops = (await api('/api/admin/shops')).data || [];
    document.getElementById('admin-shops').innerHTML =
      shops
        .map(
          (s) =>
            `<tr><td><b>${esc(s.shop_name)}</b><small class="muted" style="display:block">${esc(s.description || '')}</small></td><td>${esc(s.sellers?.seller_name || s.seller_name || 'Nhà bán #' + s.seller_id)}</td><td>${status(s.status)}</td><td><div class="actions"><button class="btn btn-soft edit-shop" data-id="${s.shop_id}">Chỉnh sửa</button>${select(
              'shops',
              s.shop_id,
              [
                ['active', 'Hoạt động'],
                ['inactive', 'Tạm ngừng'],
                ['banned', 'Khóa cửa hàng'],
              ],
            )}</div></td></tr>`,
        )
        .join('') || empty(4, 'Chưa có cửa hàng.');
  }
  async function shipping() {
    const providers = (await api('/api/shipping/config')).data?.providers || [];
    document.getElementById('shipping-config').innerHTML =
      providers
        .map(
          (p) =>
            `<article class="card panel-card"><h3>${esc(p.name)}</h3><small class="muted">${esc(p.hotline || '')}</small>${(p.shipping_services || []).map((s) => `<div class="config-item"><h4>${esc(s.service_name || s.service_type)}</h4><small>Phí cơ bản ${money(s.base_fee)} · ${Number(s.estimated_days) || '—'} ngày</small>${(s.shipping_price_rules || []).map((r) => `<p>${esc(r.distance_level)} · ${Number(r.min_weight)}–${Number(r.max_weight)} kg · <b>${money(r.price)}</b></p>`).join('')}</div>`).join('')}</article>`,
        )
        .join('') || '<div class="empty card">Chưa có dịch vụ vận chuyển.</div>';
    document.getElementById('service-provider').innerHTML =
      '<option value="">Chọn đơn vị</option>' +
      providers.map((p) => `<option value="${p.provider_id}">${esc(p.name)}</option>`).join('');
    document.getElementById('rule-service').innerHTML =
      '<option value="">Chọn dịch vụ</option>' +
      providers
        .flatMap((p) =>
          (p.shipping_services || []).map(
            (s) =>
              `<option value="${s.service_id}">${esc(p.name)} · ${esc(s.service_name || s.service_type)}</option>`,
          ),
        )
        .join('');
  }
  const reloads = {
    users: loadUsers,
    products: loadProducts,
    sellers: loadSellers,
    shops: loadShops,
  };
  document.querySelector('.panel-content').addEventListener('change', async (e) => {
    if (e.target.matches('.status-select') && e.target.value) {
      const { kind, id } = e.target.dataset,
        value = e.target.value;
      if (!confirm('Xác nhận thay đổi trạng thái?')) {
        e.target.value = '';
        return;
      }
      try {
        await api(
          `/api/admin/${kind}/${id}${['products', 'sellers'].includes(kind) ? '/status' : ''}`,
          { method: 'PATCH', body: JSON.stringify({ status: value }) },
        );
        message('Đã cập nhật trạng thái.');
        await Promise.all([reloads[kind](), overview()]);
      } catch (err) {
        message(err.message, 'error');
        e.target.value = '';
      }
    }
    if (e.target.matches('.role-select')) {
      const user = users.find((u) => Number(u.user_id) === Number(e.target.dataset.id));
      if (!confirm('Xác nhận thay đổi vai trò tài khoản?')) {
        e.target.value = user.role;
        return;
      }
      try {
        await api(`/api/admin/users/${user.user_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ role: e.target.value }),
        });
        message('Đã cập nhật vai trò.');
        await Promise.all([loadUsers(), loadSellers()]);
      } catch (err) {
        e.target.value = user.role;
        message(err.message, 'error');
      }
    }
    if (e.target.matches('.product-images')) {
      try {
        const images = await filesToData(e.target.files);
        if (!images.length) return;
        await api(`/api/admin/products/${e.target.dataset.id}/images`, {
          method: 'POST',
          body: JSON.stringify({ images }),
        });
        message('Đã thêm ảnh.');
        await loadProducts();
      } catch (err) {
        message(err.message, 'error');
      }
    }
  });
  document.getElementById('new-user').onclick = () => {
    openModal(document.getElementById('user-modal'));
    document.getElementById('new-username').focus();
  };
  document.getElementById('admin-shops').onclick = (e) => {
    const b = e.target.closest('.edit-shop');
    if (!b) return;
    const s = shops.find((s) => Number(s.shop_id) === Number(b.dataset.id)),
      f = document.getElementById('shop-form');
    f.elements.shopId.value = s.shop_id;
    f.elements.shopName.value = s.shop_name;
    f.elements.description.value = s.description || '';
    openModal(document.getElementById('shop-modal'));
    f.elements.shopName.focus();
  };
  document
    .querySelectorAll('[data-close]')
    .forEach((b) => (b.onclick = () => closeModal(document.getElementById(b.dataset.close))));
  document.querySelectorAll('.modal').forEach(
    (m) =>
      (m.onclick = (e) => {
        if (e.target === m) closeModal(m);
      }),
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal').forEach((m) => closeModal(m));
  });

  let previewRequest = 0;
  document.getElementById('admin-products').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-preview]');
    if (!button) return;
    const request = ++previewRequest,
      node = document.getElementById('moderation-content');
    node.innerHTML = '<div class="empty">Đang tải sản phẩm…</div>';
    openModal(document.getElementById('moderation-modal'));
    try {
      const p = (await api('/api/admin/products/' + encodeURIComponent(button.dataset.preview)))
        .data;
      if (request !== previewRequest) return;
      node.innerHTML = `<h2>${esc(p.name)}</h2><p>${esc(p.shop)} · ${status(p.status)}</p><p class="muted">Danh mục: ${esc(p.categories.join(', ') || 'Chưa có danh mục')}</p><div class="moderation-images">${p.images.map((url) => (imageUrl(url) ? `<img src="${esc(imageUrl(url))}" alt="${esc(p.name)}">` : '')).join('') || '<p class="muted">Chưa có ảnh sản phẩm.</p>'}</div><h3>Mô tả</h3><p class="moderation-description">${esc(p.description || 'Chưa có mô tả.')}</p><div class="table-wrap" tabindex="0" role="region" aria-label="Phân loại sản phẩm"><table class="data-table"><thead><tr><th>SKU</th><th>Giá</th><th>Có thể bán</th><th>Trạng thái</th></tr></thead><tbody>${p.variants.map((v) => `<tr><td>${esc(v.sku || 'Mặc định')}</td><td>${money(v.price)}</td><td>${Number(v.stock)}</td><td>${status(v.status)}</td></tr>`).join('') || empty(4, 'Chưa có phân loại.')}</tbody></table></div>`;
    } catch (error) {
      if (request === previewRequest)
        node.innerHTML = `<div class="empty" role="alert">${esc(error.message)}</div>`;
    }
  });
  function bindForm(id, url, onSuccess) {
    document.getElementById(id).onsubmit = async (e) => {
      e.preventDefault();
      e.submitter.disabled = true;
      const body = Object.fromEntries(new FormData(e.target));
      try {
        const path = typeof url === 'function' ? url(body) : url;
        delete body.shopId;
        await api(path, {
          method: id === 'shop-form' ? 'PATCH' : 'POST',
          body: JSON.stringify(body),
        });
        e.target.reset();
        message('Đã lưu thay đổi.');
        await onSuccess();
      } catch (err) {
        message(err.message, 'error');
      } finally {
        e.submitter.disabled = false;
      }
    };
  }
  bindForm('user-form', '/api/admin/users', async () => {
    closeModal(document.getElementById('user-modal'));
    await Promise.all([loadUsers(), loadSellers(), overview()]);
  });
  bindForm(
    'shop-form',
    (b) => '/api/admin/shops/' + b.shopId,
    async () => {
      closeModal(document.getElementById('shop-modal'));
      await loadShops();
    },
  );
  bindForm('provider-form', '/api/admin/shipping/providers', shipping);
  bindForm('service-form', '/api/admin/shipping/services', shipping);
  bindForm('rule-form', '/api/admin/shipping/price-rules', shipping);
  Promise.allSettled([
    overview(),
    loadPanelSection('admin-users', loadUsers, 5),
    loadPanelSection('admin-products', loadProducts, 5),
    loadPanelSection('admin-sellers', loadSellers, 5),
    loadPanelSection('admin-shops', loadShops, 4),
    loadPanelSection('shipping-config', shipping),
  ]).then((results) =>
    results
      .filter((r) => r.status === 'rejected')
      .forEach((r) => {
        document.getElementById('panel-error').textContent = r.reason.message;
        if (r.reason.status === 401) location.href = 'login.html';
      }),
  );
})();
