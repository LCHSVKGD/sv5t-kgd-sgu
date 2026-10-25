// Kết nối web với Supabase. Khóa "publishable" được phép nằm trong code web.
var SUPABASE_URL = 'https://hefcjivkcqlezfunlhtw.supabase.co';
var SUPABASE_KEY = 'sb_publishable_seo1TAxIPUfiJRHmanLklQ_f5em_vAn';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Thời hạn một lần đăng nhập =====
// Sau SESSION_MAX_MINUTES phút kể từ lúc đăng nhập bằng mật khẩu thì phải đăng nhập lại (đổi số này nếu muốn dài/ngắn hơn).
// Mốc thời gian lấy từ last_sign_in_at của Supabase: việc thư viện tự gia hạn token ngầm KHÔNG làm mốc này dời đi.
var SESSION_MAX_MINUTES = 60;
function svSessionLeftMs(session) {
  var t = Date.parse(session && session.user && session.user.last_sign_in_at);
  if (isNaN(t)) return Infinity;   // không đọc được mốc đăng nhập thì không ép đăng xuất
  return t + SESSION_MAX_MINUTES * 60000 - Date.now();
}
async function svSignOutExpired() {
  try { await sb.auth.signOut(); } catch (e) {}
  location.replace('dang-nhap.html?het-phien=1');
}
