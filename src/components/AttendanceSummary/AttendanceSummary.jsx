import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

// Components
import FiltersSection from './FiltersSection';
import SummaryCards from './SummaryCards';
import AttendanceCharts from './AttendanceCharts';
import AttendanceTable from './AttendanceTable';
import PDFExporter from './PDFExporter';

const AttendanceSummary = () => {
  const { employeeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = location.state || {};

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME;

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    halfday: 0,
    halfdaySalary: 0,
    totalSalary: 0,
    monthlySalary: 0
  });
  const [loading, setLoading] = useState({
    employees: true,
    salary: false,
    attendance: false
  });
  const [error, setError] = useState('');

  // Calculate days in month and daily rate
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dailyRate = useMemo(() => {
    return summary.monthlySalary > 0 ? summary.monthlySalary / daysInMonth : 0;
  }, [summary.monthlySalary, daysInMonth]);

  // Data fetching functions
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, employees: true }));
      const response = await axios.get(`${API_BASE_URL}/employees/all`);
      setEmployees(response.data);
      if (employeeId) {
        setSelectedEmployee(employeeId);
        // Fetch salary immediately if employee is preselected
        await fetchMonthlySalary(employeeId);
      }
      setError('');
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError('Failed to load employees');
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  }, [employeeId, API_BASE_URL]);

  const fetchMonthlySalary = useCallback(async (empId) => {
    if (!empId) {
      setSummary(prev => ({ ...prev, monthlySalary: 0 }));
      return;
    }

    setLoading(prev => ({ ...prev, salary: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/getById/${empId}`);
      const salary = response.data?.salary || 0;
      setSummary(prev => ({
        ...prev,
        monthlySalary: salary
      }));
      setError('');
    } catch (err) {
      console.error("Error fetching salary:", err);
      const employee = employees.find(e => e.id === empId);
      setSummary(prev => ({
        ...prev,
        monthlySalary: employee?.salary || 0
      }));
      setError('Failed to load salary data. Using fallback value.');
    } finally {
      setLoading(prev => ({ ...prev, salary: false }));
    }
  }, [employees, API_BASE_URL]);

  const fetchAttendanceData = useCallback(async () => {
    if (!selectedEmployee && employeeId) return;

    setLoading(prev => ({ ...prev, attendance: true }));
    try {
      const params = {
        year: selectedYear,
        month: selectedMonth
      };
      
      if (selectedEmployee) {
        params.employeeId = selectedEmployee;
      }

      const response = await axios.get(`${API_BASE_URL}/attendance/filter`, {
        params,
        paramsSerializer: {
          indexes: null // Correctly handles array params if needed
        }
      });

      const records = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setAttendanceData(records);
      calculateSummary(records);
      setError('');
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.response?.data?.message || 'Failed to load attendance data');
      setAttendanceData([]);
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  }, [selectedEmployee, selectedYear, selectedMonth, employeeId, API_BASE_URL]);

  const calculateSummary = useCallback((records) => {
    const calculatedSummary = {
      present: 0,
      absent: 0,
      halfday: 0,
      halfdaySalary: 0,
      totalSalary: 0,
      monthlySalary: summary.monthlySalary
    };

    records.forEach(record => {
      switch(record.status?.toLowerCase()) {
        case 'present':
          calculatedSummary.present++;
          calculatedSummary.totalSalary += dailyRate;
          break;
        case 'halfday':
          calculatedSummary.halfday++;
          calculatedSummary.halfdaySalary += (dailyRate * 0.5);
          calculatedSummary.totalSalary += (dailyRate * 0.5);
          break;
        case 'absent':
          calculatedSummary.absent++;
          break;
        default:
          // Handle unknown status
          break;
      }
    });

    setSummary(calculatedSummary);
  }, [summary.monthlySalary, dailyRate]);

  // Handlers
  const handleEmployeeChange = async (empId) => {
    setSelectedEmployee(empId);
    await fetchMonthlySalary(empId);
    navigate(empId ? `/attendance-summary/${empId}` : '/attendance-summary', {
      state: { year: selectedYear, month: selectedMonth }
    });
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    navigate(selectedEmployee ? `/attendance-summary/${selectedEmployee}` : '/attendance-summary', {
      state: { year, month: selectedMonth }
    });
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    navigate(selectedEmployee ? `/attendance-summary/${selectedEmployee}` : '/attendance-summary', {
      state: { year: selectedYear, month }
    });
  };

  // Effects
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const isLoading = loading.employees || loading.salary || loading.attendance;

  return (
    <div className="container mx-auto p-4 relative">
      <h1 className="text-2xl font-bold mb-6">Attendance Summary</h1>
      
      <FiltersSection
        employees={employees}
        selectedEmployee={selectedEmployee}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onEmployeeChange={handleEmployeeChange}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        loading={loading}
        attendanceData={attendanceData}
        onExport={() => PDFExporter({
          employee: selectedEmployee ? employees.find(e => e.id === selectedEmployee) : null,
          selectedYear,
          selectedMonth,
          summary,
          attendanceData,
          COMPANY_NAME,
          formatNumber,
          formatDate,
          capitalizeFirstLetter
        })}
      />

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading data...</p>
        </div>
      ) : attendanceData.length > 0 ? (
        <>
          <SummaryCards 
            summary={summary} 
            selectedEmployee={selectedEmployee} 
            formatNumber={formatNumber} 
          />
          
          <AttendanceCharts 
            summary={summary} 
            attendanceData={attendanceData} 
            selectedEmployee={selectedEmployee} 
          />
          
          <AttendanceTable 
            attendanceData={attendanceData} 
            selectedEmployee={selectedEmployee} 
            formatDate={formatDate} 
            formatNumber={formatNumber} 
            capitalizeFirstLetter={capitalizeFirstLetter} 
          />
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          No attendance records found for the selected period
        </div>
      )}

      <motion.button
        onClick={() => navigate('/attendance')}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full shadow-xl text-white font-medium flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)'
        }}
        whileHover={{ 
          scale: 1.05,
          background: 'linear-gradient(135deg, #4338ca, #7c3aed)'
        }}
        whileTap={{ scale: 0.95 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back
      </motion.button>
    </div>
  );
};

// Utility functions
const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export default AttendanceSummary;