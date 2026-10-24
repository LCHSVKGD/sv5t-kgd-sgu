// Trang "Hoạt động": các bài đăng (hình + caption) do admin đăng, mới nhất ở trên cùng.
(async function () {
  var box = document.getElementById('hd-feed');
  function note(text) {
    var p = document.createElement('p');
    p.className = 'hs-none';
    p.textContent = text;
    box.replaceChildren(p);
  }

  var r = await sb.from('activities').select('id, caption, image_url, created_at').order('created_at', { ascending: false }).limit(60);
  if (r.error) { console.error(r.error.message); return note('Không tải được bài đăng. Hãy tải lại trang.'); }
  if (!r.data.length) return note('Chưa có bài đăng nào.');

  box.replaceChildren.apply(box, r.data.map(function (x) {
    var card = document.createElement('article');
    card.className = 'poster-card';
    var a = document.createElement('a');
    a.href = x.image_url; a.target = '_blank'; a.rel = 'noopener';
    var im = document.createElement('img');
    im.src = x.image_url; im.alt = x.caption ? x.caption.slice(0, 80) : 'Hình hoạt động'; im.loading = 'lazy';
    a.appendChild(im);
    card.appendChild(a);
    var t = document.createElement('div');
    t.className = 'pc-text';
    if (x.caption) { var p = document.createElement('p'); p.textContent = x.caption; t.appendChild(p); }
    var d = document.createElement('span');
    d.className = 'pc-date';
    d.textContent = new Date(x.created_at).toLocaleDateString('vi-VN');
    t.appendChild(d);
    card.appendChild(t);
    return card;
  }));
})();
