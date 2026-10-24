// Thời gian xét duyệt & nhận hồ sơ do admin đặt (bảng site_settings, dòng id = 1).
// DÙNG CHUNG cho: tong-quan, ho-so, phan-hoi, admin. Cần nạp sau js/supabase.js.
//
// Quy ước: chưa đặt thời gian  = KHÔNG giới hạn (chạy như bình thường, chỉ cần tài khoản đã xác thực)
//          trước giờ bắt đầu   = chưa mở
//          trong khoảng         = mở
//          sau giờ kết thúc    = "Hồ sơ của tôi" đóng ngay; "Phản hồi xét duyệt" còn mở thêm FEEDBACK_GRACE_DAYS ngày
// Admin luôn được vào để kiểm tra.
var FEEDBACK_GRACE_DAYS = 3;   // số ngày Phản hồi xét duyệt còn mở sau khi hết hạn (đổi số này nếu cần)
var svReview = { start: null, end: null, error: false, loaded: false };
var svReviewListeners = [];

function reviewState() {
  if (svReview.error) return 'error';
  if (!svReview.start || !svReview.end) return 'unset';
  var now = Date.now();
  if (now < new Date(svReview.start).getTime()) return 'before';
  if (now > new Date(svReview.end).getTime()) return 'after';
  return 'open';
}

function reviewFmt(iso) {
  var d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('vi-VN');
}

function reviewRange() {
  return svReview.start && svReview.end ? reviewFmt(svReview.start) + '  →  ' + reviewFmt(svReview.end) : '';
}

// Thời điểm đóng hẳn trang Phản hồi xét duyệt (hết hạn + số ngày gia hạn)
function reviewFeedbackEnd() {
  return new Date(new Date(svReview.end).getTime() + FEEDBACK_GRACE_DAYS * 86400000).toISOString();
}

// Đã quá hạn xem phản hồi (hết hạn + số ngày gia hạn) chưa?
function reviewFeedbackClosed() {
  if (reviewState() !== 'after') return false;
  return Date.now() > new Date(reviewFeedbackEnd()).getTime();
}

// Trang nào đang bị khóa theo THỜI GIAN? page = 'ho-so' | 'phan-hoi'
// (chưa đặt thời gian hoặc lỗi tải thì KHÔNG khóa, để tránh khóa nhầm)
function reviewPageLocked(page) {
  var st = reviewState();
  if (st === 'before') return true;
  if (st === 'after') return page === 'phan-hoi' ? reviewFeedbackClosed() : true;
  return false;
}

// Câu giải thích theo trạng thái thời gian ('' nếu được dùng).
// kind = 'feedback' cho trang Phản hồi xét duyệt (được xem thêm sau khi hết hạn), bỏ trống cho trang nộp hồ sơ.
function reviewMessage(kind) {
  var st = reviewState();
  if (st === 'error') return 'Chưa tải được thời gian xét duyệt. Hãy tải lại trang.';
  if (st === 'before') return 'Chưa đến thời gian xét duyệt. Trang này sẽ mở từ ' + reviewFmt(svReview.start) + '.';
  if (st === 'after') {
    if (kind === 'feedback') {
      if (Date.now() <= new Date(reviewFeedbackEnd()).getTime()) return '';
      return 'Đã hết thời gian xét duyệt và thời gian xem phản hồi (đến ' + reviewFmt(reviewFeedbackEnd()) + '). Trang này đã đóng.';
    }
    return 'Đã hết thời gian xét duyệt (' + reviewFmt(svReview.start) + ' đến ' + reviewFmt(svReview.end) + '). Trang này đã đóng, bạn không thể nộp hồ sơ nữa.';
  }
  return '';   // 'unset' hoặc 'open'
}

// Trả về null nếu được dùng trang; ngược lại { kind: 'account' | 'time', msg }
// Cần window.svProfile (do auth-guard.js tạo); chưa có thì chưa kết luận (trả null).
function svGate(kind) {
  var p = window.svProfile;
  if (!p || p.isAdmin) return null;
  if (!p.verified) {
    return { kind: 'account', msg: p.rejected
      ? 'Tài khoản của bạn chưa được xác thực. Vui lòng liên hệ Ban Chấp hành qua mục Hỏi đáp để được hỗ trợ.'
      : 'Tài khoản của bạn đang chờ Ban Chấp hành xác thực. Sau khi được xác thực, bạn mới dùng được trang này.' };
  }
  var m = reviewMessage(kind);
  return m ? { kind: 'time', msg: m } : null;
}

async function loadReviewWindow() {
  var r = await sb.from('site_settings').select('review_start, review_end').eq('id', 1).maybeSingle();
  svReview.loaded = true;
  if (r.error) { console.error('Không tải được thời gian xét duyệt:', r.error.message); svReview.error = true; return svReview; }
  svReview.error = false;
  svReview.start = r.data ? r.data.review_start : null;
  svReview.end = r.data ? r.data.review_end : null;
  return svReview;
}

// Gọi cb ngay và mỗi khi trạng thái/thời gian đổi (kiểm tra lại mỗi 15 giây,
// nên đến giờ mở/đóng là trang tự đổi, admin đổi giờ là sinh viên thấy sớm).
function watchReview(cb) {
  svReviewListeners.push(cb);
  cb();
  if (watchReview.timer) return;
  var last = '';
  watchReview.timer = setInterval(async function () {
    await loadReviewWindow();
    var key = reviewState() + '|' + svReview.start + '|' + svReview.end + '|' + (reviewFeedbackClosed() ? 'closed' : 'ok');
    if (key !== last) { last = key; svReviewListeners.forEach(function (f) { f(); }); }
  }, 15000);
}

// Làm mờ + chặn bấm một vùng của trang
function svSetDisabled(el, on) {
  if (!el) return;
  el.classList.toggle('is-disabled', !!on);
  el.inert = !!on;
}


// ===== Khóa mục menu "Hồ sơ của tôi" / "Phản hồi xét duyệt" khi ngoài thời gian =====
// Mục bị khóa: mờ đi, bấm vào KHÔNG chuyển trang. Admin luôn được vào.
var SV_LOCKABLE = { 'ho-so.html': 'ho-so', 'phan-hoi.html': 'phan-hoi' };

function svUpdateMenuLock() {
  var nav = document.getElementById('nav');
  if (!nav || !svReview.loaded) return;
  var p = window.svProfile;
  if (!p) return;   // chưa biết là admin hay sinh viên thì chưa khóa
  nav.querySelectorAll('a').forEach(function (a) {
    var page = SV_LOCKABLE[a.getAttribute('href')];
    if (!page) return;
    var lock = !p.isAdmin && reviewPageLocked(page);
    a.classList.toggle('is-locked', lock);
    if (lock) {
      a.setAttribute('aria-disabled', 'true');
      a.tabIndex = -1;
      a.title = page === 'phan-hoi' && reviewState() === 'after'
        ? 'Đã hết thời gian xem phản hồi'
        : (reviewState() === 'before' ? 'Chưa đến thời gian xét duyệt' : 'Đã hết thời gian xét duyệt');
    } else {
      a.removeAttribute('aria-disabled');
      a.removeAttribute('tabindex');
      a.removeAttribute('title');
    }
  });
}

(function () {
  var nav = document.getElementById('nav');
  if (!nav) return;   // trang không có menu (đăng nhập, đăng ký...)
  // Chặn bấm (cả chuột lẫn phím Enter) trước khi các xử lý khác kịp chạy
  nav.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.is-locked') : null;
    if (a) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('sv-profile', svUpdateMenuLock);
  loadReviewWindow().then(function () {
    svUpdateMenuLock();
    watchReview(svUpdateMenuLock);
  });
})();
