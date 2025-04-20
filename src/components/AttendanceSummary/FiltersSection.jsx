import React from 'react';

const FiltersSection = ({
  employees,
  selectedEmployee,
  selectedYear,
  selectedMonth,
  onEmployeeChange,
  onYearChange,
  onMonthChange,
  loading,
  attendanceData,
  onExport
}) => {
  const yearRange = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const monthRange = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedEmployee}
            onChange={(e) => onEmployeeChange(e.target.value)}
            disabled={loading.employees}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} (ID: {emp.id})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            disabled={loading.employees || loading.salary || loading.attendance}
          >
            {yearRange.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            disabled={loading.employees || loading.salary || loading.attendance}
          >
            {monthRange.map(month => (
              <option key={month.value} value={month.value}>
                {month.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={onExport}
            disabled={attendanceData.length === 0 || loading.attendance}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersSection;