import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaSearch, FaUserCircle, FaArrowUp, FaArrowDown, FaArrowLeft, FaSpinner, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmployeeAttendanceDashboard from "../EmployeeDashboard/EmployeeAttendanceDashboard";

const employeeCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes cache
};

const BulkAttendancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); 
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());

  // Check if selected date is valid (not future date)
  const isDateValid = useMemo(() => {
    const today = getCurrentDate();
    return selectedDate <= today;
  }, [selectedDate]);

  // Memoized toast function
  const showToast = useCallback((type, message) => {
    const toastConfig = {
      position: isMobile ? "top-center" : "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: `toast-${type} animate__animated animate__fadeInRight`,
      style: {
        background: 'linear-gradient(to right, #8B5CF6, #EC4899)',
        color: '#fff',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        margin: '10px',
        width: 'auto',
        minWidth: isMobile ? '90%' : '300px',
        fontSize: isMobile ? '14px' : '16px'
      }
    };

    switch(type) {
      case 'success':
        toast.success(message, toastConfig);
        break;
      case 'warning':
        toast.warning(message, toastConfig);
        break;
      case 'error':
        toast.error(message, toastConfig);
        break;
      case 'info':
        toast.info(message, toastConfig);
        break;
      default:
        toast(message, toastConfig);
    }
  }, [isMobile]);

  // Show date warning notification
  const showDateWarningNotification = useCallback(() => {
    showToast('error', 'Cannot mark attendance for future dates. Please select today or a past date.');
    setShowDateWarning(true);
    setTimeout(() => setShowDateWarning(false), 3000);
  }, [showToast]);

  // Optimized employee filtering
  const filteredEmployees = useMemo(() => {
    if (!search) return employees;
    
    const searchLower = search.toLowerCase();
    return employees.filter((emp) => 
      emp.name.toLowerCase().includes(searchLower) ||
      emp.id.toString().includes(search)
    );
  }, [employees, search]);

  // Fetch employees with caching
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        
        // Check cache first
        const now = Date.now();
        if (employeeCache.data && now - employeeCache.timestamp < employeeCache.CACHE_DURATION) {
          setEmployees(employeeCache.data);
          setIsLoading(false);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employees/all`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update cache
        employeeCache.data = data;
        employeeCache.timestamp = now;
        
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        showToast('error', 'Failed to load employees. Please try again later.');
        
        // Fallback to cache even if stale
        if (employeeCache.data) {
          setEmployees(employeeCache.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, [showToast]);

  // Optimized employee selection
  const handleEmployeeSelect = useCallback((employeeId) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  }, []);

  // Optimized select all
  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    } else {
      setSelectedEmployees(new Set());
    }
  }, [filteredEmployees]);

  // Handle date change with validation
  const handleDateChange = useCallback((e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    if (newDate > getCurrentDate()) {
      showDateWarningNotification();
    }
  }, [showDateWarningNotification]);

  // Optimized bulk attendance marking
  const markBulkAttendance = useCallback(async () => {
    if (!selectedStatus) {
      showToast('error', 'Please select attendance status');
      return;
    }

    if (selectedEmployees.size === 0) {
      showToast('error', 'Please select at least one employee');
      return;
    }

    if (!isDateValid) {
      showDateWarningNotification();
      return;
    }

    try {
      setIsMarking(true);
      
      // Optimistic UI update
      const employeeIds = Array.from(selectedEmployees);
      const prevEmployees = [...employees];
      
      setEmployees(prev => prev.map(emp => 
        selectedEmployees.has(emp.id) 
          ? { ...emp, lastStatus: selectedStatus } 
          : emp
      ));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bulk-attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeIds,
          status: selectedStatus,
          date: selectedDate
        })
      });
      
      if (!response.ok) {
        // Revert optimistic update if failed
        setEmployees(prevEmployees);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark attendance');
      }
      
      const successMessages = {
        present: `Successfully marked ${employeeIds.length} employees as Present`,
        absent: `Marked ${employeeIds.length} employees as Absent`,
        halfday: `Marked ${employeeIds.length} employees as Half Day`
      };
      
      showToast('success', successMessages[selectedStatus]);
      setSelectedEmployees(new Set());

    } catch (error) {
      showToast('error', error.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setIsMarking(false);
    }
  }, [selectedStatus, selectedEmployees, selectedDate, isDateValid, showToast, employees, showDateWarningNotification]);

  const handleLogoClick = useCallback(() => {
    navigate('/attendance');
  }, [navigate]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  const statusColors = useMemo(() => ({
    present: "bg-purple-100 text-purple-800",
    absent: "bg-pink-100 text-pink-800",
    halfday: "bg-indigo-100 text-indigo-800"
  }), []);

  // Memoized employee count
  const selectedCount = useMemo(() => selectedEmployees.size, [selectedEmployees]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <ToastContainer 
        position={isMobile ? "top-center" : "top-right"}
        autoClose={5000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        className="animate__animated animate__fadeIn"
      />
      
      {/* Responsive Header */}
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className={`${isMobile ? 'absolute left-2' : 'absolute left-4'} flex items-center`}>
              <div 
                className="flex items-center cursor-pointer group"
                onClick={handleLogoClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
              >
                <img 
                  className={`${isMobile ? 'h-8' : 'h-10'} w-auto max-h-[40px] transform transition-all duration-300 group-hover:scale-110`}
                  src="/assets/logo.png" 
                  alt="Company Logo"
                  style={{
                    maxWidth: isMobile ? '120px' : '150px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x40?text=Logo';
                    e.target.className = `${isMobile ? 'h-8' : 'h-10'} w-auto max-h-[40px]`;
                  }}
                  loading="lazy"
                />
                {!isMobile && (
                  <span className="ml-2 text-xl font-bold text-white tracking-wide group-hover:text-opacity-80 transition-all duration-300">
                    {import.meta.env.VITE_COMPANY_NAME}
                  </span>
                )}
              </div>
            </div>

            {/* Nav items - Updated for better mobile view */}
            <div className={`${isMobile ? 'absolute right-2 space-x-1' : 'absolute right-4 space-x-4'} flex items-center`}>
              <button 
                onClick={() => navigate('/employee-dashboard')}
                className={`flex items-center ${isMobile ? 'p-1 text-xs' : 'px-3 py-1 text-sm'} bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300`}
              >
                <FaUsers className={isMobile ? 'text-sm' : 'mr-1'} />
                {!isMobile && <span>Employee Dashboard</span>}
              </button>
              <button 
                onClick={handleLogoClick}
                className={`flex items-center ${isMobile ? 'p-1 text-xs' : 'px-3 py-1 text-sm'} bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300`}
              >
                <FaArrowLeft className={isMobile ? '' : 'mr-1'} />
                {!isMobile && <span>Back to Attendance</span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {!isMobile && (
        <button 
          onClick={scrollToBottom}
          className="fixed top-20 left-6 z-50 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-110"
        >
          <FaArrowDown />
        </button>
      )}

      {/* Main content with padding to account for fixed header */}
      <div className={`${isMobile ? 'pt-20 px-3 py-4' : 'pt-24 px-6 py-8'} max-w-6xl mx-auto`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-purple-900 text-center mb-4 uppercase tracking-wide`}>
          Single Click Attendance
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <FaSpinner className="animate-spin text-purple-600 text-4xl mb-4" />
              <p className="text-purple-700 text-lg font-medium">Loading employees...</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`${isMobile ? 'flex-col' : 'flex-col md:flex-row'} justify-between items-center mb-4 gap-3`}>
              <div className="relative w-full mb-3">
                <input
                  type="text"
                  placeholder="Search employees..."
                  className={`w-full pl-10 pr-4 ${isMobile ? 'py-2 text-sm' : 'py-3 text-lg'} border border-purple-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-300`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <FaSearch className={`absolute left-3 ${isMobile ? 'top-2.5 text-sm' : 'top-4 text-lg'} text-purple-400`} />
              </div>
              
              <div className={`${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-3 w-full`}>
                <div className="relative mb-3">
                  <input 
                    type="date" 
                    className={`border ${isMobile ? 'py-2 text-sm' : 'py-3 text-lg'} ${isDateValid ? 'border-purple-200' : 'border-red-400'} rounded-lg px-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300 bg-white pr-10 w-full`}
                    value={selectedDate}
                    onChange={handleDateChange}
                    max={getCurrentDate()}
                  />
                  <FaCalendarAlt className={`absolute right-3 ${isMobile ? 'top-2.5 text-sm' : 'top-4 text-lg'} ${isDateValid ? 'text-purple-400' : 'text-red-500'}`} />
                  {!isDateValid && (
                    <div className="absolute -bottom-5 left-0 text-red-500 text-xs font-medium flex items-center">
                      <span>Cannot mark future dates</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mb-4 transform transition-all duration-300 hover:shadow-lg border border-purple-100">
              <div className={`${isMobile ? 'flex-col' : 'flex-col md:flex-row'} justify-between items-center mb-4 gap-3`}>
                <div className={`${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} items-center gap-3 w-full`}>
                  <select 
                    className={`border border-purple-200 rounded-lg px-4 ${isMobile ? 'py-2 text-sm w-full' : 'py-3 text-lg w-full sm:w-auto'} focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300`}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="halfday">Half Day</option>
                  </select>
                  <button 
                    onClick={markBulkAttendance}
                    className={`px-4 ${isMobile ? 'py-2 text-sm' : 'py-3 text-lg'} bg-gradient-to-r ${isDateValid ? 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'from-gray-400 to-gray-500 cursor-not-allowed'} text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center min-w-[120px]`}
                    disabled={!selectedStatus || selectedCount === 0 || isMarking || !isDateValid}
                  >
                    {isMarking ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        {isMobile ? 'Processing' : 'Processing...'}
                      </>
                    ) : (
                      isMobile ? 'Mark' : 'Mark Attendance'
                    )}
                  </button>
                </div>
                <div className={`${isMobile ? 'text-sm mt-2' : 'text-lg'} text-purple-700 font-medium text-center`}>
                  {selectedCount} employees selected
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-200">
                  <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <tr>
                      <th className={`${isMobile ? 'px-4 py-2' : 'px-8 py-4'} text-left text-sm font-medium text-purple-800 uppercase tracking-wider`}>
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 rounded focus:ring-purple-500 transition-all duration-300"
                          checked={selectedCount === filteredEmployees.length && filteredEmployees.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className={`${isMobile ? 'px-4 py-2' : 'px-8 py-4'} text-left text-sm font-medium text-purple-800 uppercase tracking-wider`}>ID</th>
                      <th className={`${isMobile ? 'px-4 py-2' : 'px-8 py-4'} text-left text-sm font-medium text-purple-800 uppercase tracking-wider`}>Name</th>
                      <th className={`${isMobile ? 'px-4 py-2' : 'px-8 py-4'} text-left text-sm font-medium text-purple-800 uppercase tracking-wider`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-purple-100">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-purple-50 transition-colors duration-300">
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-8 py-5'} whitespace-nowrap`}>
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 rounded focus:ring-purple-500 transition-all duration-300"
                              checked={selectedEmployees.has(emp.id)}
                              onChange={() => handleEmployeeSelect(emp.id)}
                            />
                          </td>
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-8 py-5'} whitespace-nowrap ${isMobile ? 'text-sm' : 'text-lg'} text-purple-900 font-medium`}>{emp.id}</td>
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-8 py-5'} whitespace-nowrap`}>
                            <div className="flex items-center">
                              {emp.profileImage ? (
                                <img
                                  src={emp.profileImage}
                                  alt="Profile"
                                  className={`${isMobile ? 'w-8 h-8 mr-2' : 'w-10 h-10 mr-4'} rounded-full shadow-sm border-2 border-purple-200 transform transition-all duration-300 hover:scale-110`}
                                  loading="lazy"
                                />
                              ) : (
                                <FaUserCircle className={`${isMobile ? 'w-8 h-8 mr-2' : 'w-10 h-10 mr-4'} rounded-full text-purple-400`} />
                              )}
                              <div>
                                <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium text-purple-900`}>{emp.name}</div>
                                {!isMobile && <div className="text-base text-purple-500">{emp.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td className={`${isMobile ? 'px-4 py-3' : 'px-8 py-5'} whitespace-nowrap ${isMobile ? 'text-sm' : 'text-lg'}`}>
                            {selectedStatus && selectedEmployees.has(emp.id) ? (
                              <span className={`px-2 py-1 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold rounded-full ${statusColors[selectedStatus]}`}>
                                {selectedStatus}
                              </span>
                            ) : emp.lastStatus ? (
                              <span className={`px-2 py-1 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold rounded-full ${statusColors[emp.lastStatus]}`}>
                                {emp.lastStatus}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-4 text-center text-purple-500">
                          No employees found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <button 
        onClick={scrollToTop}
        className={`fixed ${isMobile ? 'bottom-4 right-4 p-3' : 'bottom-6 right-6 p-4'} z-50 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-110`}
      >
        <FaArrowUp className={isMobile ? 'text-base' : 'text-lg'} />
      </button>
    </div>
  );
};

export default BulkAttendancePage;