(function () {
  var footer = document.querySelector('.site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-main">

        <div class="footer-col">
          <div class="footer-logos" aria-label="Các đơn vị liên quan">
            <img src="images/logotruong.png" alt="Trường Đại học Sài Gòn">
            <img src="images/logosv5t.png" alt="Sinh viên 5 tốt">
            <img src="images/logokhoa.png" alt="Khoa Giáo dục">
          </div>
          <div class="footer-brand-name">Sinh viên 5 tốt khoa Giáo dục</div>
          <div class="footer-brand-sub">Cổng thông tin xét duyệt danh hiệu cấp Khoa</div>
        </div>

        <div class="footer-col">
          <span class="footer-label">Đơn vị phụ trách</span>
          <div class="footer-strong">Ban Chấp hành Liên Chi hội Sinh viên khoa Giáo dục</div>
          <ul class="footer-contact">
            <li>Email: <a href="mailto:hsv.giaoduc@sgu.edu.vn">hsv.giaoduc@sgu.edu.vn</a></li>
            <li>Facebook: <a href="https://www.facebook.com/GDDHSG/" target="_blank" rel="noopener">Fanpage của Ban Chấp hành</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <span class="footer-label">Copyright © 2026 by</span>
          <div class="footer-strong footer-copy">
            Ban Chấp hành<br>
            Liên Chi hội Sinh viên<br>
            khoa Giáo dục
          </div>
        </div>

      </div>
    </div>
  `;
})();