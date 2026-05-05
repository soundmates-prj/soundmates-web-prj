import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Music, Mic2, CreditCard, MessageSquare } from 'lucide-react';
import './InfoPages.css';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Chung',
    question: 'SoundMates là gì?',
    answer: 'SoundMates là nền tảng âm nhạc và podcast thông minh, cho phép bạn nghe nhạc, tạo podcast bằng công nghệ AI Voice Clone và kết nối với cộng đồng yêu nhạc.'
  },
  {
    category: 'Gói cước',
    question: 'Làm thế nào để nâng cấp lên Premium?',
    answer: 'Bạn có thể vào trang Gói cước (Subscription) trong phần Cài đặt, chọn gói Premium và thực hiện thanh toán qua các cổng thanh toán được hỗ trợ như VNPAY hoặc MoMo.'
  },
  {
    category: 'Voice Clone',
    question: 'Tính năng Voice Clone hoạt động như thế nào?',
    answer: 'Bạn chỉ cần tải lên đoạn mẫu giọng nói của mình (khoảng 1-3 phút). Công nghệ AI của chúng tôi sẽ phân tích và tạo ra một "bản sao kỹ thuật số" để bạn có thể dùng giọng đó đọc các kịch bản podcast.'
  },
  {
    category: 'Podcast',
    question: 'Tôi có thể chia sẻ podcast mình tạo ra không?',
    answer: 'Tất nhiên! Sau khi tạo audio từ script, bạn có thể lưu vào thư viện, tải về máy hoặc chia sẻ trực tiếp lên diễn đàn cộng đồng của SoundMates.'
  },
  {
    category: 'Gói cước',
    question: 'Giới hạn 120 phút TTS là gì?',
    answer: 'Đối với gói Premium, bạn có tổng cộng 120 phút mỗi tháng để sử dụng công nghệ AI chuyển văn bản thành giọng nói (TTS) để tạo audio cho podcast của mình.'
  },
  {
    category: 'Liên hệ',
    question: 'Làm sao để yêu cầu bài hát trên Live?',
    answer: 'Bạn có thể sử dụng tính năng "Gửi thư" hoặc tham gia trực tiếp vào các phòng livestream đang phát sóng để gửi yêu cầu bài hát đến Host.'
  }
];

const FAQPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const filteredFaqs = selectedCategory === 'Tất cả' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === selectedCategory);

  const categories = ['Tất cả', 'Gói cước', 'Voice Clone', 'Chung', 'Liên hệ'];

  return (
    <div className="info-page faq-page">
      <div className="info-hero">
        <div className="hero-content">
          <HelpCircle className="hero-icon animated-pulse" />
          <h1>Câu hỏi thường gặp</h1>
          <p className="hero-subtitle">
            Tìm câu trả lời nhanh chóng cho các thắc mắc của bạn.
          </p>
        </div>
      </div>

      <div className="info-container">
        <div className="faq-categories">
          {categories.map(cat => (
            <div 
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveIndex(null);
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="faq-list">
          {filteredFaqs.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item glass-card ${activeIndex === index ? 'active' : ''}`}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                <div className="question-left">
                  {item.category === 'Voice Clone' && <Mic2 size={18} className="cat-icon" />}
                  {item.category === 'Gói cước' && <CreditCard size={18} className="cat-icon" />}
                  {item.category === 'Chung' && <Music size={18} className="cat-icon" />}
                  {item.category === 'Liên hệ' && <MessageSquare size={18} className="cat-icon" />}
                  <span>{item.question}</span>
                </div>
                {activeIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {activeIndex === index && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact glass-card">
          <h3>Vẫn còn thắc mắc?</h3>
          <p>Đừng ngần ngại liên hệ với chúng tôi để được hỗ trợ trực tiếp.</p>
          <a href="/gui-thu" className="contact-btn">Gửi thư cho chúng tôi</a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
