import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AttendanceCharts = ({ summary, attendanceData, selectedEmployee }) => {
  const pieData = [
    { name: 'Present', value: summary.present, color: '#4CAF50' },
    { name: 'Half Day', value: summary.halfday, color: '#FFC107' },
    { name: 'Absent', value: summary.absent, color: '#F44336' }
  ];

  const barData = attendanceData
    .map(record => ({
      date: parseInt(record.date.split('T')[0].split('-')[2]),
      present: record.status === 'present' ? 1 : 0,
      halfday: record.status === 'halfday' ? 1 : 0,
      absent: record.status === 'absent' ? 1 : 0,
      employeeName: record.employeeName
    }))
    .sort((a, b) => a.date - b.date)
    .map(item => ({ ...item, date: item.date.toString() }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Attendance Distribution</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  value, 
                  name,
                  `${(props.payload.percent * 100).toFixed(1)}%`
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Daily Attendance</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [
                  value, 
                  name,
                  props.payload.employeeName ? `Employee: ${props.payload.employeeName}` : ''
                ]}
              />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#4CAF50" name="Present" />
              <Bar dataKey="halfday" stackId="a" fill="#FFC107" name="Half Day" />
              <Bar dataKey="absent" stackId="a" fill="#F44336" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCharts;