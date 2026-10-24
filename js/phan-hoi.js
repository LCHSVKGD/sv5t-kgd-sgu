// Trang "Phản hồi xét duyệt": 5 tiêu chí ở thanh ngang; tệp đã nộp bên trái, giải trình của BCH bên phải.
// Kết quả duyệt/từ chối chỉ hiện sau khi BCH bấm "Hoàn thành" (cột released_at).
(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var BUCKET = 'evidence';
  var STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };
  var IMG = /\.(png|jpe?g|webp)$/i;

  var s = await sb.auth.getSession();
  if (!s.data.session) return;
  var uid = s.data.session.user.id;

  var criteria = await loadCriteria();
  await loadReviewWindow();   // thời gian xét duyệt do admin đặt
  var subs = [];
  var cur = (location.hash || '').replace('#', '');
  if (!criteria.some(function (c) { return c.key === cur; })) cur = criteria[0].key;
  var loaded = false;
var DEMO = location.search === '?xem-thu';   // xem thử bằng dữ liệu mẫu

  function fmtDate(t) {
    var d = new Date(t);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('vi-VN');
  }
  function fmtSize(n) {
    if (!n) return '';
    return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  }
  // Trạng thái sinh viên được thấy: chưa được BCH "Hoàn thành" thì vẫn là "Chờ duyệt"
  function shownStatus(x) { return x.status !== 'pending' && x.released_at ? x.status : 'pending'; }
  function filesOf(key) {
    return subs.filter(function (x) { return x.criterion === key; })
               .sort(function (a, b) { return String(a.created_at).localeCompare(String(b.created_at)); });
  }
  function empty(box, text) {
    var p = document.createElement('p');
    p.className = 'hs-none';
    p.textContent = text;
    box.replaceChildren(p);
  }

  async function openFile(sub) {
    if (DEMO) return alert('Đang xem thử nên chưa mở được tệp');
    var w = window.open('', '_blank');
    var r = await sb.storage.from(BUCKET).createSignedUrl(sub.file_path, 3600);
    if (r.error || !r.data) { if (w) w.close(); return alert('Chưa mở được tệp. Hãy thử lại'); }
    if (w) w.location = r.data.signedUrl; else location.href = r.data.signedUrl;
  }

  function tabNote(key) {
    var list = filesOf(key);
    if (!list.length) return 'Chưa nộp';
    var st = list.map(shownStatus);
    if (st.indexOf('pending') >= 0) return 'Chờ phản hồi';
    return st.indexOf('rejected') >= 0 ? 'Cần bổ sung' : 'Đã duyệt';
  }

  function renderTabs() {
    var frag = document.createDocumentFragment();
    criteria.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.className = c.key === cur ? 'on' : '';
      b.append(c.name);
      var sm = document.createElement('small');
      sm.textContent = tabNote(c.key);
      b.appendChild(sm);
      b.addEventListener('click', function () {
        cur = c.key;
        history.replaceState(null, '', '#' + cur);
        render();
      });
      frag.appendChild(b);
    });
    $('fb-tabs').replaceChildren(frag);
  }

  // Bên trái: các tệp đã nộp (ảnh hiện xem trước, tệp khác bấm để mở)
  function renderFiles(list) {
    var box = $('fb-files');
    if (!list.length) return empty(box, 'Bạn chưa nộp minh chứng nào cho tiêu chí này');
    var frag = document.createDocumentFragment();
    list.forEach(function (x, i) {
      var card = document.createElement('div');
      card.className = 'hs-file fb-file ' + shownStatus(x);
      var top = document.createElement('div');
      top.className = 'hs-file-top';
      var name = document.createElement('button');
      name.type = 'button'; name.className = 'hs-file-name';
      name.textContent = (i + 1) + '. ' + x.file_name;
      name.title = 'Bấm để mở tệp';
      name.addEventListener('click', function () { openFile(x); });
      var st = document.createElement('span');
      var sh = shownStatus(x);
      st.className = 'st st-' + sh; st.textContent = STATUS[sh];
      top.append(name, st);
      var meta = document.createElement('div');
      meta.className = 'hs-file-meta';
      meta.textContent = 'Nộp ' + fmtDate(x.created_at) + (x.file_size ? ' · ' + fmtSize(x.file_size) : '');
      card.append(top, meta);
      if (IMG.test(x.file_name || '')) {
        var img = document.createElement('img');
        img.className = 'fb-thumb'; img.alt = 'Xem trước ' + x.file_name; img.loading = 'lazy'; img.hidden = true;
        img.addEventListener('click', function () { openFile(x); });
        card.appendChild(img);
        sb.storage.from(BUCKET).createSignedUrl(x.file_path, 3600).then(function (r) {
          if (r.data && r.data.signedUrl) { img.src = r.data.signedUrl; img.hidden = false; }
        });
      }
      frag.appendChild(card);
    });
    box.replaceChildren(frag);
  }

  // Bên phải: kết quả + giải trình của BCH cho từng tệp (đánh số khớp với bên trái)
  function renderAnswers(list) {
    var box = $('fb-answers');
    if (!list.length) return empty(box, 'Chưa có hồ sơ ở tiêu chí này nên chưa có phản hồi');
    if (list.every(function (x) { return shownStatus(x) === 'approved'; })) return empty(box, 'Tiêu chí này đã được duyệt, không có giải trình nào cần xem');
    var frag = document.createDocumentFragment();
    list.forEach(function (x, i) {
      var sh = shownStatus(x);
      var card = document.createElement('div');
      if (sh === 'approved') return;   // đã duyệt thì không hiện ở khung giải trình
      card.className = 'hs-file fb-ans ' + sh;
      var top = document.createElement('div');
      top.className = 'hs-file-top';
      var h = document.createElement('b');
      h.className = 'fb-ans-name'; h.textContent = 'Tệp ' + (i + 1) + ': ' + x.file_name;
      var st = document.createElement('span');
      st.className = 'st st-' + sh; st.textContent = STATUS[sh];
      top.append(h, st);
      card.appendChild(top);
      var body = document.createElement('div');
      if (sh === 'pending') {
        body.className = 'fb-ans-wait';
        body.textContent = 'Ban Chấp hành chưa gửi phản hồi cho tệp này. Kết quả sẽ hiện ở đây ngay khi có';
      } else if (sh === 'approved') {
        body.className = 'fb-ans-ok';
        body.textContent = 'Minh chứng hợp lệ, đã được Ban Chấp hành duyệt' + (x.reviewed_at ? ' (' + fmtDate(x.reviewed_at) + ')' : '');
      } else {
        body.className = 'hs-reason';
        var b = document.createElement('b');
        b.textContent = 'Giải trình của Ban Chấp hành:';
        body.append(b, x.reason || '(không có)');
      }
      card.appendChild(body);
      frag.appendChild(card);
    });
    box.replaceChildren(frag);
  }

  // Chưa xác thực / ngoài thời gian xét duyệt: báo lý do và vô hiệu hóa trang
  function refreshLock() {
    var g = svGate('feedback');   // 'feedback': được xem thêm FEEDBACK_GRACE_DAYS ngày sau khi hết hạn
    var p = window.svProfile;
    var grace = !g && !!p && !p.isAdmin && reviewState() === 'after';   // đã hết hạn nộp nhưng còn xem được phản hồi
    var lock = $('fb-lock');
    lock.hidden = !g && !grace;
    if (g) lock.textContent = g.msg;
    else if (grace) lock.textContent = 'Đã hết thời gian nộp hồ sơ. Bạn vẫn xem được phản hồi đến ' + reviewFmt(reviewFeedbackEnd()) + ', sau đó trang sẽ đóng';
    var off = !!g;   // chưa xác thực hoặc ngoài thời gian: khóa cả trang
    svSetDisabled($('fb-tabs'), off);
    svSetDisabled(document.querySelector('.hs-grid'), off);
    svSetDisabled(document.querySelector('.fb-edit-row'), off || grace);   // hết hạn rồi thì không nộp bổ sung nữa
  }
  document.addEventListener('sv-profile', refreshLock);
  watchReview(refreshLock);

  function render() {
    renderTabs();
    $('fb-edit').href = 'ho-so.html#' + cur;
    if (!loaded) return;
    var list = filesOf(cur);
    renderFiles(list);
    renderAnswers(list);
  }

  async function load() {
    if (DEMO) {
      var ago = function (h) { return new Date(Date.now() - h * 3600e3).toISOString(); };
      subs = [
        { id: 'd1', criterion: 'dao-duc', file_name: 'diem-ren-luyen.pdf', file_size: 524288, status: 'approved', reason: null, created_at: ago(30), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd2', criterion: 'hoc-tap', file_name: 'bang-diem-hk1.pdf', file_size: 810000, status: 'approved', reason: null, created_at: ago(30), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd3', criterion: 'hoc-tap', file_name: 'giay-khen-hoc-tap.docx', file_size: 230000, status: 'rejected', reason: 'File thiếu dấu xác nhận của Khoa. Vui lòng nộp lại bản có dấu đỏ', created_at: ago(29), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd4', criterion: 'the-luc', file_name: 'giay-chung-nhan-the-duc.pdf', file_size: 410000, status: 'pending', reason: null, created_at: ago(3), reviewed_at: null, released_at: null },
        { id: 'd5', criterion: 'tinh-nguyen', file_name: 'mua-he-xanh.pdf', file_size: 650000, status: 'rejected', reason: 'Chưa thấy số giờ tình nguyện. Hãy bổ sung xác nhận từ đơn vị tổ chức', created_at: ago(28), reviewed_at: ago(5), released_at: ago(4) }
      ];
      loaded = true;
      return render();
    }
    var r = await sb.from('submissions').select('*').eq('student_id', uid).order('created_at', { ascending: false });
    if (r.error) {
      var msg = 'Không tải được phản hồi: ' + r.error.message + ' (đã chạy SQL đợt 5 chưa?)';
      renderTabs();
      empty($('fb-files'), msg); empty($('fb-answers'), msg);
      return;
    }
    subs = r.data;
    loaded = true;
    render();
  }
  render();
  await load();

  // BCH bấm Hoàn thành là kết quả hiện ngay, không cần tải lại trang
  sb.channel('fb-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: 'student_id=eq.' + uid }, load)
    .subscribe();
})();
