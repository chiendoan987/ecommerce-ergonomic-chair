import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="simple-page contact-page">
      <div data-reveal="up">
        <p className="eyebrow">ERGOCHAIR / LIÊN HỆ</p>
        <h1>Hãy bắt đầu<br /><em>một cuộc trò chuyện.</em></h1>
        <p className="simple-page-intro">Đội ngũ ErgoChair sẵn sàng giúp bạn tìm chiếc ghế phù hợp với cơ thể và không gian làm việc.</p>
      </div>
      <section className="contact-details">
        <div data-reveal="up" data-reveal-delay="80">
          <span>Hotline</span>
          <a href="tel:18006868">1800 6868</a>
        </div>
        <div data-reveal="up" data-reveal-delay="160">
          <span>Email</span>
          <a href="mailto:hello@ergochair.vn">hello@ergochair.vn</a>
        </div>
        <div data-reveal="up" data-reveal-delay="240">
          <span>Địa chỉ</span>
          <p>36 Nguyễn Cơ Thạch, Nam Từ Liêm<br />Hà Nội, Việt Nam</p>
        </div>
      </section>
      <div data-reveal="fade" data-reveal-delay="300">
        <Link className="button button-dark" href="/products">Xem sản phẩm <span>→</span></Link>
      </div>
    </main>
  );
}
