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
    categories = [],
    products = [],
    images = [];
  const titles = {
    dashboard: 'Tổng quan',
    products: 'Quản lý sản phẩm',
    shops: 'Cửa hàng của bạn',
    categories: 'Danh mục sản phẩm',
    shipping: 'Dịch vụ vận chuyển',
  };
  function showView(view) {
    document
      .querySelectorAll('.side-link[data-view]')
      .forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    document
      .querySelectorAll('.panel-view')
      .forEach((p) => p.classList.toggle('active', p.id === 'view-' + view));
    document.getElementById('page-title').textContent = titles[view];
  }
  document
    .querySelectorAll('.side-link[data-view]')
    .forEach((b) => (b.onclick = () => showView(b.dataset.view)));
  document.getElementById('logout').onclick = SopPe.logout;
  const failure = (e) => {
    document.getElementById('panel-error').textContent = e.message;
    if (e.status === 401) location.href = 'login.html';
  };
  async function dashboard() {
    const j = await api('/api/seller/dashboard');
    document.getElementById('seller-name').textContent = j.data.seller.seller_name || 'Nhà bán';
    for (const k of ['products', 'orders', 'shops'])
      document.getElementById('s-' + k).textContent = j.data.stats[k] || 0;
    document.getElementById('s-revenue').textContent = money(j.data.stats.revenue);
  }
  async function loadProducts() {
    products = (await api('/api/seller/products')).data || [];
    document.getElementById('seller-products').innerHTML =
      products
        .map(
          (p) =>
            `<tr><td><div class="product-mini">${p.image ? `<img src="${esc(imageUrl(p.image))}" alt="">` : '<span class="mini-placeholder">S</span>'}<div><b>${esc(p.name)}</b><small class="muted">${esc(p.shop || '')} · ${Number(p.variantCount || 0)} SKU đang bán</small></div></div></td><td>${Number(p.maxPrice) > Number(p.price) ? `${money(p.price)} – ${money(p.maxPrice)}` : money(p.price)}</td><td>${Number(p.stock)}</td><td><span class="status ${esc(p.status)}">${esc(statusLabel(p.status))}</span></td><td><div class="actions"><button class="btn btn-soft edit-product" data-id="${p.id}">Sửa</button><button class="btn btn-outline visibility-product" data-id="${p.id}" data-status="${p.status === 'hidden' ? 'draft' : 'hidden'}">${p.status === 'hidden' ? 'Gửi duyệt' : 'Ẩn'}</button><label class="btn btn-outline file-button">Thêm ảnh<input data-id="${p.id}" type="file" accept="image/png,image/jpeg,image/webp" multiple class="visually-hidden upload-images"></label></div></td></tr>`,
        )
        .join('') ||
      '<tr><td colspan="5" class="empty">Chưa có sản phẩm. Thêm sản phẩm đầu tiên cho cửa hàng của bạn.</td></tr>';
  }
  async function loadShops() {
    shops = (await api('/api/seller/shops')).data || [];
    document.getElementById('seller-shops').innerHTML =
      shops
        .map(
          (s) =>
            `<article class="card panel-card"><div class="panel-head"><h3>${esc(s.shop_name)}</h3><span class="status ${esc(s.status)}">${esc(statusLabel(s.status))}</span></div><p class="muted">${esc(s.description || 'Chưa có giới thiệu cửa hàng.')}</p><button class="btn btn-soft edit-shop" data-id="${s.shop_id}">Chỉnh sửa cửa hàng</button></article>`,
        )
        .join('') ||
      '<div class="empty card">Bạn chưa có cửa hàng. Hãy tạo cửa hàng đầu tiên.</div>';
    document.getElementById('product-shop').innerHTML =
      '<option value="">Chọn cửa hàng</option>' +
      shops
        .filter((s) => s.status === 'active')
        .map((s) => `<option value="${s.shop_id}">${esc(s.shop_name)}</option>`)
        .join('');
  }
  async function loadCategories() {
    categories = (await api('/api/categories')).data || [];
    document.getElementById('seller-categories').innerHTML =
      categories
        .map(
          (c) =>
            `<article class="card panel-card"><h3>${esc(c.name)}</h3><p class="muted">${esc(c.description || '')}</p></article>`,
        )
        .join('') ||
      '<div class="empty card">Chưa có danh mục. Thêm danh mục đầu tiên ở bên cạnh.</div>';
    document.getElementById('product-category').innerHTML =
      '<option value="">Chọn danh mục</option>' +
      categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  }
  async function loadShipping() {
    const j = await api('/api/shipping/config');
    document.getElementById('seller-shipping').innerHTML =
      (j.data?.providers || [])
        .map(
          (p) =>
            `<article class="card panel-card"><h3>${esc(p.name)}</h3>${(p.shipping_services || []).map((s) => `<div class="config-item"><b>${esc(s.service_name || s.service_type)}</b><p class="muted">Phí cơ bản ${money(s.base_fee)} · Dự kiến ${Number(s.estimated_days) || '—'} ngày</p></div>`).join('')}</article>`,
        )
        .join('') || '<div class="empty card">Chưa có dịch vụ vận chuyển được cấu hình.</div>';
  }
  const modal = document.getElementById('product-modal'),
    form = document.getElementById('product-form');
  const variantList = document.getElementById('product-variants');
  let variantSerial = 0;
  function updateVariantCount() {
    const rows = [...variantList.querySelectorAll('.sku-row')];
    rows.forEach((row, index) => {
      const inactive = row.querySelector('[data-field="status"]').value === 'inactive';
      row.classList.toggle('sku-inactive', inactive);
      row.querySelector('legend').textContent = `SKU ${index + 1}`;
      const button = row.querySelector('[data-sku-action]');
      button.textContent = row.dataset.variantId ? (inactive ? 'Bán lại' : 'Ngừng bán') : 'Xóa dòng';
      button.setAttribute('aria-label', `${button.textContent} SKU ${index + 1}`);
    });
    const active = rows.filter(row => row.querySelector('[data-field="status"]').value === 'active').length;
    document.getElementById('sku-count').textContent = `${rows.length} SKU · ${active} đang bán`;
    document.getElementById('add-sku').disabled = rows.length >= 32;
  }
  function appendVariant(variant = {}) {
    const key = `sku-${++variantSerial}`, reserved = Number(variant.reserved || 0);
    variantList.insertAdjacentHTML('beforeend', `<fieldset class="sku-row" data-variant-id="${esc(variant.id || '')}"><legend>SKU</legend><div class="sku-fields"><div class="field sku-code"><label for="${key}-code">Mã SKU</label><input id="${key}-code" data-field="sku" maxlength="100" placeholder="Ví dụ AO-DEN-M; trống để tự tạo" value="${esc(variant.sku || '')}"></div><div class="field"><label for="${key}-price">Giá bán (₫)</label><input id="${key}-price" data-field="price" type="number" min="1" max="999999999999" step="1" required value="${esc(variant.price ?? '')}"></div><div class="field"><label for="${key}-stock">Tồn kho</label><input id="${key}-stock" data-field="stock" type="number" min="${reserved}" max="2147483647" step="1" required value="${esc(variant.stock ?? 0)}">${reserved ? `<small class="muted">Đang giữ chỗ: ${reserved}</small>` : ''}</div></div><div class="sku-actions"><label for="${key}-status">Trạng thái</label><select id="${key}-status" data-field="status"><option value="active" ${variant.status !== 'inactive' ? 'selected' : ''}>Đang bán</option><option value="inactive" ${variant.status === 'inactive' ? 'selected' : ''}>Ngừng bán</option></select><button class="btn btn-soft" type="button" data-sku-action></button></div></fieldset>`);
    updateVariantCount();
    return variantList.lastElementChild;
  }
  document.getElementById('add-sku').onclick = () => {
    if (variantList.children.length >= 32) return;
    appendVariant().querySelector('[data-field="sku"]').focus();
  };
  variantList.onchange = updateVariantCount;
  variantList.onclick = event => {
    const button = event.target.closest('[data-sku-action]');
    if (!button) return;
    const row = button.closest('.sku-row');
    if (row.dataset.variantId) {
      const status = row.querySelector('[data-field="status"]');
      status.value = status.value === 'active' ? 'inactive' : 'active';
    } else {
      if (variantList.children.length <= 1) { message('Sản phẩm cần ít nhất một SKU.', 'error'); return; }
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      next?.querySelector('[data-field="sku"]').focus();
    }
    updateVariantCount();
  };
  function openProduct(p) {
    form.reset();
    images = [];
    document.getElementById('seller-preview').innerHTML = '';
    document.getElementById('product-error').textContent = '';
    document.getElementById('product-modal-title').textContent = p
      ? 'Chỉnh sửa sản phẩm'
      : 'Thêm sản phẩm mới';
    document.getElementById('new-product-images').hidden = !!p;
    form.elements.productId.value = p?.id || '';
    form.elements.shopId.disabled = !!p;
    for (const key of ['name', 'description'])
      if (p && p[key] != null) form.elements[key].value = p[key];
    if (p) {
      form.elements.shopId.value =
        p.shopId || shops.find((s) => s.shop_name === p.shop)?.shop_id || '';
      form.elements.categoryId.value = p.categoryIds?.[0] || p.categories?.[0]?.id || '';
    }
    variantList.replaceChildren();
    const variants = p?.variants?.length ? p.variants : [{ id: p?.variantId, sku: p?.sku, price: p?.price ?? '', stock: p?.variantStock ?? p?.stock ?? 0 }];
    variants.forEach(appendVariant);
    openModal(modal);
    document.getElementById('product-name').focus();
  }
  document.querySelectorAll('.add-product').forEach(
    (b) =>
      (b.onclick = () => {
        if (!shops.some((s) => s.status === 'active')) {
          showView('shops');
          message('Tạo cửa hàng hoạt động trước khi thêm sản phẩm.', 'error');
          return;
        }
        if (!categories.length) {
          showView('categories');
          message('Thêm danh mục trước khi đăng sản phẩm.', 'error');
          return;
        }
        openProduct();
      }),
  );
  function close() {
    closeModal(modal);
  }
  document.getElementById('close-product').onclick = close;
  modal.onclick = (e) => {
    if (e.target === modal) close();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  document.getElementById('seller-images').onchange = async (e) => {
    try {
      images = await filesToData(e.target.files);
      document.getElementById('seller-preview').innerHTML = images
        .map((x) => `<img src="${esc(x.data)}" alt="Ảnh xem trước">`)
        .join('');
    } catch (err) {
      images = [];
      e.target.value = '';
      document.getElementById('seller-preview').innerHTML = '';
      message(err.message, 'error');
    }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form)),
      id = body.productId;
    delete body.productId;
    body.variants = [...variantList.querySelectorAll('.sku-row')].map(row => ({
      ...(row.dataset.variantId ? { id: row.dataset.variantId } : {}),
      sku: row.querySelector('[data-field="sku"]').value.trim(),
      price: row.querySelector('[data-field="price"]').value,
      stock: row.querySelector('[data-field="stock"]').value,
      status: row.querySelector('[data-field="status"]').value,
    }));
    if (!id) body.images = images;
    e.submitter.disabled = true;
    try {
      if (!body.variants.some(variant => variant.status === 'active')) throw new Error('Cần giữ ít nhất một SKU đang bán. Muốn ngừng cả sản phẩm, hãy chọn Ẩn.');
      const codes = body.variants.map(variant => variant.sku.toLowerCase()).filter(Boolean);
      if (new Set(codes).size !== codes.length) throw new Error('Các mã SKU không được trùng nhau.');
      await api('/api/seller/products' + (id ? '/' + id : ''), {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      close();
      message('Đã lưu sản phẩm để quản trị viên duyệt.');
      await Promise.all([loadProducts(), dashboard()]);
    } catch (err) {
      document.getElementById('product-error').textContent = err.message;
    } finally {
      e.submitter.disabled = false;
    }
  };
  document.getElementById('seller-products').onclick = async (e) => {
    const b = e.target.closest('.edit-product');
    if (b) openProduct(products.find((p) => Number(p.id) === Number(b.dataset.id)));
    const visibility = e.target.closest('.visibility-product');
    if (visibility) {
      try {
        await api(`/api/seller/products/${visibility.dataset.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: visibility.dataset.status }),
        });
        message('Đã cập nhật trạng thái sản phẩm.');
        await loadProducts();
      } catch (err) {
        message(err.message, 'error');
      }
    }
  };
  document.getElementById('seller-products').onchange = async (e) => {
    if (!e.target.matches('.upload-images')) return;
    try {
      const images = await filesToData(e.target.files);
      if (!images.length) return;
      await api(`/api/seller/products/${e.target.dataset.id}/images`, {
        method: 'POST',
        body: JSON.stringify({ images }),
      });
      message('Đã thêm ảnh. Sản phẩm đang chờ duyệt lại.');
      await loadProducts();
    } catch (err) {
      message(err.message, 'error');
    }
  };
  const shopForm = document.getElementById('shop-form');
  shopForm.onreset = () => {
    shopForm.elements.shopId.value = '';
    document.getElementById('shop-form-title').textContent = 'Tạo cửa hàng mới';
  };
  document.getElementById('seller-shops').onclick = (e) => {
    const b = e.target.closest('.edit-shop');
    if (!b) return;
    const s = shops.find((s) => Number(s.shop_id) === Number(b.dataset.id));
    shopForm.elements.shopId.value = s.shop_id;
    shopForm.elements.shopName.value = s.shop_name;
    shopForm.elements.description.value = s.description || '';
    document.getElementById('shop-form-title').textContent = 'Chỉnh sửa cửa hàng';
    shopForm.elements.shopName.focus();
  };
  shopForm.onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(shopForm)),
      id = body.shopId;
    delete body.shopId;
    e.submitter.disabled = true;
    try {
      await api('/api/seller/shops' + (id ? '/' + id : ''), {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      shopForm.reset();
      message('Đã lưu cửa hàng.');
      await Promise.all([loadShops(), dashboard()]);
    } catch (err) {
      message(err.message, 'error');
    } finally {
      e.submitter.disabled = false;
    }
  };
  document.getElementById('category-form').onsubmit = async (e) => {
    e.preventDefault();
    e.submitter.disabled = true;
    try {
      await api('/api/categories', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });
      e.target.reset();
      message('Đã thêm danh mục.');
      await loadCategories();
    } catch (err) {
      message(err.message, 'error');
    } finally {
      e.submitter.disabled = false;
    }
  };
  Promise.allSettled([
    dashboard(),
    loadPanelSection('seller-products', loadProducts, 5),
    loadPanelSection('seller-shops', loadShops),
    loadPanelSection('seller-categories', loadCategories),
    loadPanelSection('seller-shipping', loadShipping),
  ]).then((results) =>
    results.filter((r) => r.status === 'rejected').forEach((r) => failure(r.reason)),
  );
})();
