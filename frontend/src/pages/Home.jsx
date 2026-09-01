import { Link } from "react-router";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="container header-row">
          <span className="logo">Event Management AI</span>
          <nav className="nav-links">
            <Link to="/events" className="nav-link">Sự kiện</Link>
            <Link to="/login" className="nav-link btn-login">Đăng nhập</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-row">
          <div className="hero-content">
            <h1>Vận hành sự kiện gọn gàng, có AI lo phần việc lặp lại</h1>
            <p>
              Quản lý lịch trình, người tham dự và phản hồi trên một nền tảng
              duy nhất — AI soạn thông báo, tóm tắt phản hồi và trả lời câu hỏi
              thay bạn.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary">Bắt đầu ngay</Link>
              <Link to="/events" className="btn btn-secondary">Xem sự kiện</Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="glow-orb glow-orb-primary"></div>
            <div className="glow-orb glow-orb-accent"></div>
            <div className="schedule-card">
              <div className="schedule-card-title">Hôm nay · Hội nghị AI Việt Nam</div>
              <div className="schedule-row">
                <span className="schedule-time">09:00</span>
                <span className="schedule-label">Khai mạc &amp; giới thiệu</span>
              </div>
              <div className="schedule-row">
                <span className="schedule-time">10:30</span>
                <span className="schedule-label">Diễn giả chính</span>
              </div>
              <div className="schedule-row schedule-row-active">
                <span className="schedule-time">13:30</span>
                <span className="schedule-label">Workshop AI Chatbot</span>
              </div>
            </div>
            <div className="floating-chip chip-ai">Đã check-in 128</div>
            <div className="floating-chip chip-chat">"Sự kiện diễn ra ở đâu?"</div>
          </div>
        </div>
        <WaveDivider />
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Mọi thứ ban tổ chức cần, ở một nơi</h2>
          <div className="features-grid">

            <article className="feature-card feature-card-large">
              <NetworkPattern />
              <IconBot />
              <h3>AI Chatbot hỏi đáp sự kiện</h3>
              <p>
                Trả lời tự động các câu hỏi về lịch trình, địa điểm và thông
                tin sự kiện dựa trên dữ liệu bạn đã nhập, không cần trực trả lời thủ công.
              </p>
            </article>

            <article className="feature-card">
              <IconCalendar />
              <h3>Quản lý sự kiện</h3>
              <p>Tạo, cập nhật và theo dõi trạng thái sự kiện dễ dàng.</p>
            </article>

            <article className="feature-card">
              <IconQr />
              <h3>Đăng ký &amp; check-in</h3>
              <p>Quản lý người tham gia, check-in nhanh qua mã QR.</p>
            </article>

            <article className="feature-card">
              <IconChart />
              <h3>Tóm tắt phản hồi bằng AI</h3>
              <p>Gom hàng trăm phản hồi thành các nhóm ý kiến chính, có báo cáo rõ ràng.</p>
            </article>

            <article className="feature-card">
              <IconBell />
              <h3>Thông báo tự động</h3>
              <p>AI soạn nội dung mời, nhắc lịch và cảm ơn, gửi đúng thời điểm.</p>
            </article>

          </div>
        </div>
      </section>

      {/* Quick access Section */}
      <section className="quick-access">
        <div className="container">
          <h2>Truy cập nhanh</h2>
          <div className="quick-links">
            <Link to="/events" className="quick-link">
              <span className="quick-link-title">Trang sự kiện</span>
              <span className="quick-link-desc">Xem danh sách sự kiện sắp tới</span>
            </Link>
            <Link to="/login" className="quick-link">
              <span className="quick-link-title">Đăng nhập</span>
              <span className="quick-link-desc">Dành cho quản trị viên &amp; ban tổ chức</span>
            </Link>
            <div className="quick-link quick-link-disabled">
              <span className="quick-link-title">Bảng điều khiển</span>
              <span className="quick-link-desc">Cần đăng nhập để truy cập</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <BurstPattern />
        <div className="container cta-row">
          <div>
            <h2>Sẵn sàng cho sự kiện tiếp theo?</h2>
            <p>Tạo tài khoản hoặc đăng nhập để bắt đầu quản lý sự kiện của bạn.</p>
          </div>
          <Link to="/login" className="btn btn-primary btn-large">Đăng nhập ngay</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>&copy; 2026 Event Management AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function WaveDivider() {
  return (
    <svg
      className="wave-divider"
      viewBox="0 0 1440 96"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="wave-fill"
        d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,96 L0,96 Z"
      />
    </svg>
  );
}

function NetworkPattern() {
  return (
    <svg className="network-pattern" viewBox="0 0 220 180" aria-hidden="true">
      <line x1="20" y1="150" x2="90" y2="90" className="network-line" />
      <line x1="90" y1="90" x2="170" y2="40" className="network-line" />
      <line x1="90" y1="90" x2="160" y2="130" className="network-line" />
      <line x1="170" y1="40" x2="205" y2="90" className="network-line" />
      <circle cx="20" cy="150" r="5" className="network-node" />
      <circle cx="90" cy="90" r="6" className="network-node" />
      <circle cx="170" cy="40" r="5" className="network-node" />
      <circle cx="160" cy="130" r="4" className="network-node" />
      <circle cx="205" cy="90" r="4" className="network-node" />
    </svg>
  );
}

function BurstPattern() {
  return (
    <svg className="burst-pattern" viewBox="0 0 400 200" aria-hidden="true">
      <circle cx="30" cy="40" r="4" className="burst-dot burst-dot-a" />
      <circle cx="60" cy="90" r="6" className="burst-dot burst-dot-b" />
      <circle cx="20" cy="150" r="3" className="burst-dot burst-dot-a" />
      <circle cx="370" cy="30" r="5" className="burst-dot burst-dot-b" />
      <circle cx="340" cy="170" r="4" className="burst-dot burst-dot-a" />
      <circle cx="385" cy="120" r="3" className="burst-dot burst-dot-b" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="13.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconQr() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 15H17V17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 15V20.5H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBot() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="8.5" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8.5V5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1.2" fill="currentColor" />
      <circle cx="9" cy="13.5" r="1.3" fill="currentColor" />
      <circle cx="15" cy="13.5" r="1.3" fill="currentColor" />
      <path d="M2.5 12V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21.5 12V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 20H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="7" y="13" width="2.6" height="5" rx="0.6" fill="currentColor" />
      <rect x="12" y="9" width="2.6" height="9" rx="0.6" fill="currentColor" />
      <rect x="17" y="6" width="2.6" height="12" rx="0.6" fill="currentColor" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 10.5C6.5 7.46 8.96 5 12 5C15.04 5 17.5 7.46 17.5 10.5V14L19 16.5H5L6.5 14V10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.8 19C10.2 19.9 11 20.5 12 20.5C13 20.5 13.8 19.9 14.2 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default Home;
