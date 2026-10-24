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
    alert('Chưa tải được tệp. Hãy thử lại.');
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
    alert('Chưa mở được tệp. Hãy thử lại hoặc bấm Tải về.');
  }
}