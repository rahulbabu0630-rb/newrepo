import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const Gallery = () => {
  // Generate image paths from image1.jpg to image13.jpg
  const galleryImages = Array.from({ length: 13 }, (_, i) => ({
    src: `/gallery/image${i + 1}.jpg`,
    alt: `Our product showcase ${i + 1}`
  }));

  return (
    <section className="py-16 bg-gradient-to-br from-[#4a2747] to-[#ac0f60] ">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Our Gallery</h2>
          <p className="text-amber-100 max-w-2xl mx-auto">
            Discover our exquisite collection 
          </p>
        </div>
        
        <div className="mx-auto max-w-6xl">
          <Swiper
            modules={[Autoplay]}
            slidesPerView={3}
            centeredSlides="true"
            spaceBetween={30}
            autoplay={{ 
              delay: 3000,
              disableOnInteraction: false 
            }}
            loop="true"
            className="w-full h-[400px]"
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 15
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 20
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30
              }
            }}
          >
            {galleryImages.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="h-full flex justify-center items-center p-2">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className={`w-full h-full object-cover rounded-xl shadow-lg transition-transform duration-300 hover:scale-105
                      ${index % 3 === 1 ? 'scale-105' : ''}`}
                    loading="lazy"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Gallery;