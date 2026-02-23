import { useState, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #0a0a0f;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: 'Nunito', sans-serif;
  }

  .phone-frame {
    width: 390px;
    height: 844px;
    background: #0f0f1a;
    border-radius: 50px;
    overflow: hidden;
    position: relative;
    box-shadow:
      0 0 0 2px #2a2a3d,
      0 40px 120px rgba(0,0,0,0.8),
      inset 0 0 0 1px rgba(255,255,255,0.04);
  }

  .screen {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 28px 40px;
    position: relative;
    overflow: hidden;
    background: linear-gradient(160deg, #0f0f1a 0%, #12111f 60%, #0d1320 100%);
  }

  /* Ambient glow */
  .screen::before {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%);
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .screen::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
    bottom: 100px;
    right: -50px;
    pointer-events: none;
  }

  /* Top bar */
  .top-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 48px;
    position: relative;
    z-index: 2;
  }

  .time {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    font-weight: 700;
  }

  .battery {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .battery svg { opacity: 0.5; }

  /* Success icon area */
  .icon-area {
    position: relative;
    z-index: 2;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ring-outer {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(52, 211, 153, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-outer 2.5s ease-in-out infinite;
  }

  .ring-inner {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: rgba(52, 211, 153, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-inner 2.5s ease-in-out infinite;
  }

  .icon-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #34d399, #10b981);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(52, 211, 153, 0.4), 0 0 0 1px rgba(52,211,153,0.3);
    animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    animation-delay: 0.2s;
  }

  .checkmark {
    opacity: 0;
    animation: fade-in 0.3s ease 0.6s forwards;
  }

  @keyframes pop-in {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes fade-in {
    to { opacity: 1; }
  }

  @keyframes pulse-outer {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.08); opacity: 1; }
  }

  @keyframes pulse-inner {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* Text content */
  .content {
    text-align: center;
    z-index: 2;
    animation: slide-up 0.5s ease 0.4s both;
    margin-bottom: 32px;
  }

  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .badge {
    display: inline-block;
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.25);
    color: #34d399;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .title {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    margin-bottom: 10px;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.4);
    font-weight: 600;
    line-height: 1.6;
  }

  /* Amount card */
  .amount-card {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 20px 24px;
    margin-bottom: 20px;
    z-index: 2;
    animation: slide-up 0.5s ease 0.5s both;
    backdrop-filter: blur(10px);
  }

  .amount-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.3);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .amount-value {
    font-family: 'Space Mono', monospace;
    font-size: 34px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -1px;
  }

  .amount-value span {
    font-size: 18px;
    color: rgba(255,255,255,0.4);
    margin-right: 4px;
  }

  /* Details list */
  .details-card {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
    z-index: 2;
    animation: slide-up 0.5s ease 0.6s both;
    margin-bottom: 28px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
  }

  .detail-row + .detail-row {
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .detail-key {
    font-size: 13px;
    color: rgba(255,255,255,0.35);
    font-weight: 600;
  }

  .detail-val {
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    font-weight: 700;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
  }

  .detail-val.green { color: #34d399; }

  /* Buttons */
  .btn-primary {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #34d399, #059669);
    border: none;
    border-radius: 16px;
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    z-index: 2;
    animation: slide-up 0.5s ease 0.7s both;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
    box-shadow: 0 8px 24px rgba(52, 211, 153, 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 32px rgba(52, 211, 153, 0.4);
  }

  .btn-secondary {
    width: 100%;
    padding: 14px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    color: rgba(255,255,255,0.5);
    font-size: 14px;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    z-index: 2;
    animation: slide-up 0.5s ease 0.75s both;
    transition: border-color 0.2s, color 0.2s;
    letter-spacing: 0.3px;
  }

  .btn-secondary:hover {
    border-color: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
  }

  /* Particles */
  .particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    animation: float-up linear forwards;
  }

  @keyframes float-up {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-200px) scale(0); opacity: 0; }
  }

  /* Home indicator */
  .home-indicator {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
  }

  .buttons-container {
    width: 100%;
    z-index: 2;
    animation: slide-up 0.5s ease 0.7s both;
  }
`;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${4 + Math.random() * 6}px`,
  delay: `${Math.random() * 0.8}s`,
  duration: `${1.2 + Math.random() * 1.2}s`,
  color: i % 3 === 0 ? "#34d399" : i % 3 === 1 ? "#6366f1" : "#f59e0b",
  top: `${20 + Math.random() * 60}%`,
}));

export default function OrderCreatedCOD() {
  const [showParticles, setShowParticles] = useState(true);
  const [now] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  });

  useEffect(() => {
    const t = setTimeout(() => setShowParticles(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const txId = "TXN" + Math.random().toString(36).substring(2,10).toUpperCase();
  const date = new Date().toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" });

  return (
    <>
      <style>{styles}</style>
      <div className="phone-frame">
        <div className="screen">

          {/* Particles */}
          {showParticles && PARTICLES.map(p => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          ))}

          {/* Top bar */}
          <div className="top-bar">
            <div className="time">{now}</div>
            <div className="battery">
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <rect x="0.5" y="0.5" width="13" height="9" rx="2" stroke="white" strokeOpacity=".5"/>
                <rect x="2" y="2" width="9" height="6" rx="1" fill="white" fillOpacity=".5"/>
                <path d="M14.5 3.5v3" stroke="white" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Icon */}
          <div className="icon-area">
            <div className="ring-outer">
              <div className="ring-inner">
                <div className="icon-circle">
                  <svg className="checkmark" width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M7 16l6 6 12-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="content">
            <div className="badge">✓ Thành công</div>
            <div className="title">Thanh toán<br/>hoàn tất!</div>
            <div className="subtitle">Giao dịch của bạn đã được<br/>xử lý thành công.</div>
          </div>

          {/* Amount */}
          {/* <div className="amount-card">
            <div className="amount-label">Số tiền</div>
            <div className="amount-value"><span>₫</span>1.250.000</div>
          </div> */}

          {/* Details */}
          {/* <div className="details-card">
            <div className="detail-row">
              <span className="detail-key">Mã giao dịch</span>
              <span className="detail-val">{txId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Ngày</span>
              <span className="detail-val">{date}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Phương thức</span>
              <span className="detail-val">Visa ••••4291</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Trạng thái</span>
              <span className="detail-val green">● Đã thanh toán</span>
            </div>
          </div> */}

          {/* Buttons */}
          <div className="buttons-container">
            <button className="btn-primary">Về trang chủ</button>
            <button className="btn-secondary">Xem lịch sử giao dịch</button>
          </div>

          <div className="home-indicator" />
        </div>
      </div>
    </>
  );
}