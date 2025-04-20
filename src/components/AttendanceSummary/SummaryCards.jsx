import React from 'react';

const SummaryCards = ({ summary, selectedEmployee, formatNumber }) => {
  const cards = [
    {
      title: 'Present Days',
      value: summary.present,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      textColor: 'text-green-800',
      valueColor: 'text-green-600'
    },
    {
      title: 'Half Days',
      value: summary.halfday,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-100',
      textColor: 'text-yellow-800',
      valueColor: 'text-yellow-600'
    },
    {
      title: 'Absent Days',
      value: summary.absent,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      textColor: 'text-red-800',
      valueColor: 'text-red-600'
    },
    {
      title: 'Total Salary',
      value: selectedEmployee ? `₹${formatNumber(summary.totalSalary)}` : 'N/A',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      textColor: 'text-blue-800',
      valueColor: 'text-blue-600'
    },
    {
      title: 'Monthly Salary',
      value: selectedEmployee ? `₹${formatNumber(summary.monthlySalary)}` : 'N/A',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      textColor: 'text-purple-800',
      valueColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div 
          key={index}
          className={`${card.bgColor} p-4 rounded-lg border ${card.borderColor} transition-all hover:shadow-md`}
        >
          <h3 className={`text-sm font-medium ${card.textColor}`}>{card.title}</h3>
          <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
