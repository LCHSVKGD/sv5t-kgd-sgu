(function () {
  var list = document.getElementById('faq-list');
  if (!list || typeof FAQ === 'undefined') return;
  var limit = parseInt(list.getAttribute('data-limit'), 10) || FAQ.length;
  FAQ.slice(0, limit).forEach(function (item) {
    var d = document.createElement('details');
    d.className = 'faq-item';
    var s = document.createElement('summary');
    s.textContent = item.q;
    var p = document.createElement('p');
    p.textContent = item.a;
    d.appendChild(s); d.appendChild(p);
    list.appendChild(d);
  });
})();
