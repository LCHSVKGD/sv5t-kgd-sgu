// Khóa các trang sau đăng nhập và dựng menu + lời chào theo vai trò (admin / sinh viên).
// DÙNG CHUNG cho MỌI trang sau đăng nhập: tong-quan, thong-bao, hoi-dap, cau-hoi-thuong-gap, tai-lieu, admin.
// Cần nạp trước thư viện Supabase và js/supabase.js
(async function () {
  var s = await sb.auth.getSession();
  var session = s.data.session;
  if (!session) { location.replace('index.html'); return; }

  // Quá thời hạn một lần đăng nhập (SESSION_MAX_MINUTES, mặc định 60 phút) thì đăng xuất và yêu cầu đăng nhập lại
  if (svSessionLeftMs(session) <= 0) { await svSignOutExpired(); return; }
  var warnBox = null;
  function sessionTick() {
    var left = svSessionLeftMs(session);
    if (left <= 0) return svSignOutExpired();
    if (left <= 5 * 60000) {   // còn 5 phút: nhắc để kịp lưu việc đang làm
      if (!warnBox) {
        warnBox = document.createElement('div');
        warnBox.setAttribute('role', 'status');
        warnBox.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;max-width:340px;padding:12px 16px;border-radius:12px;background:#fff7e6;border:2px solid #f08a24;color:#9a4f06;font:600 14.5px/1.5 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.15)';
        document.body.appendChild(warnBox);
      }
      warnBox.textContent = 'Phiên đăng nhập sẽ hết hạn sau ' + Math.ceil(left / 60000) + ' phút. Hãy lưu việc đang làm, sau đó bạn cần đăng nhập lại.';
    }
  }
  sessionTick();
  setInterval(sessionTick, 15000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sessionTick(); });

  document.body.style.visibility = 'visible';

  // Đăng xuất ở tab khác thì tab này cũng thoát
  sb.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') location.replace('index.html');
  });

  var uid = session.user.id;
  var CACHE_KEY = 'sv5t-ho-so-' + uid;

  // Hồ sơ tạm: dùng bản lưu lần trước (nếu có) để menu và lời chào hiện ngay,
  // và không bị mất vai trò admin khi mạng chập chờn. Sau đó sẽ cập nhật lại từ Supabase.
  var profile = { name: session.user.email, role: 'student', verified: false, rejected: false };
  try {
    var saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (saved && saved.role) profile = saved;
  } catch (e) {}

  var nav = document.getElementById('nav');
  var main = document.querySelector('main');
  var nameNode = null;   // phần chữ sau "Xin chào, "

  function apply() {
    var isAdmin = profile.role === 'admin';
    window.svProfile = {
      role: profile.role,
      verified: profile.verified,
      rejected: profile.rejected,
      isAdmin: isAdmin
    };

    // Menu: chỉ admin mới có mục "Admin"
    if (nav) {
      var link = nav.querySelector('[href="admin.html"]');
      if (isAdmin && !link) {
        link = document.createElement('a');
        link.href = 'admin.html';
        link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4"/><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>Admin';
        nav.insertBefore(link, nav.querySelector('.sidebar-bottom'));
      } else if (!isAdmin && link) {
        link.remove();
      }
    }

    // Lời chào: nằm đầu vùng nội dung, bên ngoài khung
    if (main) {
      if (!nameNode) {
        var box = document.createElement('div');
        box.className = 'greeting';
        var hello = document.createElement('span');
        hello.className = 'header-user';
        var hi = document.createElement('span');
        hi.className = 'hi';
        hi.textContent = 'Xin chào, ';
        nameNode = document.createTextNode('');
        hello.append(hi, nameNode);
        box.appendChild(hello);
        main.before(box);
      }
      var tag = isAdmin ? ' (Admin)' : (profile.verified ? ' (đã xác thực)' : (profile.rejected ? ' (chưa được xác thực)' : ' (chờ xác thực)'));
      nameNode.nodeValue = profile.name + tag;
    }

    // Cho các trang khác biết hồ sơ vừa được cập nhật (nếu cần)
    document.dispatchEvent(new CustomEvent('sv-profile', { detail: window.svProfile }));
  }

  // Nút cần tài khoản đã xác thực (thêm thuộc tính data-needs-verified vào nút)
  document.querySelectorAll('[data-needs-verified]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var p = window.svProfile;
      if (p.isAdmin) return;
      if (p.verified) {
        // Đã xác thực nhưng ngoài thời gian xét duyệt (nếu trang có nạp js/review-window.js)
        var tm = (typeof reviewMessage === 'function' && svReview.loaded) ? reviewMessage() : '';
        if (tm) { e.preventDefault(); alert(tm); }
        return;
      }
      e.preventDefault();
      alert(p.rejected
        ? 'Tài khoản của bạn chưa được xác thực. Vui lòng liên hệ Ban Chấp hành qua mục Hỏi đáp để được hỗ trợ'
        : 'Tài khoản của bạn cần được Ban Chấp hành xác thực trước khi nộp hồ sơ xét danh hiệu');
    });
  });

  apply();   // hiện ngay từ bản lưu

  // Lấy họ tên, vai trò và trạng thái xác thực mới nhất
  var r = await sb.from('profiles').select('full_name, role, verified, rejected').eq('id', uid).maybeSingle();
  if (r.error) {
    console.error('Không tải được hồ sơ tài khoản:', r.error.message);   // giữ nguyên bản đang dùng
    return;
  }
  if (r.data) {
    profile = {
      name: r.data.full_name || session.user.email,
      role: r.data.role || 'student',
      verified: r.data.verified === true,
      rejected: r.data.rejected === true
    };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(profile)); } catch (e) {}
    apply();
  }
})();