// Danh sách 6 mục hồ sơ: Bảng kê khai thành tích cá nhân + 5 tiêu chí SV5T (khóa cố định dùng trong hệ thống + tên mặc định).
// Tên và yêu cầu chi tiết sẽ được lấy từ trang Admin (bảng site_content); nếu chưa có thì dùng tên dưới đây.
var CRITERIA = [
  { key: 'ke-khai',     name: 'Bảng kê khai thành tích cá nhân', req: 'Tải lên Bảng kê khai thành tích cá nhân theo mẫu của Ban Chấp hành (có đầy đủ thông tin và chữ ký). Ban Chấp hành sẽ cập nhật hướng dẫn chi tiết tại đây.\n\nHãy đặt tên tệp đúng hướng dẫn rồi nộp ở khung bên phải' },
  { key: 'dao-duc',     name: 'Đạo đức tốt' },
  { key: 'hoc-tap',     name: 'Học tập tốt' },
  { key: 'the-luc',     name: 'Thể lực tốt' },
  { key: 'tinh-nguyen', name: 'Tình nguyện tốt' },
  { key: 'hoi-nhap',    name: 'Hội nhập tốt' }
];
var DEFAULT_REQ = 'Yêu cầu chi tiết của tiêu chí này do Ban Chấp hành cập nhật theo hướng dẫn xét Sinh viên 5 tốt hiện hành.\n\nHãy chuẩn bị minh chứng rõ ràng (ảnh chụp, file PDF hoặc file Word) rồi nộp ở khung bên phải';

// Lấy tên + yêu cầu từ site_content; trả về mảng cùng thứ tự CRITERIA
async function loadCriteria() {
  var out = CRITERIA.map(function (c) { return { key: c.key, name: c.name, req: c.req || DEFAULT_REQ, tpl: null }; });
  try {
    var r = await sb.from('site_content').select('*').eq('kind', 'criterion');
    if (!r.error && r.data) {
      r.data.forEach(function (x) {
        var c = out.filter(function (o) { return o.key === x.slug; })[0];
        if (!c) return;
        if (x.title) c.name = x.title;
        if (x.requirements && x.requirements.trim()) c.req = x.requirements;
        if (x.template_path) c.tpl = { path: x.template_path, name: x.template_name || 'bang-mau', size: x.template_size || 0 };
      });
    }
  } catch (e) {}
  return out;
}
