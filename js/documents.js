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

async function docOpenTab(path, name) {
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
