// Chấm tròn đỏ có số (màu trắng) trên menu trái: số mục MỚI của Thông báo, Tài liệu & Hướng dẫn, Hỏi đáp, Hoạt động.
// - Thông báo: số thông báo chưa đọc (cùng cách tính với trang Thông báo, nhớ trên thiết bị này).
// - Tài liệu, Hỏi đáp (tin nhắn của Ban Chấp hành), Hoạt động: số mục đăng sau lần cuối bạn mở trang đó.
//   Tài khoản mới: chỉ tính các mục đăng sau khi tài khoản được tạo.
// Nạp sau cùng trong trang (cần thư viện Supabase, js/supabase.js và menu có id="nav").
(async function () {
  var nav = document.getElementById('nav');
  if (!nav || typeof sb === 'undefined') return;
  var s = await sb.auth.getSession();
  if (!s.data.session) return;
  var user = s.data.session.user, uid = user.id;
  var st = document.createElement('style');
  st.textContent = '.sidebar a .nav-badge{margin-left:auto;margin-right:8px;flex:none;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#e53935;color:#fff;font-size:12.5px;font-weight:700;line-height:22px;text-align:center;box-sizing:border-box}';
  document.head.appendChild(st);
  var page = location.pathname.split('/').pop() || 'index.html';
  var SEEN_KEY = 'sv5t-seen-' + uid;
  var READ_KEY = 'sv5t-da-doc-' + uid;   // trùng với trang Thông báo

  function load(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function t(x) { var n = Date.parse(x); return isNaN(n) ? 0 : n; }

  function setBadge(href, n) {
    var a = nav.querySelector('a[href="' + href + '"]');
    if (!a) return;
    var b = a.querySelector('.nav-badge');
    if (n > 0) {
      if (!b) { b = document.createElement('span'); b.className = 'nav-badge'; a.appendChild(b); }
      b.textContent = n > 99 ? '99+' : String(n);
      b.setAttribute('aria-label', n + ' mục mới');
    } else if (b) {
      b.remove();
    }
  }

  // Đếm các mục đăng sau lần xem cuối; nếu đang ở chính trang đó thì coi như đã xem hết
  function track(href, items) {
    var seen = load(SEEN_KEY);
    var since = t(seen[href]) || t(user.created_at);
    var n = items.filter(function (x) { return t(x.created_at) > since; }).length;
    if (page === href) {
      var max = items.reduce(function (m, x) { return Math.max(m, t(x.created_at)); }, since);
      seen[href] = new Date(max).toISOString();
      save(SEEN_KEY, seen);
      n = 0;
    }
    setBadge(href, n);
  }

  async function refresh() {
    try {
      var a = await sb.from('announcements').select('id, kind, created_at, file_path, drive_url')
        .or('target_student_id.is.null,target_student_id.eq.' + uid)
        .order('created_at', { ascending: false }).limit(200);
      if (!a.error && a.data) {
        var read = load(READ_KEY);
        var tb = a.data.filter(function (x) { return x.kind !== 'document' && !read[x.id]; });
        setBadge('thong-bao.html', tb.length);
        track('tai-lieu.html', a.data.filter(function (x) { return x.file_path || x.drive_url; }));
      }
      var m = await sb.from('messages').select('created_at').eq('student_id', uid).eq('sender', 'admin')
        .order('created_at', { ascending: false }).limit(100);
      if (!m.error && m.data) track('hoi-dap.html', m.data);
      var h = await sb.from('activities').select('created_at').order('created_at', { ascending: false }).limit(100);
      if (!h.error && h.data) track('hoat-dong.html', h.data);
    } catch (e) { console.error('Không cập nhật được số mục mới:', e); }
  }

  window.svBadgeRefresh = refresh;
  await refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });

  // Rời khỏi trang theo dõi: các tin tới khi đang ở trang đó cũng tính là đã xem
  window.addEventListener('pagehide', function () {
    if (['tai-lieu.html', 'hoi-dap.html', 'hoat-dong.html'].indexOf(page) < 0) return;
    var seen = load(SEEN_KEY);
    seen[page] = new Date().toISOString();
    save(SEEN_KEY, seen);
  });
})();
