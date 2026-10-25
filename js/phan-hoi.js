// Trang "Phản hồi xét duyệt": 6 mục ở thanh ngang; minh chứng đã nộp (nhóm theo tiêu chuẩn) bên trái, kết quả + giải trình của BCH bên phải.
// Kết quả chỉ hiện sau khi BCH bấm "Hoàn thành & gửi phản hồi" (cột released_at của tệp và của kết quả tiêu chuẩn/tiêu chí).
// Tiêu chí Đạt hiện xanh, Chưa đạt hiện đỏ.
(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var BUCKET = 'evidence';
  var STATUS = { pending: 'Chờ duyệt', approved: 'Đạt', rejected: 'Không đạt' };
  var IMG = /\.(png|jpe?g|webp)$/i;

  var s = await sb.auth.getSession();
  if (!s.data.session) return;
  var uid = s.data.session.user.id;

  var criteria = await loadCriteria();
  await loadReviewWindow();   // thời gian xét duyệt do admin đặt
  var subs = [];
  var marks = [];
  var cur = (location.hash || '').replace('#', '');
  if (!criteria.some(function (c) { return c.key === cur; })) cur = criteria[0].key;
  var loaded = false;
  var archive = null;   // có dòng = BCH đã đồng bộ hồ sơ về Drive
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
  function crit(key) { return criteria.filter(function (c) { return c.key === key; })[0]; }
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
    if (sub.archived_at) return alert('Tệp này đã được Ban Chấp hành lưu trữ');
    if (DEMO) return alert('Đang xem thử nên chưa mở được tệp');
    var w = window.open('', '_blank');
    var r = await sb.storage.from(BUCKET).createSignedUrl(sub.file_path, 3600);
    if (r.error || !r.data) { if (w) w.close(); return alert('Chưa mở được tệp. Hãy thử lại'); }
    if (w) w.location = r.data.signedUrl; else location.href = r.data.signedUrl;
  }

  function critVerdict(c) { var m = markShown(marks, c.key, SEC_TONG); return m ? m.status : ''; }
  function tabNote(c) {
    var v = critVerdict(c);
    if (v) return CRIT_MARK_LABEL[v];
    return filesOf(c.key).length ? 'Chờ phản hồi' : 'Chưa nộp';
  }

  function renderTabs() {
    var frag = document.createDocumentFragment();
    criteria.forEach(function (c) {
      var v = critVerdict(c);
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.className = (c.key === cur ? 'on' : '') + (v === 'approved' ? ' v-ok' : v === 'rejected' ? ' v-bad' : '');
      b.append(c.name);
      var sm = document.createElement('small');
      sm.textContent = tabNote(c);
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

  function fileCard(x, num) {
    var card = document.createElement('div');
    card.className = 'hs-file fb-file ' + shownStatus(x);
    var top = document.createElement('div');
    top.className = 'hs-file-top';
    var name = document.createElement('button');
    name.type = 'button'; name.className = 'hs-file-name';
    name.textContent = num + '. ' + x.file_name;
    if (x.archived_at) { name.disabled = true; name.title = 'Đã được Ban Chấp hành lưu trữ'; }
    else { name.title = 'Bấm để mở tệp'; name.addEventListener('click', function () { openFile(x); }); }
    var st = document.createElement('span');
    var sh = shownStatus(x);
    st.className = 'st st-' + sh; st.textContent = STATUS[sh];
    top.append(name, st);
    var meta = document.createElement('div');
    meta.className = 'hs-file-meta';
    meta.textContent = 'Nộp ' + fmtDate(x.created_at) + (x.file_size ? ' · ' + fmtSize(x.file_size) : '') + (x.archived_at ? ' · Đã lưu trữ' : '');
    card.append(top, meta);
    if (IMG.test(x.file_name || '') && !x.archived_at && !DEMO) {
      var img = document.createElement('img');
      img.className = 'fb-thumb'; img.alt = 'Xem trước ' + x.file_name; img.loading = 'lazy'; img.hidden = true;
      img.addEventListener('click', function () { openFile(x); });
      card.appendChild(img);
      sb.storage.from(BUCKET).createSignedUrl(x.file_path, 3600).then(function (r) {
        if (r.data && r.data.signedUrl) { img.src = r.data.signedUrl; img.hidden = false; }
      });
    }
    return card;
  }

  // Bên trái: các tệp đã nộp, nhóm theo tiêu chuẩn (ảnh hiện xem trước, tệp khác bấm để mở)
  function renderFiles(c, list) {
    var box = $('fb-files');
    if (!list.length) return empty(box, 'Bạn chưa nộp minh chứng nào cho tiêu chí này');
    var frag = document.createDocumentFragment();
    c.sections.forEach(function (sec) {
      var inSec = list.filter(function (x) { return subSection(c, x) === sec.id; });
      var group = document.createElement('div');
      group.className = 'fb-group';
      if (c.sections.length > 1) {
        var head = document.createElement('div');
        head.className = 'fb-group-head';
        var h = document.createElement('b');
        h.textContent = sec.name;
        head.appendChild(h);
        var m = markShown(marks, c.key, sec.id);
        var chip = document.createElement('span');
        chip.className = 'st ' + (m ? 'st-' + m.status : (inSec.length ? 'st-pending' : 'st-none'));
        chip.textContent = m ? MARK_LABEL[m.status] : (inSec.length ? 'Chờ phản hồi' : 'Chưa nộp');
        head.appendChild(chip);
        group.appendChild(head);
        if (!inSec.length) {
          var none = document.createElement('p');
          none.className = 'fb-ans-wait';
          none.textContent = 'Chưa nộp minh chứng cho tiêu chuẩn này';
          group.appendChild(none);
        }
      }
      inSec.forEach(function (x) { group.appendChild(fileCard(x, list.indexOf(x) + 1)); });
      frag.appendChild(group);
    });
    box.replaceChildren(frag);
  }

  function verdictCard(title, status, label, reason) {
    var card = document.createElement('div');
    card.className = 'fb-verdict ' + status;
    var top = document.createElement('div');
    top.className = 'fb-verdict-top';
    var b = document.createElement('b');
    b.textContent = title;
    var st = document.createElement('span');
    st.className = 'st st-' + status; st.textContent = label;
    top.append(b, st);
    card.appendChild(top);
    if (reason) {
      var p = document.createElement('p');
      p.textContent = 'Giải trình của Ban Chấp hành: ' + reason;
      card.appendChild(p);
    }
    return card;
  }

  // Bên phải: kết quả tiêu chí, kết quả từng tiêu chuẩn, giải trình cho từng tệp chưa đạt (đánh số khớp với bên trái)
  function renderAnswers(c, list) {
    var box = $('fb-answers');
    var frag = document.createDocumentFragment();
    var any = false;

    var mt = markShown(marks, c.key, SEC_TONG);
    if (mt) { frag.appendChild(verdictCard('Kết quả tiêu chí: ' + c.name, mt.status, CRIT_MARK_LABEL[mt.status], mt.reason)); any = true; }

    if (c.sections.length > 1) {
      c.sections.forEach(function (sec) {
        var m = markShown(marks, c.key, sec.id);
        if (!m) return;
        frag.appendChild(verdictCard(sec.name, m.status, MARK_LABEL[m.status], m.reason));
        any = true;
      });
    }

    list.forEach(function (x, i) {
      var sh = shownStatus(x);
      if (sh === 'approved') return;   // tệp đạt thì không cần giải trình
      var card = document.createElement('div');
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
      } else {
        body.className = 'hs-reason';
        var b = document.createElement('b');
        b.textContent = 'Giải trình của Ban Chấp hành:';
        body.append(b, x.reason || '(không có)');
      }
      card.appendChild(body);
      frag.appendChild(card);
      any = true;
    });

    if (!any) return empty(box, list.length ? 'Ban Chấp hành chưa gửi phản hồi cho tiêu chí này' : 'Chưa có hồ sơ ở tiêu chí này nên chưa có phản hồi');
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
    var c = crit(cur);
    var list = filesOf(cur);
    renderFiles(c, list);
    renderAnswers(c, list);
  }

  async function load() {
    if (DEMO) {
      var ago = function (h) { return new Date(Date.now() - h * 3600e3).toISOString(); };
      subs = [
        { id: 'd1', criterion: 'dao-duc', section: 'bat-buoc', file_name: 'diem-ren-luyen.pdf', file_size: 524288, status: 'approved', reason: null, created_at: ago(30), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd1b', criterion: 'dao-duc', section: 'khac', file_name: 'giay-khen-doan.pdf', file_size: 330000, status: 'approved', reason: null, created_at: ago(30), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd2', criterion: 'hoc-tap', section: 'bat-buoc', file_name: 'bang-diem-hk1.pdf', file_size: 810000, status: 'approved', reason: null, created_at: ago(30), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd3', criterion: 'hoc-tap', section: 'khac', file_name: 'giay-khen-hoc-tap.docx', file_size: 230000, status: 'rejected', reason: 'File thiếu dấu xác nhận của Khoa. Vui lòng nộp lại bản có dấu đỏ', created_at: ago(29), reviewed_at: ago(5), released_at: ago(4) },
        { id: 'd4', criterion: 'the-luc', section: 'chung', file_name: 'giay-chung-nhan-the-duc.pdf', file_size: 410000, status: 'pending', reason: null, created_at: ago(3), reviewed_at: null, released_at: null },
        { id: 'd5', criterion: 'tinh-nguyen', section: 'chung', file_name: 'mua-he-xanh.pdf', file_size: 650000, status: 'rejected', reason: 'Chưa thấy số giờ tình nguyện. Hãy bổ sung xác nhận từ đơn vị tổ chức', created_at: ago(28), reviewed_at: ago(5), released_at: ago(4) }
      ];
      marks = [
        { criterion: 'dao-duc', section: 'bat-buoc', status: 'approved', reason: null, released_at: ago(4) },
        { criterion: 'dao-duc', section: 'khac', status: 'approved', reason: null, released_at: ago(4) },
        { criterion: 'dao-duc', section: SEC_TONG, status: 'approved', reason: null, released_at: ago(4) },
        { criterion: 'hoc-tap', section: 'bat-buoc', status: 'approved', reason: null, released_at: ago(4) },
        { criterion: 'hoc-tap', section: 'khac', status: 'missing', reason: 'Cần nộp thêm 01 minh chứng hợp lệ ở tiêu chuẩn khác', released_at: ago(4) },
        { criterion: 'hoc-tap', section: SEC_TONG, status: 'rejected', reason: 'Chưa đủ tiêu chuẩn khác. Bạn nộp bổ sung rồi BCH sẽ xét lại', released_at: ago(4) },
        { criterion: 'tinh-nguyen', section: SEC_TONG, status: 'rejected', reason: 'Chưa đủ 05 ngày tình nguyện có xác nhận', released_at: ago(4) }
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
    var mk = await sb.from('review_marks').select('*').eq('student_id', uid);
    if (mk.error) { console.error('Không tải được kết quả tiêu chuẩn:', mk.error.message + ' (đã chạy SQL tieu-chuan-ket-qua.sql chưa?)'); marks = []; }
    else marks = mk.data;
    archive = await loadArchive(uid);
    renderArchiveBanner(archive);
    var er = document.querySelector('.fb-edit-row');
    if (er) er.style.display = archive ? 'none' : '';
    loaded = true;
    render();
  }
  render();
  await load();

  // BCH bấm Hoàn thành là kết quả hiện ngay, không cần tải lại trang
  sb.channel('fb-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: 'student_id=eq.' + uid }, load)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'review_marks', filter: 'student_id=eq.' + uid }, load)
    .subscribe();
})();
