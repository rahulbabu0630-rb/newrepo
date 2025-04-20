import React, { useState } from "react";

const AttendanceFilterForm = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Filtering Attendance for:", { employeeId, year, month });
    // Logic to fetch attendance data can be added here
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Employee ID:</label>
      <input
        type="text"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        required
      />

      <label>Year:</label>
      <select value={year} onChange={(e) => setYear(e.target.value)}>
        {[2023, 2024, 2025].map((yr) => (
          <option key={yr} value={yr}>
            {yr}
          </option>
        ))}
      </select>

      <label>Month:</label>
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        {[
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ].map((m, index) => (
          <option key={index + 1} value={index + 1}>
            {m}
          </option>
        ))}
      </select>

      <button type="submit">View Summary</button>
    </form>
  );
};

export default AttendanceFilterForm;
