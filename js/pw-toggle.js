// Thêm nút hình con mắt để hiện / ẩn mật khẩu cho mọi ô nhập mật khẩu trong trang
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function icon(off) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    var d = off
      ? ['M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2', 'M1 1l22 22']
      : ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'];
    d.forEach(function (p) {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', p);
      s.appendChild(path);
    });
    return s;
  }
  document.querySelectorAll('input[type="password"]').forEach(function (inp) {
    var wrap = document.createElement('div');
    wrap.className = 'pw-wrap';
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pw-eye';
    b.setAttribute('aria-label', 'Hiện mật khẩu');
    b.appendChild(icon(false));
    b.addEventListener('click', function () {
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      b.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      b.replaceChildren(icon(show));
      inp.focus();
    });
    wrap.appendChild(b);
  });
})();
