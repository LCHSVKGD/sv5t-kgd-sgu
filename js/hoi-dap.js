(async function () {
  var $ = function (id) { return document.getElementById(id); };

  $('logout').addEventListener('click', async function (e) {
    e.preventDefault(); await sb.auth.signOut(); location.href = 'index.html';
  });

  var body = $('chat-body'), ta = $('chat-input'), btn = $('chat-send'), empty = $('chat-empty');
  var seen = {};

  // Trên màn hình hẹp, câu gợi ý trong ô nhập ngắn lại để không bị cắt chữ
  ta.placeholder = window.matchMedia('(max-width: 600px)').matches ? 'Nhập tin nhắn...' : 'Nhập điều bạn muốn trao đổi...';
  // Chưa đăng nhập thì không có tin nhắn để hiện: báo rõ thay vì tự chuyển trang
  var s = await sb.auth.getSession();
  if (!s.data.session) {
    ta.disabled = true;
    ta.placeholder = 'Đăng nhập để nhắn tin...';
    empty.textContent = 'Bạn cần đăng nhập để nhắn tin với Ban Chấp hành ';
    var a = document.createElement('a');
    a.href = 'dang-nhap.html';
    a.className = 'chat-login';
    a.textContent = 'Đăng nhập';
    empty.appendChild(a);
    return;
  }
  var uid = s.data.session.user.id;

  function fmt(t) {
    var d = new Date(t);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('vi-VN');
  }
  function toBottom() { body.scrollTop = body.scrollHeight; }

  function add(m) {
    if (seen[m.id]) return;
    seen[m.id] = true;
    if (empty) { empty.remove(); empty = null; }
    var row = document.createElement('div');
    row.className = 'msg ' + (m.sender === 'student' ? 'me' : 'them');
    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = m.body;
    var time = document.createElement('span');
    time.className = 'msg-time';
    time.textContent = fmt(m.created_at);
    row.appendChild(bubble); row.appendChild(time);
    body.appendChild(row);
    toBottom();
  }

  // Tải lịch sử tin nhắn
  var r = await sb.from('messages').select('*').eq('student_id', uid).order('created_at', { ascending: true }).limit(200);
  if (r.error) {
    console.error('Không tải được bảng messages:', r.error.message);
    empty.textContent = 'Không tải được tin nhắn. Hãy tải lại trang';
  } else {
    r.data.forEach(add);
  }

  // Nhận tin mới (BCH trả lời) ngay lập tức
  sb.channel('chat-' + uid)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'student_id=eq.' + uid }, function (p) { add(p.new); })
    .subscribe();

  // Ô nhập: tự cao lên theo nội dung (tối đa 5 dòng), bật/tắt nút gửi
  function resize() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    btn.disabled = !ta.value.trim();
  }
  ta.addEventListener('input', resize);

  async function send() {
    var text = ta.value.trim();
    if (!text) return;
    btn.disabled = true;
    ta.value = ''; resize();
    var res = await sb.from('messages').insert({ student_id: uid, sender: 'student', body: text }).select().single();
    if (res.error) {
      console.error('Không gửi được tin nhắn:', res.error.message);
      ta.value = text; resize();
      alert('Chưa gửi được tin nhắn. Hãy thử lại');
      return;
    }
    add(res.data);
  }

  $('chat-form').addEventListener('submit', function (e) { e.preventDefault(); send(); });

  // Enter = gửi, Shift+Enter = xuống dòng (bỏ qua khi đang gõ dấu tiếng Việt)
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); }
  });
})();
