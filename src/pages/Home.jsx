import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AboutUs from "../components/AboutUs";
import Gallery from "../components/Gallery";

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Updated products data with proper image names from categories
  const products = useMemo(() => [
    { 
      image: "/assets/products/gifting.jpg", 
      gradient: "from-purple-600/80 to-pink-600/80",
      category: "GIFTINGS"
    },
    { 
      image: "/assets/products/cakes.jpg", 
      gradient: "from-amber-600/80 to-orange-600/80",
      category: "CAKES & PASTRIES"
    },
    { 
      image: "/assets/products/dryfruits.jpg", 
      gradient: "from-yellow-600/80 to-amber-600/80",
      category: "DRY FRUITS"
    },
    { 
      image: "/assets/products/ghee.jpg", 
      gradient: "from-red-600/80 to-pink-600/80",
      category: "GHEE FOODS"
    },
    { 
      image: "/assets/products/namkeen.jpg", 
      gradient: "from-green-600/80 to-emerald-600/80",
      category: "NAMKEEM"
    },
    { 
      image: "/assets/products/icecream.jpg", 
      gradient: "from-blue-400/80 to-indigo-600/80",
      category: "ICE CREAM"
    },
  ], []);

  // Categories data
  const categories = useMemo(() => [
    {id: 1, text: 'HOME FOODS'}, 
    {id: 2, text: '|', isSeparator: true}, 
    {id: 3, text: 'CAKES & PASTRIES'},
    {id: 4, text: '|', isSeparator: true}, 
    {id: 5, text: 'GHEE FOODS'}, 
    {id: 6, text: '|', isSeparator: true},
    {id: 7, text: 'DRY FRUITS'}, 
    {id: 8, text: '|', isSeparator: true},
    {id: 9, text: 'ICE CREAM'},
    {id: 10, text: '|', isSeparator: true},
    {id: 11, text: 'NAMKEEM'},
    {id: 12, text: '|', isSeparator: true},
    {id: 13, text: 'GIFTINGS'},
    {id: 14, text: '~PROPRIETOR : CH . RAMU'}
  ], []);

  const navItems = useMemo(() => ['Home', 'About Us', 'Gallery', 'Attendance', 'Contact Us'], []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (page) => {
    setIsMobileMenuOpen(false);
    const routeMap = {
      'Home': '#home',
      'About Us': '#about',
      'Gallery': '#gallery',
      'Attendance': '/attendance',
      'Contact Us': '/contact-us'
    };
    
    if (routeMap[page]) {
      if (page === 'Attendance' || page === 'Contact Us') {
        navigate(routeMap[page]);
      } else {
        const element = document.querySelector(routeMap[page]);
        if (element) {
          window.scrollTo({
            top: page === 'Gallery' ? document.body.scrollHeight : element.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  const getActivePage = () => {
    const hash = location.hash;
    if (hash === '#home' || hash === '' || hash === '#') return 'Home';
    if (hash === '#about') return 'About Us';
    if (hash === '#gallery') return 'Gallery';
    if (location.pathname === '/attendance') return 'Attendance';
    if (location.pathname === '/contact-us') return 'Contact Us';
    return '';
  };

  const activePage = getActivePage();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center z-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-600 opacity-20 rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-transparent rounded-full animate-spin"
              style={{
                borderTopColor: 'transparent',
                borderRightColor: '#EC4899',
                borderBottomColor: 'transparent',
                borderLeftColor: '#DC2626',
              }}
            />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600 font-medium">
            Loading
          </p>
        </div>
      </div>
    );
  }

  const fallbackLogoSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e91e63'/%3E%3Ctext x='50%' y='50%' font-size='20' fill='white' text-anchor='middle' dominant-baseline='middle'%3ELogo%3C/text%3E%3C/svg%3E";

  return (
    <div className="bg-white relative">
      {/* Navbar - Removed sticky positioning */}
      <div className="w-full bg-pink-700">
        <nav className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative h-16 md:h-18">
          <div className="absolute left-4 sm:left-6 lg:left-8 h-full flex items-center">
            <a 
              href="#home" 
              className="transition-transform hover:scale-105 block h-full flex items-center"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('Home');
              }}
            >
              <img 
                className="h-full max-h-[60px] md:max-h-[90px] object-contain" 
                src="/assets/logo.png" 
                alt="Logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = fallbackLogoSvg;
                }}
              />
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="h-full hidden md:flex justify-end items-center">
            <div className="flex items-center space-x-6 lg:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item} 
                  onClick={() => handleNavigation(item)}
                  className={`relative text-white transition-all duration-300 font-medium px-4 py-3 text-lg font-sans
                    ${activePage === item ? 
                      'text-pink-100' : 
                      'hover:text-pink-100'}`}
                >
                  {item}
                  {activePage === item && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-pink-100 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden h-full flex justify-end items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-pink-700 z-50 shadow-lg">
            <div className="flex flex-col items-center py-4">
              {navItems.map((item) => (
                <button
                  key={item} 
                  onClick={() => handleNavigation(item)}
                  className={`w-full text-center py-3 text-white transition-all duration-300 font-medium text-lg
                    ${activePage === item ? 'bg-pink-800' : 'hover:bg-pink-600'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative pt-8 md:pt-20 pb-8 px-4 sm:px-8 text-center" id="home">
        <div className="flex flex-col items-center">
          <h1 className="text-pink-600 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 relative inline-block"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: '-1px',
              lineHeight: '1.1'
            }}
          >
            SRI DURGA DEVI SWEETS & BAKERY
            <div 
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-pink-700 font-medium absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              style={{
                bottom: '-2rem',
                fontFamily: "'Noto Sans Telugu', sans-serif"
              }}
            >
              స్వచ్చంధానికి చెరగని చిరునామా
            </div>
          </h1>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col items-center mt-6 sm:mt-8 md:mt-12">
          <div className="w-full overflow-x-auto px-2 py-2 hide-scrollbar">
            <div className="flex flex-nowrap justify-start gap-2 sm:gap-3 md:gap-4 min-w-max px-2">
              {categories.map((category) => (
                <span 
                  key={category.id} 
                  className={`text-pink-600 hover:text-pink-800 text-xs sm:text-sm md:text-lg font-medium uppercase tracking-wide transition-colors duration-300 whitespace-nowrap
                    ${category.isSeparator ? 'cursor-default px-1' : 'cursor-pointer px-2'}`}
                >
                  {category.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid with Enhanced 3D Effect */}
      <section className="w-full px-4 sm:px-6 py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-0">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center text-red-700/90 mb-6 sm:mb-8 md:mb-12">Our Top Picks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {products.map((product) => {
              const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%' y='50%' font-size='12' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3EImage%20Not%20Found%3C/text%3E%3C/svg%3E";
              
              return (
                <div 
                  key={product.name} 
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 w-full transform hover:-translate-y-1 md:hover:-translate-y-2"
                >
                  <div className="aspect-w-4 aspect-h-3 w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImage;
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-t ${product.gradient} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 sm:p-6 md:p-8`}>
                    <div className="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                        {product.name}
                      </h3>
                      <p className="text-pink-100 text-base sm:text-lg font-medium">
                        {product.category}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="w-full pb-8 sm:pb-12 md:pb-16 pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <AboutUs />
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="w-full pt-8 sm:pt-12 md:pt-16 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#5d375a] to-[#1b020f]">
        <div className="max-w-7xl mx-auto">
          <Gallery />
        </div>
      </section>

      {/* Global CSS for hiding scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Home;