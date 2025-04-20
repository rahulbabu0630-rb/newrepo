import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from "./pages/Home";
import AboutUs from "./components/AboutUs";
import Gallery from "./components/Gallery";
import AttendancePage from "./components/AttendanceManagement/AttendancePage";
import MarkAttendance from "./components/AttendanceManagement/MarkAttendance";
import AttendanceSummary from "./components/AttendanceSummary/AttendanceSummary";
import EmployeeDirectory from "./components/EmployeeManagement/EmployeeDirectory";
import AddEmployee from "./components/EmployeeManagement/AddEmployee";
import EmployeeProfile from "./components/EmployeeManagement/EmployeeProfile";
import BulkAttendancePage from "./components/BulkManagement/BulkAttendancePage";
import ContactUs from "./components/ContactUs";
import EmployeeAttendanceDashboard from "./components/EmployeeDashboard/EmployeeAttendanceDashboard";

const AppContent = () => {
  const location = useLocation();
  
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/mark-attendance/:id" element={<MarkAttendance />} />
        <Route path="/attendance-summary" element={<AttendanceSummary />} />
        <Route path="/attendance-summary/:employeeId" element={<AttendanceSummary />} />
        <Route path="/employee-management" element={<EmployeeDirectory />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/employee-profile/:name" element={<EmployeeProfile />} />
        <Route path="/bulk-attendance" element={<BulkAttendancePage />} />
        <Route path="/employee-dashboard" element={<EmployeeAttendanceDashboard />} />
      </Routes>
      {/* ToastContainer should be here, at the root level */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;