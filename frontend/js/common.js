/* Shared same-origin client. Business permissions are enforced by the API. */
(() => {
  const isFileMode = location.protocol === 'file:';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(Number(value || 0));
  const imageUrl = value => {
    try { const url = new URL(value || '', location.origin); return value && ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  };
  // Mirrors components/navbar.html. Used when browsers block fetch() for file:// pages.
  const navbarTemplate = `<header class="navbar"><div class="utility-bar"><div class="nav-shell"><span id="browse-mode">Khám phá SopPe Fake</span><div id="nav-account"><a href="login.html">Đăng nhập</a></div></div></div><div class="navbar-top nav-shell"><a class="brand" href="index.html"><span>SopPe</span> <strong>Fake</strong></a><form class="search-box" id="global-search" role="search"><input id="search-input" type="search" aria-label="Tìm sản phẩm" placeholder="Bạn đang tìm sản phẩm gì?"><button>Tìm kiếm</button></form><a href="cart.html" class="cart-link" id="cart-link" hidden><span>Giỏ hàng</span><b id="cart-count">0</b></a></div><nav class="category-menu nav-shell" aria-label="Danh mục"><a href="index.html">Trang chủ</a><a href="product-list.html">Tất cả sản phẩm</a><span id="nav-categories"></span></nav></header>`;
  const startupCopy = 'Bạn đang mở trực tiếp tệp HTML. Chạy START-WINDOWS.cmd trong thư mục SopPeFake rồi mở http://localhost:3000 để dùng dữ liệu, đăng nhập và mua sắm.';
  function showFileBanner() {
    if (!isFileMode || document.getElementById('file-startup-banner')) return;
    const banner = document.createElement('aside'); banner.id = 'file-startup-banner'; banner.className = 'file-startup-banner'; banner.setAttribute('role','note');
    banner.innerHTML = `<div><b>Chế độ xem tệp trên máy</b><p>${startupCopy}</p></div><a class="btn btn-primary" href="http://localhost:3000">Mở website</a>`;
    document.body.prepend(banner);
  }
  function offlinePanel() {
    if (!isFileMode || !document.body.dataset.requiredRole) return false;
    showFileBanner();
    if (document.getElementById('offline-panel')) return true;
    document.querySelectorAll('main,.panel-layout,.modal').forEach(node => {node.hidden=true;});
    const panel = document.createElement('main'); panel.id='offline-panel'; panel.className='container section offline-panel';
    const role = document.body.dataset.requiredRole;
    const label = role==='admin'?'quản trị viên':role==='seller'?'nhà bán':'người mua';
    panel.innerHTML=`<section class="card offline-panel-card"><a class="brand" href="index.html"><span>SopPe</span> <strong>Fake</strong></a><span class="eyebrow">CẦN KHỞI ĐỘNG WEBSITE</span><h1>Không gian ${label} cần đăng nhập.</h1><p>Mở tệp trên máy chỉ cho phép xem giao diện công khai. Dữ liệu và quyền tài khoản được xác nhận bởi máy chủ khi website chạy.</p><ol><li>Quay về thư mục dự án và chạy <b>START-WINDOWS.cmd</b>.</li><li>Chờ máy chủ báo sẵn sàng.</li><li>Mở website và đăng nhập đúng loại tài khoản.</li></ol><div class="actions"><a class="btn btn-primary" href="http://localhost:3000/login.html">Mở trang đăng nhập</a><a class="btn btn-outline" href="guest-panel.html">Xem giao diện khách</a></div></section>`;
    document.body.append(panel); return true;
  }
  async function api(path, options = {}) {
    if (isFileMode) {const error=new Error(startupCopy);error.status=0;error.code='FILE_MODE';throw error;}
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(path, {credentials:'same-origin', ...options, signal:options.signal || controller.signal, headers:options.body ? {'Content-Type':'application/json', ...options.headers} : options.headers});
      const result = await response.json().catch(() => ({success:false,message:'Phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại trang.'}));
      if (!response.ok || result.success === false) {const error=new Error(result.message || 'Không thể hoàn tất yêu cầu.');error.status=response.status;throw error;}
      return result;
    } catch(error) {
      if (error.name==='AbortError') throw new Error('Máy chủ phản hồi quá lâu. Vui lòng kiểm tra máy chủ và thử lại.');
      if (error instanceof TypeError) throw new Error('Không kết nối được máy chủ. Kiểm tra website đã chạy rồi tải lại trang.');
      throw error;
    } finally {clearTimeout(timeout);}
  }
  function message(text, kind = 'success') {
    let box = document.getElementById('page-message');
    if (!box) {box=document.createElement('div');box.id='page-message';box.setAttribute('role','status');document.body.append(box);}
    box.className=`toast ${kind}`;box.textContent=text;box.hidden=false;
    clearTimeout(message.timer);message.timer=setTimeout(() => {box.hidden=true;}, 6000);
  }
  function productCard(p) {
    const image=imageUrl(p.image);
    return `<a class="home-product product-card card" href="product-detail.html?id=${encodeURIComponent(p.id)}"><div class="pic product-image placeholder-img">${image?`<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy">`:'<span>Chưa có ảnh</span>'}</div><div class="body product-body"><h3>${esc(p.name)}</h3><div class="price product-price">${money(p.price)}</div><div class="meta"><span>${esc(p.shop || '')}</span><span>Đã bán ${Number(p.sold || 0)}</span></div></div></a>`;
  }
  async function filesToData(files) {
    const list=[...files];
    if (list.length>8) throw new Error('Chọn tối đa 8 ảnh.');
    if (list.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>1024*1024)) throw new Error('Ảnh phải là PNG/JPG/WebP và không quá 1 MB mỗi ảnh.');
    return Promise.all(list.map(f=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:f.name,data:reader.result});reader.onerror=()=>reject(new Error('Không đọc được ảnh.'));reader.readAsDataURL(f);})));
  }
  async function mountNavbar() {
    const node=document.getElementById('navbar');if(!node)return null;
    // Embed first so navigation is available even before the server answers.
    node.innerHTML=navbarTemplate;
    if (!isFileMode) {try{const response=await fetch('components/navbar.html');if(response.ok)node.innerHTML=await response.text();}catch{/* Keep the embedded, functional navigation. */}}
    let user=null;
    if (!isFileMode) {try{user=(await api('/api/auth/me')).data;}catch(e){if(e.status!==401)message('Chưa tải được thông tin phiên đăng nhập.','error');}}
    window.currentUser=user;
    const account=document.getElementById('nav-account');
    if(user){const panel=user.role==='admin'?'admin-panel.html':user.role==='seller'?'seller-panel.html':'user-panel.html';account.innerHTML=`<a href="${panel}">${esc(user.fullName || user.username)}</a><button class="text-button" id="logout-link">Đăng xuất</button>`;document.getElementById('logout-link').onclick=logout;}
    document.getElementById('cart-link').hidden=user?.role!=='customer';
    document.getElementById('browse-mode').textContent=isFileMode?'Xem giao diện · Cần máy chủ để tải sản phẩm':user?'Khám phá sản phẩm từ các cửa hàng':'Guest panel · Xem sản phẩm';
    document.getElementById('global-search').onsubmit=e=>{e.preventDefault();location.href='product-list.html?q='+encodeURIComponent(document.getElementById('search-input').value.trim());};
    if(!isFileMode){try{const categories=(await api('/api/categories')).data||[];document.getElementById('nav-categories').innerHTML=categories.map(c=>`<a href="product-list.html?categoryId=${encodeURIComponent(c.id)}">${esc(c.name)}</a>`).join('');}catch{document.getElementById('nav-categories').textContent='';}}
    if(user?.role==='customer')await refreshCartCount();return user;
  }
  async function refreshCartCount(){if(isFileMode)return;try{const j=await api('/api/cart');const count=(j.data?.cart_items||[]).reduce((n,i)=>n+Number(i.quantity||0),0);const el=document.getElementById('cart-count');if(el)el.textContent=count;}catch{}}
  async function logout(){try{await api('/api/auth/logout',{method:'POST'});location.href='guest-panel.html';}catch(e){message(e.message,'error');}}
  window.SopPe={isFileMode,esc,money,imageUrl,api,message,productCard,filesToData,mountNavbar,logout,offlinePanel};
  window.refreshCartCount=refreshCartCount;
  showFileBanner();offlinePanel();
})();
