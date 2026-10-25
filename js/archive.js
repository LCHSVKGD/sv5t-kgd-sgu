// Hồ sơ đã được BCH đồng bộ về Drive: đọc dòng trong bảng archives và bật khung thông báo đỏ ở đầu trang.
async function loadArchive(uid) {
  try {
    var r = await sb.from('archives').select('*').eq('student_id', uid).maybeSingle();
    if (r.error) { console.error('Không đọc được trạng thái lưu trữ:', r.error.message); return null; }
    return r.data || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function renderArchiveBanner(row) {
  var box = document.getElementById('arch-banner');
  if (box) box.hidden = !row;
}
