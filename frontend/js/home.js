(async () => {
  const {api,esc,productCard} = SopPe;
  await SopPe.mountNavbar();
  async function categories() {
    const node = document.getElementById('category-grid');
    try {const items = (await api('/api/categories')).data || []; node.innerHTML = items.map(c => `<a class="category-card" href="product-list.html?categoryId=${encodeURIComponent(c.id)}"><div class="category-icon" aria-hidden="true">${esc(c.name?.charAt(0).toUpperCase() || '#')}</div><b>${esc(c.name)}</b><span>Khám phá →</span></a>`).join('') || '<div class="empty card">Chưa có danh mục.<br>Danh mục mới sẽ xuất hiện khi nhà bán cập nhật cửa hàng.</div>';} catch(e) { node.innerHTML = `<div class="empty card">${esc(e.message)}</div>`; }
  }
  async function products() {
    const node = document.getElementById('home-products');
    try {const items = (await api('/api/products')).data || []; node.innerHTML = items.slice(0,10).map(productCard).join('') || '<div class="empty card">Cửa hàng đang chuẩn bị những sản phẩm đầu tiên.<br>Hãy quay lại để khám phá sản phẩm mới.</div>';} catch(e) {node.innerHTML = `<div class="empty card">${esc(e.message)}</div>`;}
  }
  await Promise.all([categories(),products()]);
})();
