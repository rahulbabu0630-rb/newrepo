import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaSearch, FaChevronLeft, FaChevronRight, FaHome, FaSync, FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AttendancePage = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const employeesPerPage = 10;
  const navigate = useNavigate();

  // Environment variables with defaults
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Sri Durga Devi Sweets & Bakery';
  const DEFAULT_PROFILE_ICON = import.meta.env.VITE_DEFAULT_PROFILE_ICON || 'https://ui-avatars.com/api/?name=Unknown&background=0077BE&color=fff';

  // Loading animation component
  const LoadingBubbles = () => (
    <div className="flex justify-center items-center py-12">
      <div className="flex gap-2">
        <div className="w-4 h-4 rounded-full bg-[#0077BE] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-4 h-4 rounded-full bg-[#00A9E0] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-4 h-4 rounded-full bg-[#0077BE] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );

  // Employee card component - optimized for mobile
  const EmployeeCard = React.memo(({ employee, onViewReports }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:py-4 sm:px-2 hover:bg-gray-50 transition duration-200 hover:shadow-sm rounded-lg border border-gray-100 mb-3">
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="relative flex-shrink-0">
          <img
            src={employee.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || '')}&background=0077BE&color=fff`}
            alt={`${employee.name}'s profile`}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-sm border-2 border-white transition-transform duration-200 hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = DEFAULT_PROFILE_ICON;
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#00A9E0] rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">{employee.name}</p>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Role: {employee.role || "N/A"}</p>
          <p className="text-xs sm:text-sm text-gray-500">ID: {employee.id}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto justify-end mt-3 sm:mt-0">
        <Link 
          to={`/mark-attendance/${employee.id}`} 
          className="px-3 py-1 sm:px-4 sm:py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#0066A3] transition-all duration-200 hover:shadow-md text-center whitespace-nowrap text-xs sm:text-sm"
        >
          Mark Attendance
        </Link>
        <button 
          onClick={() => onViewReports(employee.id)}
          className="px-3 py-1 sm:px-4 sm:py-2 bg-[#00A9E0] text-white rounded-md hover:bg-[#0098CA] transition-all duration-200 hover:shadow-md whitespace-nowrap text-xs sm:text-sm"
        >
          View Reports
        </button>
      </div>
    </div>
  ));

  // API call with error handling and retry logic
  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/employees/all`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
      
      // Cache the response
      const cacheKey = `employees_${API_BASE_URL}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.message);
      toast.error('Failed to load employees. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Initial load and cache handling
  useEffect(() => {
    const cacheKey = `employees_${API_BASE_URL}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      setEmployees(JSON.parse(cachedData));
    }
    fetchEmployees();

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        fetchEmployees();
      }
    };
    
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => document.removeEventListener('visibilitychange', visibilityHandler);
  }, [fetchEmployees]);

  // Refresh data when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchEmployees();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchEmployees]);

  // Memoized filtered employees
  const filteredEmployees = useMemo(() => 
    employees.filter(emp => 
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.id?.toString().includes(search.toLowerCase())
    ),
    [employees, search]
  );

  // Memoized paginated employees with unique keys
  const paginatedEmployees = useMemo(() => {
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    return filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  }, [filteredEmployees, currentPage, employeesPerPage]);

  // Handlers with memoization
  const handleViewReports = useCallback((employeeId) => {
    navigate(`/attendance-summary/${employeeId}`);
  }, [navigate]);

  const handleLogoClick = useCallback(() => {
    navigate('/attendance');
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const handleBackToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }, []);

  // Navbar component - now responsive with fixed title display
  const Navbar = React.memo(() => {
    // Function to get abbreviated company name for mobile
    const getAbbreviatedName = () => {
      const words = COMPANY_NAME.split(' ');
      if (words.length > 2) {
        return `${words[0]} ${words[1]}...`;
      }
      return COMPANY_NAME;
    };

    return (
      <nav className="bg-[#0077BE] shadow-md relative h-16 w-full">
        <div className="h-full w-full px-4 sm:px-6 flex items-center justify-between">
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          {/* Logo/Title - properly spaced and responsive */}
          <div 
            className="flex items-center cursor-pointer transition-transform duration-200 hover:scale-[1.02] flex-1 md:flex-none"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          >
            <img 
              className="h-8 sm:h-10 w-auto max-h-[40px] mr-2" 
              src="/assets/logo.png" 
              alt="Company Logo"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150x40?text=Logo';
              }}
            />
            <span className="text-lg sm:text-xl font-bold text-white tracking-wide whitespace-nowrap font-sans">
              <span className="md:hidden">{getAbbreviatedName()}</span>
              <span className="hidden md:inline">{COMPANY_NAME}</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 font-sans">
            <Link 
              to="/employee-management" 
              className="text-white hover:bg-[#0066A3] px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap"
            >
              Employee Management
            </Link>
            <Link
              to="/bulk-attendance"
              className="text-white hover:bg-[#0066A3] px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap"
            >
              Bulk Attendance
            </Link>
            <Link 
              to="/attendance-summary" 
              className="text-white hover:bg-[#0066A3] px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap"
            >
              Reports
            </Link>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0077BE] shadow-lg z-50 py-2 px-4">
              <Link 
                to="/employee-management" 
                className="block text-white hover:bg-[#0066A3] px-4 py-3 rounded-md text-base font-medium transition-all duration-200 mb-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Employee Management
              </Link>
              <Link
                to="/bulk-attendance"
                className="block text-white hover:bg-[#0066A3] px-4 py-3 rounded-md text-base font-medium transition-all duration-200 mb-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bulk Attendance
              </Link>
              <Link 
                to="/attendance-summary" 
                className="block text-white hover:bg-[#0066A3] px-4 py-3 rounded-md text-base font-medium transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Attendance Reports
              </Link>
            </div>
          )}
        </div>
      </nav>
    );
  });

  return (
    <div className="relative min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Employee Attendance
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            View and manage employee attendance records
          </p>
        </div>
        
        {/* Search and Refresh - stacked on mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          <div className="relative w-full transition-all duration-200">
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#0077BE] focus:outline-none transition-all duration-200 text-sm sm:text-base"
              value={search}
              onChange={handleSearchChange}
              aria-label="Search employees"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
          </div>
          <button 
            onClick={fetchEmployees}
            className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-[#00A9E0] text-white rounded-lg shadow-sm hover:bg-[#0098CA] transition-all duration-200 w-full sm:w-auto justify-center text-sm sm:text-base"
            aria-label="Refresh employee list"
            disabled={isLoading}
          >
            <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          {isLoading ? (
            <LoadingBubbles />
          ) : error ? (
            <div className="text-center text-red-500 py-4 text-sm sm:text-base">
              {error} <button onClick={fetchEmployees} className="text-blue-600 underline">Retry</button>
            </div>
          ) : paginatedEmployees.length > 0 ? (
            <div className="space-y-2 sm:space-y-0">
              {paginatedEmployees.map((emp, index) => (
                <EmployeeCard 
                  key={`${emp.id}-${index}`}
                  employee={emp}
                  onViewReports={handleViewReports}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4 text-sm sm:text-base">
              {search ? 'No matching employees found' : 'No employees available'}
            </p>
          )}
        </div>

        {/* Pagination - centered and responsive */}
        {!isLoading && !error && filteredEmployees.length > employeesPerPage && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center transition-all duration-200 text-sm sm:text-base ${
                currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#0077BE] text-white hover:bg-[#0066A3] hover:shadow-md'
              }`}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous page"
            >
              <FaChevronLeft className="mr-1" /> Prev
            </button>
            <span className="px-3 py-1 sm:px-4 sm:py-2 font-medium text-sm sm:text-base">
              Page {currentPage} of {Math.ceil(filteredEmployees.length / employeesPerPage)}
            </span>
            <button
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center transition-all duration-200 text-sm sm:text-base ${
                currentPage >= Math.ceil(filteredEmployees.length / employeesPerPage) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#0077BE] text-white hover:bg-[#0066A3] hover:shadow-md'
              }`}
              disabled={currentPage >= Math.ceil(filteredEmployees.length / employeesPerPage)}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next page"
            >
              Next <FaChevronRight className="ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Home button - smaller on mobile */}
      <button
        onClick={handleBackToHome}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 px-3 py-2 sm:px-4 sm:py-3 bg-[#0077BE] text-white rounded-lg shadow-lg hover:bg-[#0066A3] transition-all duration-200 hover:shadow-xl flex items-center text-sm sm:text-base"
        aria-label="Back to home"
      >
        <FaHome className="mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Home</span>
      </button>
    </div>
  );
};

export default React.memo(AttendancePage);