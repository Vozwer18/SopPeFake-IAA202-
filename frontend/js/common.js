/* Shared same-origin client. Business permissions are enforced by the API. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(Number(value || 0));
  const imageUrl = value => {
    try { const url = new URL(value || '', location.origin); return value && ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  };
  async function api(path, options = {}) {
    const response = await fetch(path, {credentials:'same-origin', ...options, headers:options.body ? {'Content-Type':'application/json', ...options.headers} : options.headers});
    const result = await response.json().catch(() => ({message:'Phản hồi từ máy chủ không hợp lệ.'}));
    if (!response.ok || result.success === false) { const error = new Error(result.message || 'Không thể hoàn tất yêu cầu.'); error.status = response.status; throw error; }
    return result;
  }
  function message(text, kind = 'success') {
    let box = document.getElementById('page-message');
    if (!box) { box = document.createElement('div'); box.id = 'page-message'; box.setAttribute('role','status'); document.body.append(box); }
    box.className = `toast ${kind}`; box.textContent = text; box.hidden = false;
    clearTimeout(message.timer); message.timer = setTimeout(() => { box.hidden = true; }, 6000);
  }
  function productCard(p) {
    const image = imageUrl(p.image);
    return `<a class="home-product product-card card" href="/product-detail.html?id=${encodeURIComponent(p.id)}"><div class="pic product-image placeholder-img">${image ? `<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy">` : '<span>Chưa có ảnh</span>'}</div><div class="body product-body"><h3>${esc(p.name)}</h3><div class="price product-price">${money(p.price)}</div><div class="meta"><span>${esc(p.shop || '')}</span><span>Đã bán ${Number(p.sold || 0)}</span></div></div></a>`;
  }
  async function filesToData(files) {
    const list = [...files];
    if (list.length > 8) throw new Error('Chọn tối đa 8 ảnh.');
    if (list.some(f => !['image/png','image/jpeg','image/webp'].includes(f.type) || f.size > 1024 * 1024)) throw new Error('Ảnh phải là PNG/JPG/WebP và không quá 1 MB mỗi ảnh.');
    return Promise.all(list.map(f => new Promise((resolve, reject) => {const reader = new FileReader(); reader.onload = () => resolve({name:f.name,data:reader.result}); reader.onerror = () => reject(new Error('Không đọc được ảnh.')); reader.readAsDataURL(f);} )));
  }
  async function mountNavbar() {
    const node = document.getElementById('navbar'); if (!node) return null;
    const response = await fetch('/components/navbar.html'); node.innerHTML = await response.text();
    let user = null;
    try { user = (await api('/api/auth/me')).data; } catch (e) { if (e.status !== 401) message('Chưa tải được thông tin phiên đăng nhập.', 'error'); }
    window.currentUser = user;
    const account = document.getElementById('nav-account');
    if (user) {
      const panel = user.role === 'admin' ? '/admin-panel.html' : user.role === 'seller' ? '/seller-panel.html' : '/user-panel.html';
      account.innerHTML = `<a href="${panel}">${esc(user.fullName || user.username)}</a><button class="text-button" id="logout-link">Đăng xuất</button>`;
      document.getElementById('logout-link').onclick = logout;
    }
    document.getElementById('cart-link').hidden = user?.role !== 'customer';
    document.getElementById('browse-mode').textContent = user ? 'Khám phá sản phẩm từ các cửa hàng' : 'Guest panel · Xem sản phẩm';
    document.getElementById('global-search').onsubmit = e => {e.preventDefault(); location.href = '/product-list.html?q=' + encodeURIComponent(document.getElementById('search-input').value.trim());};
    try {const categories = (await api('/api/categories')).data || []; document.getElementById('nav-categories').innerHTML = categories.map(c => `<a href="/product-list.html?categoryId=${encodeURIComponent(c.id)}">${esc(c.name)}</a>`).join('');} catch { document.getElementById('nav-categories').textContent = ''; }
    if (user?.role === 'customer') await refreshCartCount();
    return user;
  }
  async function refreshCartCount() {try {const j = await api('/api/cart'); const count = (j.data?.cart_items || []).reduce((n,i) => n + Number(i.quantity || 0), 0); const el = document.getElementById('cart-count'); if (el) el.textContent = count;} catch {}}
  async function logout() {try {await api('/api/auth/logout',{method:'POST'}); location.href = '/guest-panel.html';} catch(e) {message(e.message,'error');}}
  window.SopPe = {esc,money,imageUrl,api,message,productCard,filesToData,mountNavbar,logout};
  window.refreshCartCount = refreshCartCount;
})();
