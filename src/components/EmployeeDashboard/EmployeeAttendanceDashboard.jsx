import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  faSearch, 
  faFilter, 
  faCalendarAlt,
  faUserCheck,
  faUserTimes,
  faUserClock,
  faExclamationTriangle,
  faSyncAlt,
  faFileCsv,
  faFilePdf,
  faHome,
  faUsers,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const EmployeeAttendanceDashboard = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chartRef = useRef(null);
  
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    total: 0
  });

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let result = [...attendanceData];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.employeeName.toLowerCase().includes(term) ||
        String(item.employeeId).includes(term) ||
        item.department?.toLowerCase().includes(term) ||
        item.position?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    return result;
  }, [searchTerm, statusFilter, attendanceData]);

  // Navigation handlers
  const goToHome = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };
  
  const goToBulkAttendance = () => {
    navigate('/bulk-attendance');
    setIsMobileMenuOpen(false);
  };

  // Calculate summary when filteredData changes
  useEffect(() => {
    calculateSummary(filteredData);
  }, [filteredData]);

  // Fetch today's attendance data - Fixed 404 issue
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/attendance/all-today-status`;
      
      // Add debug logging
      console.log('Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          url: apiUrl,
          errorData
        });
        throw new Error(errorData?.message || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received - expected array');
      }
      
      // Enhanced data processing with fallbacks
      const processedData = data.map(item => ({
        employeeId: item.employeeId || 0,
        employeeName: item.employeeName || 'Unknown',
        status: (item.status || item.attendanceStatus || 'absent').toLowerCase() === 'halfday' 
          ? 'half-day' 
          : (item.status || item.attendanceStatus || 'absent').toLowerCase(),
        date: item.currentDate || item.date || new Date().toISOString(),
        department: item.department || item.role || 'N/A',
        position: item.position || item.role || 'N/A',
        lastCheckIn: item.lastCheckIn || item.checkInTime || null
      }));
      
      setAttendanceData(processedData);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to fetch attendance data. Please try again.');
      toast.error(`Error: ${err.message}`, { 
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate summary statistics
  const calculateSummary = (data) => {
    const present = data.filter(item => item.status === 'present').length;
    const absent = data.filter(item => item.status === 'absent').length;
    const halfDay = data.filter(item => item.status === 'half-day').length;
    
    setSummary({
      present,
      absent,
      halfDay,
      total: data.length
    });
  };

  // Initialize or update chart
  useEffect(() => {
    if (filteredData.length > 0 && chartRef.current) {
      const chart = echarts.getInstanceByDom(chartRef.current) || echarts.init(chartRef.current);
      
      const statusCounts = filteredData.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      const option = {
        tooltip: { trigger: 'item' },
        legend: { 
          top: '5%', 
          left: 'center',
          textStyle: {
            fontSize: window.innerWidth < 768 ? 10 : 12
          }
        },
        series: [{
          name: 'Attendance Status',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { 
            show: false, 
            position: 'center',
            fontSize: window.innerWidth < 768 ? 10 : 12
          },
          emphasis: {
            label: {
              show: true,
              fontSize: window.innerWidth < 768 ? '14' : '18',
              fontWeight: 'bold'
            }
          },
          labelLine: { show: false },
          data: [
            { 
              value: statusCounts.present || 0, 
              name: 'Present', 
              itemStyle: { 
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#4facfe' },
                  { offset: 1, color: '#00f2fe' }
                ])
              } 
            },
            { 
              value: statusCounts.absent || 0, 
              name: 'Absent', 
              itemStyle: { 
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ff758c' },
                  { offset: 1, color: '#ff7eb3' }
                ])
              } 
            },
            { 
              value: statusCounts['half-day'] || 0, 
              name: 'Half Day', 
              itemStyle: { 
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#f6d365' },
                  { offset: 1, color: '#fda085' }
                ])
              } 
            }
          ]
        }]
      };
      
      chart.setOption(option);
      
      const handleResize = () => {
        chart.resize();
        option.legend.textStyle.fontSize = window.innerWidth < 768 ? 10 : 12;
        option.series[0].emphasis.label.fontSize = window.innerWidth < 768 ? '14' : '18';
        chart.setOption(option);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, [filteredData]);

  // Initial data fetch with auto-refresh
  useEffect(() => {
    const fetchData = async () => {
      await fetchAttendanceData();
    };
    
    fetchData(); // Initial fetch
    
    const interval = setInterval(fetchData, 300000); // 5 minutes
    
    // Add visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(); // Refresh when tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAttendanceData]);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '--';
    try {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--';
    }
  };

  // Export to PDF
  const exportToPDF = useCallback(() => {
    try {
      toast.info('Preparing PDF export...', { autoClose: 2000 });
      
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 172, 254);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Employee Attendance Report', 105, 20, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 40);
      doc.text(`Generated At: ${new Date().toLocaleTimeString()}`, 14, 47);
      
      // Summary
      doc.setDrawColor(79, 172, 254);
      doc.setLineWidth(0.5);
      doc.line(14, 55, 60, 55);
      
      doc.setFontSize(14);
      doc.text('Attendance Summary', 14, 65);
      
      doc.setFontSize(12);
      doc.text(`Present: ${summary.present}`, 14, 75);
      doc.text(`Absent: ${summary.absent}`, 14, 85);
      doc.text(`Half Day: ${summary.halfDay}`, 14, 95);
      doc.text(`Total Employees: ${summary.total}`, 14, 105);
      
      // Table data
      const headers = [['ID', 'Name', 'Department', 'Position', 'Status', 'Last Check-In']];
      const rows = filteredData.map(item => [
        item.employeeId,
        item.employeeName,
        item.department,
        item.position,
        item.status.charAt(0).toUpperCase() + item.status.slice(1),
        item.lastCheckIn ? formatTime(item.lastCheckIn) : '--'
      ]);
      
      // Add table
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 120,
        headStyles: {
          fillColor: [79, 172, 254],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255]
        },
        didParseCell: (data) => {
          if (data.column.index === 4) { // Status column
            const status = data.cell.raw.toLowerCase();
            if (status === 'present') {
              data.cell.styles.fillColor = [224, 242, 254];
              data.cell.styles.textColor = [3, 105, 161];
            } else if (status === 'absent') {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [185, 28, 28];
            } else if (status.includes('half')) {
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.textColor = [146, 64, 14];
            }
          }
        }
      });
      
      doc.save(`attendance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      toast.error(`Failed to export PDF: ${err.message}`);
    }
  }, [filteredData, summary]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    try {
      toast.info('Preparing CSV export...', { autoClose: 2000 });
      
      const headers = ['Employee ID', 'Name', 'Department', 'Position', 'Status', 'Last Check-In'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          item.employeeId,
          `"${item.employeeName.replace(/"/g, '""')}"`,
          `"${item.department.replace(/"/g, '""')}"`,
          `"${item.position.replace(/"/g, '""')}"`,
          item.status,
          item.lastCheckIn ? formatTime(item.lastCheckIn) : '--'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      toast.success('CSV exported successfully!');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error(`Failed to export CSV: ${err.message}`);
    }
  }, [filteredData]);

  // Loading skeleton for table
  const TableSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-200 rounded"></div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-4">
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  );

  // Chart skeleton for loading state
  const ChartSkeleton = () => (
    <div className="flex justify-center items-center h-48 md:h-64">
      <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-2 md:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-md p-2 md:p-4 lg:p-6">
        {/* Mobile menu button */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <button 
            onClick={goToHome}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
            title="Home"
          >
            <FontAwesomeIcon icon={faHome} size="lg" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mb-4 bg-blue-50 rounded-lg p-4">
            <button 
              onClick={goToBulkAttendance}
              className="w-full flex items-center p-3 text-blue-600 hover:bg-blue-100 rounded-md transition-colors mb-2"
            >
              <FontAwesomeIcon icon={faUsers} className="mr-3" />
              Bulk Attendance
            </button>
            <button
              onClick={exportToCSV}
              className="w-full flex items-center p-3 text-blue-600 hover:bg-blue-100 rounded-md transition-colors mb-2"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faFileCsv} className="mr-3" />
              Export to CSV
            </button>
            <button
              onClick={exportToPDF}
              className="w-full flex items-center p-3 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faFilePdf} className="mr-3" />
              Export to PDF
            </button>
          </div>
        )}

        {/* Header with navigation buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={goToHome}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                title="Home"
              >
                <FontAwesomeIcon icon={faHome} size="lg" />
              </button>
              <button 
                onClick={goToBulkAttendance}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                title="Bulk Attendance"
              >
                <FontAwesomeIcon icon={faUsers} size="lg" />
              </button>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Employee Attendance Dashboard</h1>
              <p className="text-gray-600 mt-1 flex items-center flex-wrap gap-2 text-sm md:text-base">
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  {filteredData[0]?.date ? formatDate(filteredData[0].date) : formatDate(new Date())}
                </span>
                <button 
                  onClick={fetchAttendanceData}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSyncAlt} spin={loading} className="mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </p>
            </div>
          </div>
          
          {/* Export Buttons - Hidden on mobile (shown in mobile menu) */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-md hover:from-blue-600 hover:to-cyan-600 transition-all text-sm md:text-base"
              disabled={loading}
              title="Export to CSV"
            >
              <FontAwesomeIcon icon={faFileCsv} className="mr-2" />
              CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md hover:from-blue-700 hover:to-cyan-700 transition-all text-sm md:text-base"
              disabled={loading}
              title="Export to PDF"
            >
              <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
              PDF
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 md:mb-6 bg-red-50 border-l-4 border-red-500 p-3 md:p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2 md:p-4 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 md:p-3 rounded-full bg-blue-100 text-blue-600 mr-2 md:mr-4">
                <FontAwesomeIcon icon={faUserCheck} className="text-sm md:text-lg" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Present</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  {loading ? '--' : summary.present}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2 md:p-4 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 md:p-3 rounded-full bg-red-100 text-red-600 mr-2 md:mr-4">
                <FontAwesomeIcon icon={faUserTimes} className="text-sm md:text-lg" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Absent</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  {loading ? '--' : summary.absent}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2 md:p-4 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 md:p-3 rounded-full bg-yellow-100 text-yellow-600 mr-2 md:mr-4">
                <FontAwesomeIcon icon={faUserClock} className="text-sm md:text-lg" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Half Day</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  {loading ? '--' : summary.halfDay}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2 md:p-4 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 md:p-3 rounded-full bg-blue-100 text-blue-600 mr-2 md:mr-4">
                <FontAwesomeIcon icon={faUserCheck} className="text-sm md:text-lg" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  {loading ? '--' : summary.total}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-4 md:mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 md:p-4 rounded-lg border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-blue-400 text-sm md:text-base" />
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, department or position..."
                className="pl-10 pr-4 py-2 w-full border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-blue-400 text-sm md:text-base" />
              <select
                className="border border-blue-200 rounded-md px-2 md:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Chart and Table */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Pie Chart */}
          <div className="w-full lg:w-1/3 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 md:p-4 rounded-lg border border-blue-100">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Attendance Distribution</h2>
            {loading ? (
              <ChartSkeleton />
            ) : filteredData.length === 0 ? (
              <div className="flex justify-center items-center h-48 md:h-64 text-gray-500 text-sm md:text-base">
                No data available for chart
              </div>
            ) : (
              <div ref={chartRef} style={{ width: '100%', height: '250px', minHeight: '250px' }} />
            )}
          </div>
          
          {/* Attendance Table */}
          <div className="w-full lg:w-2/3 overflow-x-auto">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Today's Attendance</h2>
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 md:p-4 rounded-md text-sm md:text-base">
                Error loading data: {error}
              </div>
            ) : filteredData.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 md:p-4 rounded-md text-sm md:text-base">
                No attendance records found matching your filters.
              </div>
            ) : (
              <div className="bg-white border border-blue-100 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-blue-800 uppercase tracking-wider">ID</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-blue-800 uppercase tracking-wider">Employee</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-blue-800 uppercase tracking-wider">Status</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-blue-800 uppercase tracking-wider">Last Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {filteredData.map((employee) => {
                      const statusDisplay = employee.status === 'half-day' 
                        ? 'Half Day' 
                        : employee.status.charAt(0).toUpperCase() + employee.status.slice(1);
                      
                      return (
                        <tr key={`${employee.employeeId}-${employee.status}`} className="hover:bg-blue-50">
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                            {employee.employeeId}
                          </td>
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs md:text-sm font-medium text-gray-900">
                                {employee.employeeName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {employee.department} • {employee.position}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              employee.status === 'present' 
                                ? 'bg-blue-100 text-blue-800'
                                : employee.status === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {statusDisplay}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                            {formatTime(employee.lastCheckIn)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceDashboard;