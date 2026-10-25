// Cấu trúc hồ sơ: 6 mục (Bảng kê khai thành tích cá nhân + 5 tiêu chí SV5T).
// Mỗi mục có 1 hoặc nhiều "tiêu chuẩn" (các ô mô tả bên trái trang Hồ sơ của tôi). Sinh viên nộp minh chứng riêng cho từng tiêu chuẩn.
//   - Đạo đức, Học tập: 2 tiêu chuẩn (Bắt buộc / Khác)
//   - Hội nhập: 3 tiêu chuẩn (Ngoại ngữ / Kỹ năng / Hoạt động hội nhập), mỗi tiêu chuẩn đạt ít nhất 01
//   - Bảng kê khai, Thể lực, Tình nguyện: 1 tiêu chuẩn duy nhất (id 'chung')
// Nội dung yêu cầu mặc định lấy theo Hướng dẫn số 01/HD-LCH; Ban Chấp hành sửa được ở trang Admin (bảng site_content).
var CRITERIA = [
  { key: 'ke-khai', name: 'Bảng kê khai thành tích cá nhân', sections: [
    { id: 'chung', name: 'Bảng kê khai', hint: '', req: 'Tải lên Bảng kê khai thành tích cá nhân theo mẫu của Ban Chấp hành (có đầy đủ thông tin và chữ ký). Ban Chấp hành sẽ cập nhật hướng dẫn chi tiết tại đây.\n\nHãy đặt tên tệp đúng hướng dẫn rồi nộp ở khung bên phải' }
  ] },
  { key: 'dao-duc', name: 'Đạo đức tốt', sections: [
    { id: 'bat-buoc', name: 'Tiêu chuẩn bắt buộc', hint: 'Phải đạt tất cả', req:
      '- Có lòng yêu nước, trung thành với mục tiêu, lý tưởng cách mạng của Đảng.\n' +
      '- Không vi phạm pháp luật và các quy chế, nội quy của trường, lớp, quy định của địa phương cư trú, nơi công cộng.\n' +
      '- Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100).\n' +
      '- Kết quả phân tích chất lượng Đoàn viên cuối năm: Hoàn thành tốt nhiệm vụ trở lên.' },
    { id: 'khac', name: 'Tiêu chuẩn khác', hint: 'Đạt ít nhất 01', req:
      '- Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh từ cấp khoa trở lên.\n' +
      '- Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác - Lênin, tư tưởng Hồ Chí Minh từ cấp khoa trở lên.\n' +
      '- Đạt danh hiệu "Thanh niên tiên tiến làm theo lời Bác" các cấp; Sao tháng "Thanh niên SGU nghĩ đúng - sống đẹp" hoặc là điển hình được biểu dương trong việc thực hiện "Đẩy mạnh học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh" từ cấp khoa trở lên.\n' +
      '- Có hành động dũng cảm cứu người bị nạn, bắt cướp, giúp người neo đơn, người nghèo, người gặp khó khăn, hoạn nạn trong tình trạng nguy hiểm và cấp thiết được khen thưởng, biểu dương từ cấp trường, cấp xã, phường trở lên hoặc được nêu gương trên các phương tiện truyền thông đại chúng.\n' +
      '- Tham gia các chương trình hoặc cuộc thi tìm hiểu về lịch sử, truyền thống của Đảng, Nhà nước, chủ quyền biển đảo và tổ chức Đoàn Thanh niên, Hội Sinh viên,... được tổ chức từ cấp khoa trở lên.' }
  ] },
  { key: 'hoc-tap', name: 'Học tập tốt', sections: [
    { id: 'bat-buoc', name: 'Tiêu chuẩn bắt buộc', hint: 'Phải đạt tất cả', req:
      '- Có động cơ, thái độ học tập đúng đắn; không gian lận trong thi cử, không nợ môn, học phần hoặc tín chỉ trong năm học.\n' +
      '- Điểm trung bình học tập cả năm học đạt từ 3.0/4.0 trở lên.\n\n' +
      'Lưu ý: trường hợp không đủ điểm học tập trong tiêu chuẩn bắt buộc sẽ xem xét thêm học bổng khuyến khích học tập trong năm học 2025 - 2026 từ mức 2 trở lên.' },
    { id: 'khac', name: 'Tiêu chuẩn khác', hint: 'Đạt ít nhất 01', req:
      '- Tham gia và có chứng nhận hoạt động tích cực câu lạc bộ học thuật cấp khoa trở lên năm học 2025 - 2026.\n' +
      '- Có đề tài nghiên cứu khoa học sinh viên hoặc khóa luận tốt nghiệp trong năm học được hội đồng khoa học từ cấp khoa trở lên nghiệm thu đánh giá từ loại Đạt trở lên.\n' +
      '- Tham gia và đạt giải trong cuộc thi học thuật cấp khoa hoặc các cuộc thi học thuật do nhà trường, thành phố tổ chức.\n' +
      '- Tham gia và đạt giải thưởng trong các cuộc thi ý tưởng sáng tạo từ cấp khoa trở lên.\n' +
      '- Có ít nhất 01 bài viết về lĩnh vực chuyên môn đang theo học, đăng tải trên các sản phẩm của các cơ quan truyền thông uy tín hoặc các bài báo, tạp chí khoa học chuyên ngành của trường hoặc có bài tham luận tham gia các hội thảo khoa học cấp khoa trở lên.' }
  ] },
  { key: 'the-luc', name: 'Thể lực tốt', sections: [
    { id: 'chung', name: 'Tiêu chuẩn thể lực', hint: 'Đạt ít nhất 01', req:
      '- Có giấy chứng nhận "Sinh viên khỏe", "Thanh niên khỏe" của năm học 2025 - 2026 từ cấp khoa trở lên (tiêu chuẩn cụ thể theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT). Nếu hoạt động sát hạch do đơn vị khác tổ chức, hãy cung cấp minh chứng đáp ứng tiêu chuẩn cụ thể theo hướng dẫn liên tịch này.\n' +
      '- Tham gia và đạt giải các giải thể thao cấp khoa trở lên.\n' +
      '- Có chứng nhận tham gia tích cực ít nhất 01 câu lạc bộ thể thao của trường.\n' +
      '- Là thành viên đội tuyển cấp trường các môn thể dục thể thao.\n' +
      '- Điểm trung bình các học phần thể chất đã hoàn thành từ 7.0/10 trở lên.\n\n' +
      'Đối với sinh viên khuyết tật: tập thể dục hàng ngày và rèn luyện ít nhất 1 môn thể thao dành cho người khuyết tật.' }
  ] },
  { key: 'tinh-nguyen', name: 'Tình nguyện tốt', sections: [
    { id: 'chung', name: 'Tiêu chuẩn tình nguyện', hint: 'Đạt ít nhất 01', req:
      '- Được khen thưởng từ cấp trường trở lên về hoạt động tình nguyện.\n' +
      '- Tham gia và nhận giấy chứng nhận hoàn thành một trong các chiến dịch, chương trình: Mùa hè xanh, Xuân tình nguyện, Tiếp sức mùa thi, Tiếp sức đến trường, chuỗi hoạt động tình nguyện cấp khoa, cấp cụm hoặc Chi Đoàn.\n' +
      '- Tham gia ít nhất 05 ngày hoạt động tình nguyện/năm (tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng đồng; 03 lượt quyên góp được tính bằng 01 ngày tình nguyện).\n\n' +
      'Tất cả các trường hợp phải có giấy xác nhận.' }
  ] },
  { key: 'hoi-nhap', name: 'Hội nhập tốt', sections: [
    { id: 'ngoai-ngu', name: 'Về ngoại ngữ', hint: 'Đạt ít nhất 01', req:
      '- Đạt chứng chỉ tiếng Anh trình độ B1 (theo khung tham chiếu châu Âu) hoặc tương đương hoặc chứng chỉ ngoại ngữ khác ở trình độ tương đương trở lên (không xét thời hạn chứng chỉ).\n' +
      '- Có điểm trung bình học phần tiếng Anh từ năm nhất đến thời điểm xét đạt 7.0/10 điểm trở lên.\n' +
      '- Tham gia và đạt giải khuyến khích trở lên các cuộc thi Ngoại ngữ (các cuộc thi tìm hiểu Ngoại ngữ hoặc sử dụng Ngoại ngữ để trình bày) từ cấp khoa trở lên.' },
    { id: 'ky-nang', name: 'Về kỹ năng', hint: 'Đạt ít nhất 01', req:
      '- Tham gia và có giấy chứng nhận hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội từ cấp khoa trở lên.\n' +
      '- Tham gia và có giấy chứng nhận hoàn thành ít nhất 01 khóa trang bị kỹ năng đúng với chuyên ngành của sinh viên.\n' +
      '- Đạt thành tích trong các cuộc thi về kỹ năng từ cấp khoa trở lên.\n' +
      '- Tham gia và có chứng nhận hoạt động tích cực ít nhất 01 CLB - đội - nhóm về kỹ năng từ cấp khoa trở lên.\n' +
      '- Nhận giấy khen của Đoàn Thanh niên - Hội Sinh viên trường trở lên khen thưởng về thành tích xuất sắc trong công tác Đoàn và phong trào thanh niên hoặc công tác Hội và phong trào sinh viên.\n' +
      '- Nhận thư khen của Chi ủy - Lãnh đạo khoa về thành tích xuất sắc trong công tác Đoàn - Hội và phong trào thanh niên - sinh viên khoa trong năm học; các cuộc thi do khoa tổ chức.' },
    { id: 'hoi-nhap', name: 'Về hoạt động hội nhập', hint: 'Đạt ít nhất 01', req:
      '- Tham gia tích cực ít nhất 01 hoạt động hội nhập từ cấp khoa trở lên.\n' +
      '- Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hội thảo với thanh niên, sinh viên quốc tế trong và ngoài nước.' }
  ] }
];
var DEFAULT_REQ = 'Yêu cầu chi tiết của tiêu chuẩn này do Ban Chấp hành cập nhật theo hướng dẫn xét Sinh viên 5 tốt hiện hành.\n\nHãy chuẩn bị minh chứng rõ ràng (ảnh chụp, file PDF hoặc file Word) rồi nộp ở khung bên phải';

