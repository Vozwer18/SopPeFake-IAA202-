(() => {
 const login = document.getElementById('login-form'), register = document.getElementById('register-form');
 function tab(kind) {login.hidden=kind!=='login';register.hidden=kind!=='register';document.getElementById('tab-login').classList.toggle('active',kind==='login');document.getElementById('tab-register').classList.toggle('active',kind==='register');}
 document.getElementById('tab-login').onclick=()=>tab('login');document.getElementById('tab-register').onclick=()=>tab('register');
 if (SopPe.isFileMode) {
   for (const form of [login,register]) form.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
   document.getElementById('login-error').textContent='Khởi động website bằng START-WINDOWS.cmd và mở http://localhost:3000 để đăng nhập.';
   document.getElementById('register-error').textContent='Tạo tài khoản cần kết nối máy chủ.';
   return;
 }
 login.onsubmit=async e=>{e.preventDefault();const error=document.getElementById('login-error'),button=e.submitter;error.textContent='';button.disabled=true;try {const j=await SopPe.api('/api/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(login)))});const next=new URLSearchParams(location.search).get('next');let target=j.redirect||'/user-panel.html';if(j.data?.role==='customer'&&next){const url=new URL(next,location.origin);if(url.origin===location.origin&&url.pathname.startsWith('/'))target=url.pathname+url.search;}location.href=target;}catch(err){error.textContent=err.message;}finally{button.disabled=false;}};
 register.onsubmit=async e=>{e.preventDefault();const error=document.getElementById('register-error'),button=e.submitter;error.textContent='';button.disabled=true;try {const j=await SopPe.api('/api/auth/register',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(register)))});register.reset();tab('login');SopPe.message(j.message||'Đã tạo tài khoản. Bạn có thể đăng nhập.');}catch(err){error.textContent=err.message;}finally{button.disabled=false;}};
})();
