import { useState, useEffect } from "react";

const Navbar = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <img className="h-8 w-auto" src="/logo.png" alt="Company logo" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Attendance Summary</span>
          </div>
          <div className="text-gray-600">{currentDateTime}</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
