import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDFExporter = ({
  employee,
  selectedYear,
  selectedMonth,
  summary,
  attendanceData,
  COMPANY_NAME,
  formatNumber,
  formatDate,
  capitalizeFirstLetter
}) => {
  try {
    // Initialize PDF
    const doc = new jsPDF();
    
    // Basic document info
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
    const fileName = `Attendance_Summary_${employee?.name.replace(' ', '_') || 'All'}_${monthName}_${selectedYear}.pdf`;

    // Set document properties
    doc.setProperties({
      title: `${COMPANY_NAME} Attendance Summary`,
      subject: `Attendance for ${monthName} ${selectedYear}`,
      author: COMPANY_NAME
    });

    // Add header
    doc.setFontSize(16);
    doc.setTextColor(40, 53, 147);
    doc.setFont('helvetica', 'bold');
    doc.text(`${COMPANY_NAME} - Attendance Summary`, 105, 20, { align: 'center' });

    // Report info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${monthName} ${selectedYear}`, 15, 30);
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 15, 35);

    // Employee info (if available)
    if (employee) {
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(15, 45, 180, 20, 'FD');
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Information:', 20, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`${employee.name} (ID: ${employee.id})`, 60, 55);
    }

    // Summary section
    const summaryStartY = employee ? 75 : 45;
    const summaryBoxes = [
      { label: 'Present Days', value: summary.present, x: 15, y: summaryStartY },
      { label: 'Half Days', value: summary.halfday, x: 70, y: summaryStartY },
      { label: 'Absent Days', value: summary.absent, x: 125, y: summaryStartY },
      { 
        label: 'Monthly Salary', 
        value: employee ? `₹${formatNumber(summary.monthlySalary)}` : 'N/A', 
        x: 15, 
        y: summaryStartY + 30 
      },
      { 
        label: 'Salary for Half Days', 
        value: `₹${formatNumber(summary.halfdaySalary)}`, 
        x: 70, 
        y: summaryStartY + 30 
      },
      { 
        label: 'Total Salary', 
        value: `₹${formatNumber(summary.totalSalary)}`, 
        x: 125, 
        y: summaryStartY + 30 
      }
    ];

    summaryBoxes.forEach(box => {
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 255, 255);
      doc.rect(box.x, box.y, 50, 20, 'FD');
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(8);
      doc.text(box.label, box.x + 25, box.y + 8, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(box.value.toString(), box.x + 25, box.y + 15, { align: 'center' });
    });

    // Attendance table using autoTable
    const tableHeaders = ['Date', 'Status', 'Salary (₹)'];
    if (!employee) tableHeaders.unshift('Employee');

    const tableBody = attendanceData.map(record => {
      const row = [
        formatDate(record.date),
        capitalizeFirstLetter(record.status),
        formatNumber(record.salary)
      ];
      if (!employee) row.unshift(record.employeeName);
      return row;
    });

    autoTable(doc, {
      startY: employee ? 140 : 110,
      head: [tableHeaders],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [40, 53, 147],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: !employee ? 40 : 'auto' },
        [tableHeaders.length - 1]: { halign: 'right' }
      }
    });

    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 15,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }

    // Save the PDF
    doc.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again or contact support.');
  }
};

export default PDFExporter;