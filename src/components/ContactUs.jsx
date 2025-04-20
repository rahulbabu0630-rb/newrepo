import React, { useState, useEffect } from "react";
import emailjs from 'emailjs-com';
import { FaInstagram, FaWhatsapp, FaFacebook, FaHome, FaEnvelope, FaClock } from 'react-icons/fa';
import { SiPhonepe, SiPaytm, SiGooglepay } from 'react-icons/si';
import { FaQrcode, FaSpinner } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load environment variables
  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_USER_ID = import.meta.env.VITE_EMAILJS_USER_ID;
  const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME;
  const COMPANY_EMAIL = import.meta.env.VITE_COMPANY_EMAIL;
  const COMPANY_SLOGAN = import.meta.env.VITE_COMPANY_SLOGAN;
  const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL;
  const WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_URL;
  const FACEBOOK_URL = import.meta.env.VITE_FACEBOOK_URL;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const socialLinks = {
    instagram: INSTAGRAM_URL,
    whatsapp: WHATSAPP_URL,
    facebook: FACEBOOK_URL
  };

  // Simulate loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss success/error messages
  useEffect(() => {
    let timer;
    if (submitStatus) {
      timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [submitStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.message) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          ...formData,
          company_name: COMPANY_NAME,
          company_email: COMPANY_EMAIL
        },
        EMAILJS_USER_ID
      );
      
      setSubmitStatus("success");
      setFormData({ email: "", message: "" });
      toast.success('Query/Feedback shared successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus("error");
      toast.error('Failed to send message. Please try again later.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="relative w-24 h-24">
        {/* Outer ring with gradient */}
        <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-pink-500 border-r-pink-600 animate-spin"></div>
        {/* Inner ring with gradient */}
        <div className="absolute inset-4 rounded-full border-8 border-transparent border-b-pink-400 border-l-pink-700 animate-spin-reverse"></div>
        {/* Logo or text in center */}
        <div className="absolute inset-6 flex items-center justify-center">
          <div className="text-pink-600 font-bold text-lg font-['Playfair_Display']">Loading...</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans relative">
      {/* Loading overlay */}
      {isLoading && <LoadingSpinner />}

      {/* Floating Home Button */}
      <a 
        href={`${BASE_URL}/#home`} 
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-pink-500 to-pink-700 text-white transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Back to Home"
      >
        <FaHome className="text-2xl" />
      </a>

      {/* Header */}
      <header className="bg-pink-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold font-['Playfair_Display']">{COMPANY_NAME}</h1>
          <p className="mt-2 text-xl font-['Playfair_Display']">{COMPANY_SLOGAN}</p>
        </div>
      </header>

      {/* Toast Container */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="toast-notification"
        bodyClassName="toast-body"
        progressClassName="toast-progress"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-pink-600 mb-8 text-center font-['Playfair_Display']">
            We'd Love To Hear From You!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - More Information */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-pink-600 border-b-2 border-pink-200 pb-2 font-['Playfair_Display']">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li><a href={`${BASE_URL}/about`} className="text-gray-700 hover:text-pink-600 transition-colors">About Us</a></li>
                <li><a href="https://maps.app.goo.gl/zUHTgLaURhVLzn6n7" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-pink-600 transition-colors">Our Stores</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Online Shop</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Careers</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Corporate Gifts</a></li>
              </ul>
            </div>

            {/* Middle Column - Products */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-pink-600 border-b-2 border-pink-200 pb-2 font-['Playfair_Display']">
                Our Products
              </h3>
              <ul className="space-y-3">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Traditional Sweets</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Cakes & Pastries</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Dry Fruit Sweets</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Savory Snacks</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-gray-700 hover:text-pink-600 transition-colors">Gift Boxes</a></li>
              </ul>
            </div>

            {/* Right Column - Contact Form */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-pink-600 border-b-2 border-pink-200 pb-2 font-['Playfair_Display']">
                Connect With Us
              </h3>
              <div className="flex flex-col gap-4">
                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <FaInstagram className="text-2xl" />
                  <span>Instagram</span>
                </a>
                <a 
                  href={socialLinks.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <FaWhatsapp className="text-2xl" />
                  <span>WhatsApp</span>
                </a>
                <a 
                  href={socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <FaFacebook className="text-2xl" />
                  <span>Facebook</span>
                </a>
              </div>

              <div className="pt-4">
                <span className="font-medium text-gray-700">Send us a message</span>
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-1">
                      Email Address <span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors`}
                      placeholder="Enter your email address"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-red-500 text-sm">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="message" className="block text-gray-700 mb-1">
                      Your Message <span className="text-pink-600">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.message ? "border-red-500" : "border-gray-300"} rounded focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors`}
                      placeholder="How can we help you?"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    ></textarea>
                    {errors.message && (
                      <p id="message-error" className="mt-1 text-red-500 text-sm">
                        {errors.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaEnvelope />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-pink-600 mb-3 font-['Playfair_Display']">Contact Information</h3>
              <div className="flex items-start gap-3 mb-4">
                <FaEnvelope className="text-pink-500 mt-1" />
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span> {COMPANY_EMAIL}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaClock className="text-pink-500 mt-1" />
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Timing:</span> Monday To Sunday, 08:00 AM to 10:00 PM IST
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-pink-600 mb-3 font-['Playfair_Display']">Payment Methods</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <SiPhonepe className="text-purple-600 text-xl" />
                  <span className="text-sm">PhonePe</span>
                </span>
                <span className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <SiPaytm className="text-blue-500 text-xl" />
                  <span className="text-sm">Paytm</span>
                </span>
                <span className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <SiGooglepay className="text-green-500 text-xl" />
                  <span className="text-sm">GPay</span>
                </span>
                <span className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <FaQrcode className="text-black text-xl" />
                  <span className="text-sm">QR Payments</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600">
            <p>© {new Date().getFullYear()} Copyright. {COMPANY_NAME} All Rights Reserved</p>
            <p className="mt-1 text-sm">Anandapuram Vemulavalasa, Visakhapatnam District</p>
          </div>
        </div>
      </footer>

      {/* Add Playfair Display font to head in your main HTML file */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
        
        /* Custom animations for the spinner */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
        
        /* Toast notification styles */
        .Toastify__toast-container {
          z-index: 9999;
          padding: 4px;
          width: 320px;
        }
        
        .Toastify__toast {
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          padding: 12px 16px;
          font-weight: 500;
          min-height: 60px;
          font-family: inherit;
          background: white;
          color: #333;
          border-left: 6px solid;
        }
        
        .Toastify__toast--success {
          border-left-color: #10B981;
        }
        
        .Toastify__toast--error {
          border-left-color: #EF4444;
        }
        
        .Toastify__toast-body {
          margin: 0;
          padding: 0;
          line-height: 1.5;
        }
        
        .Toastify__progress-bar {
          height: 3px;
          background: rgba(0, 0, 0, 0.1);
        }
        
        .Toastify__close-button {
          color: #6B7280;
          opacity: 0.7;
        }
        
        .Toastify__close-button:hover {
          opacity: 1;
        }
        
        /* Remove outline on focus for all elements */
        *:focus {
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.5) !important;
        }
        
        /* Remove tap highlight color on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default ContactUs;