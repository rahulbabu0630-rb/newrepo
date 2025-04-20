import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    salary: '',
    number: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.dismiss();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are currently offline. Some features may not work.', {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Clock update
  useEffect(() => {
    const timerID = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerID);
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Enhanced fetch with timeout, retries, and abort controller
  const fetchWithRetry = async (url, options, retries = 3, timeout = 8000) => {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        setRetryCount(i + 1);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        if (error.name !== 'AbortError' && i === retries - 1) break;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast.error('❌ No internet connection. Please check your network.', {
        className: 'toast-error'
      });
      return;
    }

    // Validation
    const errors = [];
    if (!formData.name.trim()) errors.push('Employee name is required');
    if (!formData.salary.trim() || isNaN(formData.salary)) errors.push('Please enter a valid salary amount');
    if (formData.number.trim() && !/^\+?[0-9\- ]{6,15}$/.test(formData.number.trim())) {
      errors.push('Please enter a valid phone number (6-15 digits, may include + or -)');
    }

    if (errors.length > 0) {
      errors.forEach(msg => toast.error(msg, { className: 'toast-error' }));
      return;
    }

    setIsLoading(true);
    setRetryCount(0);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://durgadevisweets.onrender.com';
      
      const data = await fetchWithRetry(`${API_BASE_URL}/employees/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          salary: parseFloat(formData.salary),
          ...(formData.role.trim() && { role: formData.role.trim() }),
          ...(formData.number.trim() && { number: formData.number.trim() }),
        }),
      });

      toast.success(' Employee added successfully!', { className: 'toast-success' });
      setFormData({ name: '', role: '', salary: '', number: '' }); // Reset form after success
      
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Failed to add employee';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server might be busy. Please try again.';
      } else if (error.message.includes('already exists')) {
        errorMessage = error.message;
      } else if (error.message.includes('Invalid')) {
        errorMessage = error.message;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Server configuration issue. Please contact support.';
      }
      
      toast.error(`❌ ${errorMessage}${retryCount > 1 ? ` (retried ${retryCount} times)` : ''}`, { 
        className: 'toast-error',
        autoClose: retryCount > 1 ? 8000 : 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSleekClock = () => {
    const hours = currentTime.getHours() % 12 || 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const ampm = currentTime.getHours() >= 12 ? 'PM' : 'AM';

    const hourDegrees = (hours * 30) + (minutes * 0.5);
    const minuteDegrees = minutes * 6;
    const secondDegrees = seconds * 6;

    const formattedDate = currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="fixed top-6 right-6 z-50 flex flex-col items-center">
        <div className="relative w-32 h-32 flex justify-center items-center">
          <div className="relative w-28 h-28 rounded-full bg-black border-4 border-gray-800 shadow-xl">
            <div className="absolute z-10 w-2 h-2 rounded-full bg-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div 
              className="absolute z-3 w-1 h-8 bg-white rounded-full origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${hourDegrees}deg)`,
                top: '50%',
                left: '50%'
              }}
            ></div>
            <div 
              className="absolute z-2 w-1 h-10 bg-white rounded-full origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${minuteDegrees}deg)`,
                top: '50%',
                left: '50%'
              }}
            ></div>
            <div 
              className="absolute z-1 w-0.5 h-12 bg-red-500 rounded-full origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${secondDegrees}deg)`,
                top: '50%',
                left: '50%'
              }}
            ></div>
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = i * 6;
              const isHourMarker = i % 5 === 0;
              const length = isHourMarker ? 8 : 4;
              const width = isHourMarker ? 2 : 1;
              
              return (
                <div
                  key={i}
                  className={`absolute ${isHourMarker ? 'bg-white' : 'bg-gray-400'} origin-bottom`}
                  style={{
                    width: `${width}px`,
                    height: `${length}px`,
                    left: '50%',
                    top: '5%',
                    transform: `translate(-50%, 0) rotate(${angle}deg) translateY(10px)`,
                    transformOrigin: 'bottom center'
                  }}
                ></div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-center bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-gray-700 shadow">
          <div className="text-md font-mono font-bold text-white">
            {`${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} ${ampm}`}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {formattedDate}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen">
      <ToastContainer 
        position="top-left"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="toast-message"
      />

      <style>
        {`
          .toast-success {
            background: linear-gradient(to right, #4f46e5, #7c3aed, #ec4899) !important;
            color: white !important;
            font-weight: bold;
            border-radius: 12px !important;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.5) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .toast-error {
            background: linear-gradient(to right, #dc2626, #ea580c, #d97706) !important;
            color: white !important;
            font-weight: bold;
            border-radius: 12px !important;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.5) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .Toastify__toast {
            margin-bottom: 0.75rem;
          }
        `}
      </style>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSleekClock()}

        <header className="mb-10 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 tracking-tight">
            Add New Employee
          </h1>
          <p className="mt-3 text-lg text-purple-200/80 drop-shadow-lg">
            Enter employee details to add to the directory
          </p>
        </header>

        <main className="space-y-6">
          <div className="grid grid-cols-1 justify-center">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 border border-purple-500/40 transition-all duration-300"
            >
              <div className="space-y-6">
                <div className="mb-6">
                  <label htmlFor="name" className="block text-purple-200 text-sm font-semibold mb-2 drop-shadow-md">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter employee name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-400/30 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="role" className="block text-purple-200 text-sm font-semibold mb-2 drop-shadow-md">
                    Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Enter job title (optional)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-400/30 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="salary" className="block text-purple-200 text-sm font-semibold mb-2 drop-shadow-md">
                    Salary <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="Enter salary amount"
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-400/30 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="number" className="block text-purple-200 text-sm font-semibold mb-2 drop-shadow-md">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="e.g., +91-9876543210 (optional)"
                    maxLength="15"
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-400/30 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                  <p className="mt-1 text-xs text-purple-300">Optional - Can include country code (max 15 characters)</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isOnline}
                  className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 py-4 font-medium transform hover:scale-105 ${isLoading || !isOnline ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {retryCount > 0 ? `Adding... (Attempt ${retryCount})` : 'Adding...'}
                    </div>
                  ) : (
                    !isOnline ? 'Offline - Cannot Submit' : 'Add Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-10">
        <button
          onClick={() => navigate('/employee-management')}
          className="flex items-center px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow-[0_8px_0_0_rgba(6,82,147,0.8)] hover:shadow-[0_4px_0_0_rgba(6,82,147,0.8)] hover:translate-y-1 transition-all duration-200 group"
        >
          <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Employee List</span>
        </button>
      </div>
    </div>
  );
};

export default AddEmployee;