// ----- Kết quả do Ban Chấp hành chọn (bảng review_marks) -----
// Mỗi dòng: student_id, criterion, section, status, reason, released_at.
//   section = 'tong'  -> kết quả của CẢ TIÊU CHÍ:  approved (Đạt) | rejected (Chưa đạt)
//   section = mã tiêu chuẩn (bat-buoc, khac, ...) -> kết quả của TIÊU CHUẨN: approved (Đạt) | missing (Thiếu) | rejected (Không đạt)
var SEC_TONG = 'tong';
var MARK_LABEL = { approved: 'Đạt', missing: 'Thiếu', rejected: 'Không đạt' };
var CRIT_MARK_LABEL = { approved: 'Đạt', rejected: 'Chưa đạt' };

// Mã tiêu chuẩn của một tệp đã nộp (tệp không ghi mã thì tính vào tiêu chuẩn đầu tiên của mục đó)
function subSection(c, x) {
  if (x && x.section && c.sections.some(function (s) { return s.id === x.section; })) return x.section;
  return c.sections[0].id;
}
function markFind(marks, crit, sec) {
  return (marks || []).filter(function (m) { return m.criterion === crit && m.section === sec; })[0] || null;
}
// Sinh viên chỉ thấy kết quả sau khi Ban Chấp hành bấm "Hoàn thành & gửi phản hồi" (có released_at)
function markShown(marks, crit, sec) {
  var m = markFind(marks, crit, sec);
  return m && m.released_at ? m : null;
}

