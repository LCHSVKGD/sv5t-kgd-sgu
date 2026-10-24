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