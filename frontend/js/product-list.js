(() => {
  const {api, esc, money, imageUrl} = SopPe;
  const params = new URLSearchParams(location.search);
  const search = document.getElementById('local-search');
  const category = document.getElementById('category-filter');
  const sort = document.getElementById('sort');
  const list = document.getElementById('product-list');
  let products = [];
  if (SopPe.isFileMode) {
    SopPe.mountNavbar();
    document.getElementById('result-count').textContent = 'Chưa kết nối máy chủ';
    document.getElementById('category-note').textContent = 'Danh mục được lấy từ cơ sở dữ liệu sau khi khởi động website.';
    document.querySelectorAll('#filter-form input, #filter-form select, #filter-form button').forEach(control => control.disabled = true);
    list.innerHTML = '<div class="empty card"><h2>Khởi động website để xem sản phẩm</h2><p>Bạn đang mở tệp HTML trực tiếp. Sản phẩm và danh mục chỉ được tải từ cơ sở dữ liệu khi máy chủ hoạt động.</p><p>Chạy <b>START-WINDOWS.cmd</b> trong thư mục dự án, rồi mở website.</p><a class="btn btn-primary" href="http://localhost:3000/product-list.html">Mở trang sản phẩm trên máy chủ</a></div>';
    return;
  }
  search.value = params.get('q') || '';
  document.getElementById('filter-form').addEventListener('submit', event => {
    event.preventDefault();
    loadProducts();
  });
  category.addEventListener('change', loadProducts);
  sort.addEventListener('change', render);
  function render() {
    const query = search.value.trim().toLocaleLowerCase('vi');
    const visible = products.filter(product => !query || `${product.name || ''} ${product.shop || ''}`.toLocaleLowerCase('vi').includes(query));
    if (sort.value === 'price-asc') visible.sort((a,b) => Number(a.price) - Number(b.price));
    if (sort.value === 'price-desc') visible.sort((a,b) => Number(b.price) - Number(a.price));
    if (sort.value === 'rating') visible.sort((a,b) => Number(b.rating) - Number(a.rating));
    document.getElementById('result-count').textContent = `${visible.length} sản phẩm`;
    list.innerHTML = visible.map(product => `<a class="product-card card" href="product-detail.html?id=${encodeURIComponent(product.id)}"><div class="product-image placeholder-img">${imageUrl(product.image) ? `<img src="${esc(imageUrl(product.image))}" alt="${esc(product.name)}" loading="lazy">` : 'SopPe Fake'}</div><div class="product-body"><div class="product-name">${esc(product.name)}</div><div class="product-price">${money(product.price)}</div><div class="product-meta"><span>★ ${Number(product.rating || 0).toFixed(1)}</span><span>Đã bán ${Number(product.sold || 0)}</span></div><div class="shop-name">${esc(product.shop || 'SopPe Fake')}</div></div></a>`).join('') || '<div class="empty card">Chưa có sản phẩm phù hợp. Hãy thử một từ khóa hoặc danh mục khác.</div>';
  }
  async function loadProducts() {
    list.innerHTML = '<div class="empty card">Đang tải sản phẩm…</div>';
    const query = new URLSearchParams();
    if (category.value) query.set('categoryId', category.value);
    if (search.value.trim()) query.set('q', search.value.trim());
    history.replaceState(null, '', `${location.pathname}${query.size ? '?' + query : ''}`);
    try {
      const result = await api(`/api/products${query.size ? '?' + query : ''}`);
      products = result.data || [];
      render();
    } catch (error) {
      document.getElementById('result-count').textContent = '';
      list.innerHTML = `<div class="empty card" role="alert">${esc(error.message || 'Không thể tải sản phẩm. Vui lòng thử lại.')}</div>`;
    }
  }
  async function init() {
    SopPe.mountNavbar();
    try {
      const result = await api('/api/categories');
      category.innerHTML = '<option value="">Tất cả danh mục</option>' + (result.data || []).map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
      category.value = params.get('categoryId') || '';
      document.getElementById('category-note').textContent = result.data?.length ? '' : 'Các danh mục sẽ xuất hiện khi người bán bổ sung.';
    } catch (error) {
      document.getElementById('category-note').textContent = 'Chưa thể tải danh mục. Bạn vẫn có thể tìm sản phẩm bằng từ khóa.';
    }
    await loadProducts();
  }
  init();
})();
