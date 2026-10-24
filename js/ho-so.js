// Trang "Hồ sơ của tôi": sinh viên xem yêu cầu từng tiêu chí, nộp minh chứng và xem lịch sử nộp.
(async function () {
  var $ = function (id) { return document.getElementById(id); };
  var BUCKET = 'evidence';
  var MAX_SIZE = 10 * 1024 * 1024;
  var TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  var STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };

  var s = await sb.auth.getSession();
  if (!s.data.session) return;
  var uid = s.data.session.user.id;

  var criteria = await loadCriteria();
  await loadReviewWindow();   // thời gian xét duyệt do admin đặt
  var subs = [];
  var cur = (location.hash || '').replace('#', '');
  if (!criteria.some(function (c) { return c.key === cur; })) cur = criteria[0].key;
  var picked = [];
  var busy = false;

  function fmtDate(t) {
    var d = new Date(t);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('vi-VN');
  }
  function fmtSize(n) {
    if (!n) return '';
    return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  }
  function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  // Chưa được BCH "Hoàn thành" thì vẫn hiện "Chờ duyệt"
  function shown(x) { return x.status !== 'pending' && x.released_at ? x.status : 'pending'; }
  function crit(key) { return criteria.filter(function (c) { return c.key === key; })[0]; }

  // Chỉ nộp được khi: tài khoản đã được BCH xác thực VÀ đang trong thời gian xét duyệt (admin thì luôn được)
  function canSubmit() { var p = window.svProfile; return !!p && (p.isAdmin || !svGate()); }
  function refreshLock() {
    var g = svGate();
    var lock = $('hs-lock');
    lock.hidden = !g;
    if (g) lock.textContent = g.msg;
    // Chưa xác thực hoặc ngoài thời gian: vô hiệu hóa cả trang
    var off = !!g;
    svSetDisabled($('hs-tabs'), off);
    svSetDisabled(document.querySelector('.hs-grid'), off);
    updateSend();
  }
  document.addEventListener('sv-profile', refreshLock);
  watchReview(refreshLock);

  function renderTabs() {
    var box = document.createDocumentFragment();
    criteria.forEach(function (c) {
      var n = subs.filter(function (x) { return x.criterion === c.key; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.className = c.key === cur ? 'on' : '';
      b.append(c.name);
      var sm = document.createElement('small');
      sm.textContent = n ? n + ' tệp' : 'Chưa nộp';
      b.appendChild(sm);
      b.addEventListener('click', function () {
        cur = c.key;
        history.replaceState(null, '', '#' + cur);
        picked = []; $('hs-file').value = ''; renderPicked();
        render();
      });
      box.appendChild(b);
    });
    $('hs-tabs').replaceChildren(box);
  }

  async function openFile(sub) {
    var w = window.open('', '_blank');           // mở cửa sổ ngay để không bị chặn pop-up
    var r = await sb.storage.from(BUCKET).createSignedUrl(sub.file_path, 3600);
    if (r.error || !r.data) { if (w) w.close(); return alert('Chưa mở được tệp. Hãy thử lại'); }
    if (w) w.location = r.data.signedUrl; else location.href = r.data.signedUrl;
  }

  async function delFile(sub) {
    if (!canSubmit()) return alert('Đã ngoài thời gian xét duyệt nên không thể xóa tệp');
    if (!confirm('Xóa tệp "' + sub.file_name + '"?')) return;
    var d = await sb.from('submissions').delete().eq('id', sub.id);
    if (d.error) return alert('Chưa xóa được tệp. Hãy thử lại');
    sb.storage.from(BUCKET).remove([sub.file_path]);
    subs = subs.filter(function (x) { return x.id !== sub.id; });
    render();
  }

  function renderFiles() {
    var list = subs.filter(function (x) { return x.criterion === cur; });
    var box = $('hs-files');
    if (!list.length) {
      var p = document.createElement('p');
      p.className = 'hs-none';
      p.textContent = 'Bạn chưa nộp minh chứng nào cho tiêu chí này';
      return box.replaceChildren(p);
    }
    var frag = document.createDocumentFragment();
    list.forEach(function (x) {
      var card = document.createElement('div');
      card.className = 'hs-file';
      var top = document.createElement('div');
      top.className = 'hs-file-top';
      var name = document.createElement('button');
      name.type = 'button'; name.className = 'hs-file-name'; name.textContent = x.file_name;
      name.title = 'Bấm để mở tệp';
      name.addEventListener('click', function () { openFile(x); });
      var st = document.createElement('span');
      var sh = shown(x);
      st.className = 'st st-' + sh; st.textContent = STATUS[sh];
      top.append(name, st);
      if (sh !== 'approved') {
        var del = document.createElement('button');
        del.type = 'button'; del.className = 'hs-del'; del.textContent = 'Xóa';
        del.addEventListener('click', function () { delFile(x); });
        top.appendChild(del);
      }
      var meta = document.createElement('div');
      meta.className = 'hs-file-meta';
      meta.textContent = fmtDate(x.created_at) + (x.file_size ? ' · ' + fmtSize(x.file_size) : '');
      card.append(top, meta);
      if (sh === 'rejected' && x.reason) {
        var rs = document.createElement('div');
        rs.className = 'hs-reason';
        rs.textContent = 'Giải trình của BCH: ' + x.reason;
        card.appendChild(rs);
      }
      frag.appendChild(card);
    });
    box.replaceChildren(frag);
  }

  function render() {
    var c = crit(cur);
    $('hs-req-title').textContent = 'Yêu cầu: ' + c.name;
    $('hs-req').textContent = c.req;
    renderTabs();
    renderFiles();
    updateSend();
  }

  function renderPicked() {
    $('hs-picked').textContent = picked.length ? 'Đã chọn ' + picked.length + ' tệp: ' + picked.map(function (f) { return f.name; }).join(', ') : '';
    updateSend();
  }
  function updateSend() { $('hs-send').disabled = busy || !picked.length || !canSubmit(); }

  $('hs-file').addEventListener('change', function () {
    var ok = [], bad = [];
    Array.prototype.forEach.call(this.files, function (f) {
      if (!TYPES[extOf(f.name)]) bad.push(f.name + ' (định dạng không hỗ trợ)');
      else if (f.size > MAX_SIZE) bad.push(f.name + ' (lớn hơn 10 MB)');
      else if (f.size === 0) bad.push(f.name + ' (tệp trống)');
      else ok.push(f);
    });
    if (bad.length) alert('Không nhận các tệp sau:\n- ' + bad.join('\n- '));
    picked = ok;
    if (!ok.length) this.value = '';
    renderPicked();
  });

  $('hs-send').addEventListener('click', async function () {
    if (busy || !picked.length) return;
    if (!canSubmit()) return alert((svGate() || {}).msg || 'Hiện chưa nộp được hồ sơ');
    busy = true; updateSend();
    var btn = $('hs-send');
    var failed = [];
    for (var i = 0; i < picked.length; i++) {
      var f = picked[i];
      btn.textContent = 'Đang gửi ' + (i + 1) + '/' + picked.length + '...';
      var ext = extOf(f.name);
      var path = uid + '/' + cur + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      var up = await sb.storage.from(BUCKET).upload(path, f, { contentType: TYPES[ext], cacheControl: '3600' });
      if (up.error) { console.error(up.error.message); failed.push(f.name); continue; }
      var ins = await sb.from('submissions').insert({ student_id: uid, criterion: cur, file_name: f.name, file_path: path, file_type: TYPES[ext], file_size: f.size }).select().single();
      if (ins.error) {
        console.error(ins.error.message);
        sb.storage.from(BUCKET).remove([path]);
        failed.push(f.name); continue;
      }
      subs.unshift(ins.data);
    }
    busy = false;
    btn.textContent = 'Gửi minh chứng';
    picked = []; $('hs-file').value = ''; renderPicked();
    render();
    if (failed.length) alert('Chưa gửi được: ' + failed.join(', ') + '.\nHãy kiểm tra mạng, định dạng tệp và đã chạy SQL đợt 5 trong Supabase chưa');
  });

  async function load() {
    var r = await sb.from('submissions').select('*').eq('student_id', uid).order('created_at', { ascending: false });
    if (r.error) {
      var p = document.createElement('p');
      p.className = 'hs-none';
      p.textContent = 'Không tải được lịch sử nộp: ' + r.error.message + ' (đã chạy SQL đợt 5 chưa?)';
      $('hs-files').replaceChildren(p);
      renderTabs();
      return;
    }
    subs = r.data;
    render();
  }

  refreshLock();
  render();
  await load();

  // Admin duyệt xong là trạng thái đổi ngay, không cần tải lại trang
  sb.channel('hs-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: 'student_id=eq.' + uid }, function () { if (!busy) load(); })
    .subscribe();
})();
