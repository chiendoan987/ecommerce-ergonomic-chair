import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="simple-page">
      <div data-reveal="up">
        <p className="eyebrow">ERGOCHAIR / VỀ CHÚNG TÔI</p>
        <h1>Thiết kế để bạn<br /><em>ngồi tốt hơn.</em></h1>
        <p className="simple-page-intro">Chúng tôi tạo ra những chiếc ghế công thái học cân bằng giữa nâng đỡ, thẩm mỹ và cảm giác thoải mái trong từng ngày làm việc.</p>
      </div>
      <section className="simple-page-grid">
        <div data-reveal="up" data-reveal-delay="80">
          <span>01</span>
          <h2>Cơ thể là trung tâm</h2>
          <p>Mỗi đường nét được nghiên cứu để hỗ trợ tư thế tự nhiên và chuyển động linh hoạt.</p>
        </div>
        <div data-reveal="up" data-reveal-delay="160">
          <span>02</span>
          <h2>Đẹp một cách bền vững</h2>
          <p>Vật liệu được chọn để đồng hành lâu dài cùng không gian làm việc hiện đại.</p>
        </div>
        <div data-reveal="up" data-reveal-delay="240">
          <span>03</span>
          <h2>Thoải mái có chủ đích</h2>
          <p>Không chỉ là một món đồ nội thất, đó là nền tảng cho những ý tưởng tốt hơn.</p>
        </div>
      </section>
      <div data-reveal="fade" data-reveal-delay="300">
        <Link className="button button-dark" href="/products">Khám phá sản phẩm <span>→</span></Link>
      </div>
    </main>
  );
}
