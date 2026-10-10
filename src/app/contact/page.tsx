import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="simple-page contact-page">
      <div data-reveal="up">
        <h1>Hãy bắt đầu<br /><em>một cuộc trò chuyện.</em></h1>
        <p className="simple-page-intro">Đội ngũ ErgoChair sẵn sàng giúp bạn tìm chiếc ghế phù hợp với cơ thể và không gian làm việc.</p>
      </div>
      <section className="contact-details">
        <div data-reveal="up" data-reveal-delay="80">
          <span>Hotline / Zalo</span>
          <a href="tel:0989608685">0989 608 685</a>
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
