var DOC_BUCKET = 'documents';
var DOC_MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

function docExt(name) {
  var m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}
function docLabel(name) { return (docExt(name) || 'file').toUpperCase(); }
function docCanPreview(name) { return !!DOC_MIME[docExt(name)]; }
function docSize(n) {
  if (!n) return '';
  return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
}

async function docSignedUrl(path, downloadName) {
  var r = await sb.storage.from(DOC_BUCKET).createSignedUrl(path, 3600, downloadName ? { download: downloadName } : undefined);
  if (r.error) throw r.error;
  return r.data.signedUrl;
}

async function docBlobUrl(path, name) {
  var res = await fetch(await docSignedUrl(path));
  if (!res.ok) throw new Error('Không tải được tệp');
  var blob = await res.blob();
  return URL.createObjectURL(new Blob([blob], { type: DOC_MIME[docExt(name)] || blob.type }));
}

async function docDownload(path, name) {
  try {
    var a = document.createElement('a');
    a.href = await docSignedUrl(path, name);
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    console.error(e);
    alert('Chưa tải được tệp. Hãy thử lại');
  }
}

async function docOpenTab(path, name, title) {
  if (docExt(name) === 'pdf' && docIsMobile()) return docPdfModal(title, path, name);
  var w = window.open('', '_blank');
  try {
    var u = await docBlobUrl(path, name);
    if (w) w.location.href = u; else location.href = u;
  } catch (e) {
    console.error(e);
    if (w) w.close();
    alert('Chưa mở được tệp. Hãy thử lại hoặc bấm Tải về');
  }
}

// ===== GOOGLE DRIVE: nhúng link Drive để xem ngay trên web =====
// Chấp nhận link tệp Drive, Google Docs, Sheets, Slides. Tệp phải để quyền "Bất kỳ ai có đường liên kết".
function docDriveInfo(url) {
  url = (url || '').trim();
  if (!/^https:\/\/(drive|docs)\.google\.com\//i.test(url)) return null;
  if (/\/folders\//i.test(url)) return null;
  var m = /\/d\/([a-zA-Z0-9_-]{10,})/.exec(url) || /[?&]id=([a-zA-Z0-9_-]{10,})/.exec(url);
  if (!m) return null;
  var id = m[1];
  if (/docs\.google\.com\/document\//i.test(url)) {
    return { id: id, preview: 'https://docs.google.com/document/d/' + id + '/preview', download: 'https://docs.google.com/document/d/' + id + '/export?format=pdf' };
  }
  if (/docs\.google\.com\/spreadsheets\//i.test(url)) {
    return { id: id, preview: 'https://docs.google.com/spreadsheets/d/' + id + '/preview', download: 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx' };
  }
  if (/docs\.google\.com\/presentation\//i.test(url)) {
    return { id: id, preview: 'https://docs.google.com/presentation/d/' + id + '/embed', download: 'https://docs.google.com/presentation/d/' + id + '/export/pptx' };
  }
  return { id: id, preview: 'https://drive.google.com/file/d/' + id + '/preview', download: 'https://drive.google.com/uc?export=download&id=' + id };
}

function docDriveDownload(url) {
  var info = docDriveInfo(url);
  var a = document.createElement('a');
  a.href = info ? info.download : url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Một mục có thể là tệp tải lên Supabase (file_path) hoặc link Drive (drive_url)
function docHasFile(it) { return !!(it && (it.file_path || it.drive_url)); }
function docItemName(it) { return it.file_name || (it.drive_url ? 'Tệp trên Google Drive' : ''); }
function docItemLabel(it) { return (it.drive_url && !it.file_name) ? 'GOOGLE DRIVE' : docLabel(it.file_name); }
function docItemCanPreview(it) { return it.drive_url ? !!docDriveInfo(it.drive_url) : docCanPreview(it.file_name); }
function docItemDownload(it) {
  if (it.drive_url) return docDriveDownload(it.drive_url);
  return docDownload(it.file_path, it.file_name);
}

// ===== XEM PDF NHIỀU TRANG TRÊN ĐIỆN THOẠI =====
// Trình duyệt điện thoại (iOS Safari, Chrome Android) chỉ hiện trang 1 của PDF khi nhúng trong khung iframe
// và không cuộn được. Nên trên điện thoại, PDF được vẽ từng trang bằng thư viện PDF.js.
var PDFJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
var _pdfjsLoading = null;

function docIsMobile() {
  var ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function pdfLoadLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjsLoading) return _pdfjsLoading;
  _pdfjsLoading = new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = PDFJS_BASE + 'pdf.min.js';
    s.onload = function () {
      if (!window.pdfjsLib) { _pdfjsLoading = null; return reject(new Error('Không tải được bộ xem PDF')); }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    s.onerror = function () { _pdfjsLoading = null; reject(new Error('Không tải được bộ xem PDF')); };
    document.head.appendChild(s);
  });
  return _pdfjsLoading;
}

// Vẽ toàn bộ các trang của PDF (lấy từ Supabase) vào khung `box`. Trả về { cancel() } để dừng khi đóng khung.
function docRenderPdf(box, path) {
  var token = { stop: false, cancel: function () { this.stop = true; } };
  function msg(text) {
    var p = document.createElement('p');
    p.className = 'pdf-msg';
    p.textContent = text;
    return p;
  }
  box.replaceChildren(msg('Đang tải tài liệu...'));
  (async function () {
    try {
      var lib = await pdfLoadLib();
      var res = await fetch(await docSignedUrl(path));
      if (!res.ok) throw new Error('Không tải được tệp');
      var data = await res.arrayBuffer();
      if (token.stop) return;
      var pdf = await lib.getDocument({ data: data }).promise;
      var width = box.clientWidth || 360;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      box.replaceChildren();
      for (var i = 1; i <= pdf.numPages; i++) {
        if (token.stop) return;
        var page = await pdf.getPage(i);
        var base = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: (width / base.width) * dpr });
        var cv = document.createElement('canvas');
        cv.className = 'pdf-page';
        cv.width = Math.floor(vp.width);
        cv.height = Math.floor(vp.height);
        box.appendChild(cv);
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      }
      if (pdf.numPages > 1) {
        var end = msg('Hết tài liệu (' + pdf.numPages + ' trang)');
        end.className = 'pdf-msg pdf-end';
        box.appendChild(end);
      }
    } catch (e) {
      console.error(e);
      if (!token.stop) box.replaceChildren(msg('Chưa hiển thị được tài liệu. Hãy bấm Tải về để xem'));
    }
  })();
  return token;
}

// Mở PDF toàn màn hình (dùng cho điện thoại ở trang Thông báo)
function docPdfModal(title, path, name) {
  var ov = document.createElement('div');
  ov.className = 'pdf-modal';
  var bar = document.createElement('div');
  bar.className = 'pdf-modal-bar';
  var h = document.createElement('strong');
  h.textContent = title || name || 'Tài liệu';
  var dl = document.createElement('button');
  dl.type = 'button'; dl.className = 'btn btn-line'; dl.textContent = 'Tải về';
  dl.addEventListener('click', function () { docDownload(path, name); });
  var cl = document.createElement('button');
  cl.type = 'button'; cl.className = 'btn btn-small'; cl.textContent = 'Đóng';
  var box = document.createElement('div');
  box.className = 'pdf-pages pdf-modal-body';
  bar.append(h, dl, cl);
  ov.append(bar, box);
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  var tok = docRenderPdf(box, path);
  cl.addEventListener('click', function () {
    tok.cancel();
    ov.remove();
    document.body.style.overflow = '';
  });
}