// Yêu cầu của mục nhiều tiêu chuẩn được lưu chung 1 ô văn bản, ngăn cách bằng dòng @@mã-tiêu-chuẩn@@
function parseReq(text, c) {
  var out = {};
  text = String(text || '').trim();
  if (!text) return out;
  if (c.sections.length === 1) { out[c.sections[0].id] = text; return out; }
  var re = /^@@([a-z0-9-]+)@@[ \t]*$/gm, m, found = [];
  while ((m = re.exec(text))) found.push({ id: m[1], end: re.lastIndex, start: m.index });
  found.forEach(function (f, i) {
    var body = text.slice(f.end, i + 1 < found.length ? found[i + 1].start : text.length).trim();
    if (body) out[f.id] = body;
  });
  return out;
}
function joinReq(c, texts) {
  if (c.sections.length === 1) return String(texts[c.sections[0].id] || '').trim();
  var any = c.sections.some(function (s) { return String(texts[s.id] || '').trim(); });
  if (!any) return '';
  return c.sections.map(function (s) { return '@@' + s.id + '@@\n' + String(texts[s.id] || '').trim(); }).join('\n\n');
}

// Lấy tên + yêu cầu từ site_content; trả về mảng cùng thứ tự CRITERIA, mỗi mục có sections[].req đã điền
async function loadCriteria() {
  var out = CRITERIA.map(function (c) {
    return { key: c.key, name: c.name, tpl: null, sections: c.sections.map(function (s) { return { id: s.id, name: s.name, hint: s.hint, req: s.req || DEFAULT_REQ }; }) };
  });
  try {
    var r = await sb.from('site_content').select('*').eq('kind', 'criterion');
    if (!r.error && r.data) {
      r.data.forEach(function (x) {
        var c = out.filter(function (o) { return o.key === x.slug; })[0];
        if (!c) return;
        if (x.title) c.name = x.title;
        var texts = parseReq(x.requirements, c);
        c.sections.forEach(function (s) { if (texts[s.id]) s.req = texts[s.id]; });
        if (x.template_path && c.key === 'ke-khai') c.tpl = { path: x.template_path, name: x.template_name || 'bang-mau', size: x.template_size || 0 };
      });
    }
  } catch (e) {}
  out.forEach(function (c) { c.req = c.sections[0].req; });
  return out;
}
