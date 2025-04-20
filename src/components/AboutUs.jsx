import React, { useState, useEffect, useRef } from "react";

const AboutUs = () => {
  const [showButton, setShowButton] = useState(false);
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Image paths - now pointing to public/assets
  const carouselImages = [
    "/assets/about/shopbw.jpg",
    "/assets/about/shop-interior.jpg"
  ];

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Show button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll back to the top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background: #c9a353;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #a8863d;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <section id="about-us" className="bg-white py-16 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto text-center">
        {/* Title */}
        <h2 className="text-4xl font-serif font-bold text-[#5a4634] relative inline-block pb-2">
          Our Story
          <span className="block w-16 h-1 bg-[#c9a353] mx-auto mt-2"></span>
        </h2>

        {/* Layout */}
        <div className="mt-10 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Advanced Image Slider */}
          <div className="overflow-hidden rounded-lg shadow-lg relative h-[500px]">
            {/* Slides */}
            <div className="relative w-full h-full">
              {carouselImages.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img 
                    src={img} 
                    alt={`About us ${index + 1}`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/assets/about/shopbw.jpg";
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Slide Indicators (minimal) */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-[#c9a353]' : 'bg-gray-300'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="text-left">
            <h3 className="text-2xl font-serif font-bold text-[#5a4634] mb-4">PAST</h3>
            <p className="text-lg font-medium text-gray-700 leading-relaxed mt-4">
              Sri Durga Sweets & Bakery has been a name synonymous with tradition, taste, and trust for over 32 Years.
              What started as a humble stall under the name <strong className="text-[#5a4634]">Sri Durga Devi Sweets & Generals</strong> has now grown into a beloved
              bakery that serves generations of customers with the same passion and dedication.
            </p>
            <p className="text-lg font-medium text-gray-700 leading-relaxed mt-4">
              Years ago, in Anandapuram, our small stall delighted customers with fresh sweets like laddu, mysore pak, and jangri,
              prepared with love and devotion. Over time, our dreams expanded, leading us to transition into a well-established
              bakery while preserving our rich heritage.
            </p>
            <p className="text-lg font-medium text-gray-700 leading-relaxed mt-4">
              Today, our offerings range from traditional Indian sweets to freshly baked cakes, serving every celebration.
              As we continue our journey, our mission remains unchanged—to spread happiness through the finest sweets
              and baked goods, keeping our legacy alive for generations.
            </p>
          </div>
        </div>
      </div>
 
      {/* Back to Top Button */}
      {showButton && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 bg-[#5a4634] text-white p-3 shadow-lg hover:bg-[#c9a353] transition-all duration-300 rounded-full w-12 h-12 flex items-center justify-center text-xl"
        >
          ↑
        </button>
      )}
    </section>
  );
};

export default AboutUs;