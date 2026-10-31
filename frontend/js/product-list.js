(() => {
  const { api, esc, money, imageUrl } = SopPe;
  const params = new URLSearchParams(location.search);
  const search = document.getElementById('local-search');
  const category = document.getElementById('category-filter');
  const sort = document.getElementById('sort');
  const list = document.getElementById('product-list');
  let products = [],
    requestId = 0;
  let pendingRequest;
  if ([...sort.options].some((option) => option.value === params.get('sort')))
    sort.value = params.get('sort');
  search.value = params.get('q') || '';
  document.getElementById('filter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    loadProducts();
  });
  category.addEventListener('change', loadProducts);
  sort.addEventListener('change', () => {
    // Sorting applies to the submitted search, not a keyword still being typed.
    const query = new URLSearchParams(location.search);
    if (sort.value === 'default') query.delete('sort');
    else query.set('sort', sort.value);
    history.replaceState(null, '', `${location.pathname}${query.size ? '?' + query : ''}`);
    if (list.getAttribute('aria-busy') === 'false' && !list.querySelector('#retry-products'))
      render();
  });
  document.getElementById('reset-filters').addEventListener('click', () => {
    search.value = '';
    category.value = '';
    sort.value = 'default';
    loadProducts();
  });
  function updateUrl() {
    const query = new URLSearchParams();
    if (category.value) query.set('categoryId', category.value);
    if (search.value.trim()) query.set('q', search.value.trim());
    if (sort.value !== 'default') query.set('sort', sort.value);
    history.replaceState(null, '', `${location.pathname}${query.size ? '?' + query : ''}`);
  }
  function render() {
    const visible = [...products];
    if (sort.value === 'price-asc') visible.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort.value === 'price-desc') visible.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort.value === 'rating') visible.sort((a, b) => Number(b.rating) - Number(a.rating));
    document.getElementById('result-count').textContent = `${visible.length} sản phẩm`;
    list.innerHTML =
      visible
        .map(
          (product) =>
            `<a class="product-card card" href="product-detail.html?id=${encodeURIComponent(product.id)}"><div class="product-image placeholder-img">${imageUrl(product.image) ? `<img src="${esc(imageUrl(product.image))}" alt="${esc(product.name)}" loading="lazy">` : 'SopPe Fake'}</div><div class="product-body"><div class="product-name">${esc(product.name)}</div><div class="product-price">${Number(product.maxPrice) > Number(product.price) ? 'Từ ' : ''}${money(product.price)}</div><div class="product-meta"><span>★ ${Number(product.rating || 0).toFixed(1)}</span><span>Đã bán ${Number(product.sold || 0)}</span></div><div class="shop-name">${esc(product.shop || 'SopPe Fake')}</div></div></a>`,
        )
        .join('') ||
      '<div class="empty card">Chưa có sản phẩm phù hợp. Hãy thử một từ khóa hoặc danh mục khác.</div>';
  }
  async function loadProducts() {
    const currentRequest = ++requestId;
    pendingRequest?.abort();
    pendingRequest = new AbortController();
    list.setAttribute('aria-busy', 'true');
    document.getElementById('result-count').textContent = 'Đang tải…';
    list.innerHTML = '<div class="empty card">Đang tải sản phẩm…</div>';
    const query = new URLSearchParams();
    if (category.value) query.set('categoryId', category.value);
    if (search.value.trim()) query.set('q', search.value.trim());
    updateUrl();
    try {
      const result = await api(`/api/products${query.size ? '?' + query : ''}`, {
        signal: pendingRequest.signal,
      });
      if (currentRequest !== requestId) return;
      products = result.data || [];
      render();
    } catch (error) {
      if (currentRequest !== requestId || error.name === 'AbortError') return;
      products = [];
      document.getElementById('result-count').textContent = '';
      list.innerHTML = `<div class="empty card" role="alert">${esc(error.message || 'Không thể tải sản phẩm. Vui lòng thử lại.')}<br><button class="btn btn-outline" id="retry-products" type="button">Thử lại</button></div>`;
      document.getElementById('retry-products').onclick = loadProducts;
    } finally {
      if (currentRequest === requestId) list.setAttribute('aria-busy', 'false');
    }
  }
  async function init() {
    SopPe.mountNavbar();
    try {
      const result = await api('/api/categories');
      category.innerHTML =
        '<option value="">Tất cả danh mục</option>' +
        (result.data || [])
          .map((item) => `<option value="${esc(item.id)}">${esc(item.name)}</option>`)
          .join('');
      category.value = params.get('categoryId') || '';
      document.getElementById('category-note').textContent = result.data?.length
        ? ''
        : 'Các danh mục sẽ xuất hiện khi người bán bổ sung.';
    } catch (error) {
      document.getElementById('category-note').textContent =
        'Chưa thể tải danh mục. Bạn vẫn có thể tìm sản phẩm bằng từ khóa.';
    }
    await loadProducts();
  }
  init();
})();
