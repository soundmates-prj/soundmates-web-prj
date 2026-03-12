import "./Subscription.css";

const subscriptionPlans = [
  {
    id: 1,
    name: "Miễn Phí",
    price: 0,
    period: "",
    description: "Trải nghiệm, khám phá với nền tảng nghe nhạc hiện đại",
    isCurrentPlan: true,
    isPremium: false,
    features: [
      "Nghe podcast/music không giới hạn",
      "Tham gia phiên live trực tuyến",
      "Gửi request phát nhạc miễn phí <strong>3 request/ ngày</strong>",
      "Chất lượng âm thanh tiêu chuẩn",
    ],
  },
  {
    id: 2,
    name: "Hội viên SoundMates",
    price: 159,
    period: "/Tháng",
    description: "Nâng cao trải nghiệm, cá nhân hóa tính cách thông qua nền tảng",
    isCurrentPlan: false,
    isPremium: true,
    isMostPopular: true,
    features: [
      "Tạo giọng đọc AI dựa trên giọng thật của bạn <strong>5 request/tuần</strong>",
      "Request nhạc <strong>không giới hạn</strong>",
      "Ưu tiên request khi tham gia phòng live",
      "Áp dụng các <strong>Theme</strong> mới nhất của nền tảng",
      "Gửi thư podcast trực tuyến trong livestream",
    ],
    includedFeatures: "Đã bao gồm tất cả các tính năng miễn phí",
  },
  {
    id: 3,
    name: "Tiêu chuẩn",
    price: 59,
    period: "/Tháng",
    description: "Thể hiện cá nhân, gu âm nhạc của bản thân",
    isCurrentPlan: false,
    isPremium: false,
    features: [
      "Tạo giọng đọc AI dựa trên giọng thật của bạn <strong>1 giọng giới hạn</strong>",
      "<strong>10 request</strong> phát nhạc mỗi ngày",
      "Trải nghiệm podcast AI bằng giọng thật của bạn",
      "Áp dụng <strong>Themes</strong> trong hệ thống",
      "Gửi thư podcast trực tuyến trong livestream",
    ],
    includedFeatures: "Đã bao gồm tất cả các tính năng miễn phí",
  },
];

export default function Subscription() {
  return (
    <div className="subscription-page">
      {/* Page Title */}
      <div className="subscription-header">
        <h1 className="subscription-title">Gói đăng ký</h1>
      </div>

      {/* Subscription Plans */}
      <div className="subscription-plans">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`subscription-card ${plan.isPremium ? "premium" : ""} ${
              plan.isCurrentPlan ? "current" : ""
            }`}
          >
            {/* Most Popular Badge */}
            {plan.isMostPopular && (
              <div className="popular-badge">Phổ biến nhất</div>
            )}

            {/* Plan Header */}
            <div className="plan-header">
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-pricing">
                <span className="currency">đ</span>
                <span className="price">{plan.price}</span>
                {plan.price > 0 && <span className="price-decimal">.000</span>}
                {plan.period && <span className="period">{plan.period}</span>}
              </div>
              <p className="plan-description">{plan.description}</p>
            </div>

            {/* Subscribe Button */}
            <button className="plan-button">
              {plan.isCurrentPlan ? "Đăng ký" : "Mua Ngay"}
            </button>

            {/* Features List */}
            <div className="plan-features">
              <h3 className="features-title">Đặc quyền:</h3>
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    dangerouslySetInnerHTML={{ __html: feature }}
                  />
                ))}
              </ul>
            </div>

            {/* Included Features Note */}
            {plan.includedFeatures && (
              <p className="included-features">{plan.includedFeatures}</p>
            )}

            {/* Current Plan Badge */}
            {plan.isCurrentPlan && (
              <div className="current-plan-badge">Gói hiện tại của bạn</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
