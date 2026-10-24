var btn = document.querySelector('.menu-btn');
var nav = document.getElementById('nav');
var overlay = document.querySelector('.sidebar-overlay');

function dongMenu() {
  nav.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  btn.textContent = '☰';
  btn.setAttribute('aria-expanded', 'false');
}

btn.addEventListener('click', function () {
  var dangMo = nav.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open', dangMo);
  btn.textContent = dangMo ? '✕' : '☰';
  btn.setAttribute('aria-expanded', dangMo ? 'true' : 'false');
});

// Mục "Hoạt động" nằm ngay dưới "Phản hồi xét duyệt" (trang nào chưa có sẵn thì tự thêm)
(function () {
  var phanHoi = nav.querySelector('a[href="phan-hoi.html"]');
  if (!phanHoi || nav.querySelector('a[href="hoat-dong.html"]')) return;
  var a = document.createElement('a');
  a.href = 'hoat-dong.html';
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/></svg>Hoạt động';
  phanHoi.after(a);
})();

// Mục "Thông tin & Tài khoản" trên mọi trang đều trỏ về trang thong-tin.html
nav.querySelectorAll('a').forEach(function (a) {
  if (a.getAttribute('href') === '#' && a.textContent.indexOf('Thông tin') > -1) a.setAttribute('href', 'thong-tin.html');
});

// Đổi icon "Tài liệu & hướng dẫn" thành quyển sách trên mọi trang (khác icon dấu chấm hỏi của "Hỏi đáp")
var iconTaiLieu = nav.querySelector('a[href="tai-lieu.html"] svg');
if (iconTaiLieu) {
  iconTaiLieu.innerHTML = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>';
}

nav.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', dongMenu);
});

if (overlay) overlay.addEventListener('click', dongMenu);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') dongMenu();
});