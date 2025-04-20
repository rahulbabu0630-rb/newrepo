import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import debounce from 'lodash.debounce';

const EmployeeDirectory = () => {
  const DEFAULT_PROFILE_ICON = '/assets/default.png';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://durgadevisweets.onrender.com';
  const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Employee Management';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  const navigate = useNavigate();

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Validate date parameters
  const validateDateParams = (year, month) => {
    const currentYear = new Date().getFullYear();
    return (
      year >= 2000 && year <= currentYear + 5 &&
      month >= 1 && month <= 12
    );
  };

  // Fetch attendance data with proper error handling
  const fetchAttendance = async (employeeId, year, month) => {
    try {
      if (!validateDateParams(year, month)) {
        throw new Error('Invalid date parameters');
      }

      const response = await axios.get(`${API_BASE_URL}/attendance/filter`, {
        params: { 
          employeeId,
          year: parseInt(year),
          month: parseInt(month)
        },
        validateStatus: (status) => status < 500
      });

      if (response.status === 400) {
        throw new Error(response.data?.message || 'Invalid request parameters');
      }

      return response.data;
    } catch (error) {
      console.error("Attendance API Error:", {
        url: error.config?.url,
        params: error.config?.params,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  };

  // Debounced version of fetchAttendance
  const debouncedFetchAttendance = debounce(async (employeeId, year, month) => {
    try {
      const data = await fetchAttendance(employeeId, year, month);
      setAttendanceData(prev => ({
        ...prev,
        [employeeId]: data
      }));
    } catch (error) {
      showToastMessage(error.message, 'error');
    }
  }, 500);

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/employees/all`);
      
      if (response.status !== 200) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format from server');
      }

      const employeesWithDefaults = data.map(emp => ({
        ...emp,
        profileImage: DEFAULT_PROFILE_ICON,
        number: emp.number || '',
        salary: emp.salary || 0
      }));
      setEmployees(employeesWithDefaults);

      // Fetch attendance for current month for each employee
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      await Promise.all(
        employeesWithDefaults.map(emp => 
          debouncedFetchAttendance(emp.id, currentYear, currentMonth)
        )
      );
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.message);
      showToastMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Toast message helper
  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // Delete employee handler with improved error handling
  const handleDelete = async (id) => {
    setIsProcessing(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/employees/delete/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500 // Consider 4xx errors as not successful but not throw
      });

      if (response.status === 200 || response.status === 204) {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        setShowDeleteConfirm(null);
        showToastMessage('Employee deleted successfully');
      } else if (response.status === 404) {
        throw new Error('Employee not found');
      } else if (response.status === 500) {
        throw new Error('Server error while deleting employee');
      } else {
        throw new Error(response.data?.message || 'Failed to delete employee');
      }
    } catch (err) {
      console.error("Error deleting employee:", {
        error: err,
        response: err.response
      });
      showToastMessage(
        err.response?.data?.message || 
        err.message || 
        'Failed to delete employee', 
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Navigation handlers
  const navigateToEditProfile = (employee) => {
    navigate(`/employee-profile/${employee.id}`, { state: { employee } });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(search.toLowerCase())
  );

  // Format salary display
  const formatSalary = (salary) => {
    if (salary === null || salary === undefined || salary === '') return 'N/A';
    return `₹${parseFloat(salary).toLocaleString('en-IN')}`;
  };

  // Loading state
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <p className="text-gray-600 text-lg font-medium">Loading employee data...</p>
    </div>
  );

  // Error state
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-red-100 transform hover:scale-[1.02] transition-transform duration-300">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Error Loading Data</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={fetchEmployees}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium flex items-center mx-auto"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-blue-50 to-gray-50 min-h-screen">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 p-4 rounded-2xl shadow-2xl z-50 flex items-center 
          ${toast.type === 'error' ? 'bg-red-500' : 'bg-blue-400'} 
          text-white transform transition-all duration-300 animate-[toast-pop_0.5s]`}
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} 
            text-2xl mr-3`}></i>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-col items-start">
            <motion.div 
              className="px-4 py-2 bg-white rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
              whileHover={{ scale: 1.02 }}
              style={{
                background: 'linear-gradient(145deg, #ffffff, #f9f9f9)',
                boxShadow: '5px 5px 15px rgba(0,0,0,0.1), -5px -5px 15px rgba(255,255,255,0.8)'
              }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                 THE BOYS
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base px-1 py-1 bg-gray-50 rounded-lg">
                Manage Your Workers
              </p>
            </motion.div>
          </div>
          
          <button
            onClick={() => navigate('/add-employee')}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl hover:from-blue-700 hover:to-blue-600 flex items-center transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl font-medium whitespace-nowrap"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <i className="fas fa-user-plus mr-2"></i>
            Add New Employee
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search employees by name..."
            className="w-full pl-12 pr-5 py-3 border border-gray-200 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 focus:shadow-xl bg-white text-gray-700 placeholder-gray-400 transform hover:-translate-y-0.5"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-transform duration-200 transform hover:scale-125"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
        >
          <img src={DEFAULT_PROFILE_ICON} alt="No employees" className="w-24 h-24 mx-auto mb-6 opacity-30 transform hover:rotate-12 transition-transform duration-500" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">
            {search ? 'No matching employees found' : 'Your employee list is empty'}
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {search ? 'Try a different search term' : 'Add your first employee to get started'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/add-employee')}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Employee
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map(employee => (
            <div 
              key={employee.id} 
              className="bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl border border-gray-100 group"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                willChange: 'transform'
              }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => navigateToEditProfile(employee)}
                  >
                    <div className="relative">
                      <img 
                        src={DEFAULT_PROFILE_ICON}
                        alt={employee.name}
                        className="w-14 h-14 rounded-full object-cover mr-4 border-4 border-white shadow-lg group-hover:border-blue-200 transition-all duration-500 group-hover:rotate-6"
                        style={{ transformStyle: 'preserve-3d' }}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md transform group-hover:scale-125 transition-transform duration-300">
                        <i className="fas fa-check text-white text-xs"></i>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                        {employee.name}
                      </h3>
                      <p className="text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-medium">
                        {employee.role || 'No role specified'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(employee.id)}
                    className="text-gray-400 hover:text-red-500 transition-all duration-300 transform hover:scale-125 p-1"
                    title="Delete employee"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center bg-gray-50 p-3 rounded-xl group-hover:bg-blue-50 transition-all duration-300 transform group-hover:-translate-y-0.5">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 rounded-xl mr-3 text-blue-600 shadow-sm transform group-hover:rotate-6 transition-transform duration-300">
                      <i className="fas fa-wallet text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Salary</p>
                      <p className="font-medium text-gray-700">{formatSalary(employee.salary)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-gray-50 p-3 rounded-xl group-hover:bg-blue-50 transition-all duration-300 transform group-hover:-translate-y-0.5">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 rounded-xl mr-3 text-blue-600 shadow-sm transform group-hover:rotate-6 transition-transform duration-300">
                      <i className="fas fa-phone-alt text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="font-medium text-gray-700">{employee.number || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  {attendanceData[employee.id] && (
                    <div className="flex items-center bg-gray-50 p-3 rounded-xl group-hover:bg-blue-50 transition-all duration-300 transform group-hover:-translate-y-0.5">
                      <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 rounded-xl mr-3 text-blue-600 shadow-sm transform group-hover:rotate-6 transition-transform duration-300">
                        <i className="fas fa-calendar-check text-sm"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Attendance (Current Month)</p>
                        <p className="font-medium text-gray-700">
                          {attendanceData[employee.id]?.presentDays || 0} days present
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => navigateToEditProfile(employee)}
                    className="text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium flex items-center transition-all duration-300 transform hover:scale-105"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <i className="fas fa-pen mr-2"></i>
                    Edit Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 animate-[modal-pop_0.5s]"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="p-6">
              <div className="flex items-start mb-5">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-red-100 to-pink-100 shadow-inner mr-4 transform hover:rotate-12 transition-transform duration-300">
                  <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Confirm Deletion</h2>
                  <p className="text-gray-600 mt-1">
                    Are you sure you want to permanently delete <span className="font-semibold">{employees.find(e => e.id === showDeleteConfirm)?.name}</span>?
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100 transform hover:-translate-y-0.5 transition-transform duration-300">
                <div className="flex">
                  <div className="flex-shrink-0 text-red-400 mr-3 transform hover:scale-125 transition-transform duration-200">
                    <i className="fas fa-exclamation-circle"></i>
                  </div>
                  <div>
                    <p className="text-sm text-red-700">
                      This action cannot be undone. All associated attendance records will also be deleted.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
                  disabled={isProcessing}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className={`px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 transform hover:-translate-y-0.5 ${
                    isProcessing ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                  disabled={isProcessing}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Deleting...
                    </>
                  ) : (
                    'Delete Permanently'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back Button */}
      <motion.button
        onClick={() => navigate('/attendance')}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full shadow-xl text-white font-medium flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          transformStyle: 'preserve-3d',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)'
        }}
        whileHover={{ 
          scale: 1.05,
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)'
        }}
        whileTap={{ scale: 0.95 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
            clipRule="evenodd" 
          />
        </svg>
        Back
      </motion.button>

      {/* Scroll-to-Top Button */}
      {showScrollButton && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 p-3 rounded-2xl shadow-2xl text-white font-medium flex items-centre"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          whileHover={{ 
            scale: 1.05,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            rotate: 5
          }}
          whileTap={{ scale: 0.95 }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </motion.button>
      )}

      {/* Custom Animations */}
      <style jsx="true" global="true">{`
        @keyframes toast-pop {
          0% { transform: translateY(20px) scale(0.9); opacity: 0; }
          50% { transform: translateY(-10px) scale(1.05); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes modal-pop {
          0% { transform: scale(0.8) rotateX(-15deg); opacity: 0; }
          100% { transform: scale(1) rotateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDirectory;