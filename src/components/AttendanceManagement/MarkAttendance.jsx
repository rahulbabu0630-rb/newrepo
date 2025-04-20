import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Custom useInView hook implementation
const useInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isInView];
};

// Date Formatter Utility
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric'
  }).format(date);
};

// Salary Calculator
const calculateDaySalary = (status, monthlySalary, year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRate = monthlySalary / daysInMonth;
  
  return {
    present: dailyRate,
    halfday: dailyRate * 0.5,
    absent: 0
  }[status?.toLowerCase()] || 0;
};

// Enhanced Status Selector Component
const StatusSelector = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ["present", "halfday", "absent"];
  
  return (
    <div className="relative z-20">
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`status-selector ${value || "empty"} ${disabled ? "opacity-50" : "cursor-pointer"}`}
      >
        {value || "Select"}
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="selector-arrow"
        >
          ▼
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="status-options mt-1"
            style={{
              position: 'absolute',
              width: '100%',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            {options.map(option => (
              <motion.div
                key={option}
                whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.05)' }}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`status-option ${option} px-3 py-2`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Attendance Component
const MarkAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [ref, inView] = useInView({ threshold: 0.1 });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const DEFAULT_PROFILE_ICON = import.meta.env.VITE_DEFAULT_PROFILE_ICON;

  // Calculate dates for the selected month/year
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dates = useMemo(() => (
    Array.from(
      { length: totalDaysInMonth },
      (_, i) => `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    )
  ), [selectedYear, selectedMonth, totalDaysInMonth]);

  // Fetch employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/employees/getById/${id}`);
        setEmployee(response.data);
      } catch (error) {
        console.error("Error fetching employee:", error);
        setError("Failed to load employee details");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, API_BASE_URL]);

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/attendance/filter?employeeId=${id}&year=${selectedYear}&month=${selectedMonth}`
      );
      setAttendanceRecords(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to load attendance records");
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [id, selectedYear, selectedMonth, API_BASE_URL]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const result = { present: 0, absent: 0, halfday: 0, totalSalary: 0 };
    
    attendanceRecords.forEach(record => {
      result[record.status] = (result[record.status] || 0) + 1;
      result.totalSalary += record.salary;
    });
    
    return result;
  }, [attendanceRecords]);

  // Handle status change with dual endpoint support
  const handleStatusChange = async (date, newStatus) => {
    if (!newStatus || loading) return;
    
    try {
      setLoading(true);
      setError("");

      const salary = calculateDaySalary(newStatus, employee.salary, selectedYear, selectedMonth);

      // First try mark-past endpoint
      try {
        await axios.post(`${API_BASE_URL}/attendance/mark-past`, null, {
          params: { employeeId: id, status: newStatus, date }
        });
      } catch (markPastError) {
        // Fallback to standard create/update
        const existingRecord = attendanceRecords.find(r => 
          r.date === date || r.date.split('T')[0] === date
        );

        if (existingRecord) {
          await axios.put(`${API_BASE_URL}/attendance/${existingRecord.id}`, {
            status: newStatus,
            salary
          });
        } else {
          await axios.post(`${API_BASE_URL}/attendance`, {
            employeeId: id,
            date,
            status: newStatus,
            salary
          });
        }
      }

      await fetchAttendanceRecords();
      
    } catch (error) {
      console.error("Error updating attendance:", error);
      setError(error.response?.data?.message || "Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  // Year and month ranges for selectors
  const yearRange = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const monthRange = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading && !attendanceRecords.length) return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="h-16 w-16 border-4 border-blue-500 rounded-full"
      />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <style>{`
        .status-selector {
          position: relative;
          width: 120px;
          padding: 8px 12px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }
        .status-selector.present {
          background: linear-gradient(135deg, #4ade80, #3b82f6);
          color: white;
        }
        .status-selector.halfday {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white;
        }
        .status-selector.absent {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
        .status-selector.empty {
          background: linear-gradient(135deg, #64748b, #475569);
          color: white;
        }
        .attendance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .attendance-day-card {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .nav-items {
          display: flex;
          gap: 1rem;
        }
      `}</style>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button - Modified for left/right alignment */}
        <div className="header-container mb-6">
          <motion.h1
            ref={ref}
            initial={{ opacity: 0, x: -100 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-3xl font-bold text-gray-900"
          >
            Attendance Portal
          </motion.h1>
          
          <div className="nav-items">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/attendance')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Attendance
            </motion.button>
          </div>
        </div>
        
        {employee && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-lg shadow mb-8"
          >
            <h2 className="text-xl font-bold">{employee.name}</h2>
            <p>Employee #{id}</p>
          </motion.div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-green-50 p-4 rounded-lg"
          >
            <p className="text-sm text-green-600">Present</p>
            <p className="text-2xl font-bold text-green-700">{summary.present}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-yellow-50 p-4 rounded-lg"
          >
            <p className="text-sm text-yellow-600">Half Day</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.halfday}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-red-50 p-4 rounded-lg"
          >
            <p className="text-sm text-red-600">Absent</p>
            <p className="text-2xl font-bold text-red-700">{summary.absent}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <p className="text-sm text-blue-600">Total Salary</p>
            <p className="text-xl font-bold text-blue-700">₹{summary.totalSalary.toFixed(2)}</p>
          </motion.div>
        </div>
        
        {/* Date Controls */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white border border-gray-300 rounded-md px-4 py-2 w-full"
              disabled={loading}
            >
              {yearRange.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-white border border-gray-300 rounded-md px-4 py-2 w-full"
              disabled={loading}
            >
              {monthRange.map(month => (
                <option key={month} value={month}>
                  {new Date(selectedYear, month - 1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Attendance Grid */}
        <div className="attendance-grid">
          {dates.map(date => {
            const record = attendanceRecords.find(r => 
              r.date === date || r.date.split('T')[0] === date
            );
            const status = record?.status || '';
            const daySalary = record?.salary || 0;

            return (
              <motion.div
                key={date}
                whileHover={{ scale: 1.03 }}
                className="attendance-day-card"
              >
                <div className="font-medium mb-3">{formatDate(date)}</div>
                <div className="mb-3">
                  <StatusSelector
                    value={status}
                    onChange={(newStatus) => handleStatusChange(date, newStatus)}
                    disabled={loading}
                  />
                </div>
                <div className="text-sm">₹{daySalary.toFixed(2)}</div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MarkAttendance;