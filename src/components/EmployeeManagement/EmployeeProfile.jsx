import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const EmployeeProfile = () => {
  const DEFAULT_PROFILE_ICON = import.meta.env.VITE_DEFAULT_PROFILE_ICON;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const MAX_PHONE_LENGTH = 15;

  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({
    employee: location.state?.employee || null,
    loading: !location.state?.employee,
    error: null,
    showMenu: false,
    isEditing: false,
    editForm: { 
      name: location.state?.employee?.name || '', 
      number: location.state?.employee?.number || '', 
      role: location.state?.employee?.role || '', 
      salary: location.state?.employee?.salary || '',
      profileImage: location.state?.employee?.profileImage || DEFAULT_PROFILE_ICON 
    },
    showToast: false,
    toastMessage: '',
    toastType: 'success'
  });

  // Destructure state
  const { employee, loading, error, showMenu, isEditing, editForm, showToast, toastMessage, toastType } = state;

  // Helper functions
  const validatePhoneNumber = (number) => {
    if (!number || number.trim() === '') return true;
    return /^[+\-0-9]{1,15}$/.test(number);
  };

  const formatPhoneNumber = (number) => {
    if (!number || number.trim() === '') return 'Not provided';
    if (number.length === 10) {
      return `${number.substring(0, 5)} ${number.substring(5)}`;
    }
    return number;
  };

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined || salary === '') return 'N/A';
    return `₹${parseFloat(salary).toLocaleString('en-IN')}`;
  };

  // Toast notification system
  const showToastMessage = (message, type = 'success') => {
    setState(prev => ({ ...prev, showToast: true, toastMessage: message, toastType: type }));
    setTimeout(() => setState(prev => ({ ...prev, showToast: false })), 3000);
  };

  // Fetch employee if not passed via state
  const fetchEmployee = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await axios.get(`${API_BASE_URL}/employees/get`, {
        params: { name },
        timeout: 5000
      });
      
      if (response.data?.length > 0) {
        const firstEmployee = {
          ...response.data[0],
          profileImage: response.data[0].profileImage || DEFAULT_PROFILE_ICON,
          number: response.data[0].number || '',
          salary: response.data[0].salary || 0
        };
        
        setState(prev => ({
          ...prev,
          employee: firstEmployee,
          editForm: {
            name: firstEmployee.name,
            number: firstEmployee.number || '',
            role: firstEmployee.role,
            salary: firstEmployee.salary || 0,
            profileImage: firstEmployee.profileImage
          },
          loading: false
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: `No employee found with name "${name}"`,
          loading: false 
        }));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to load employee data';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      
      showToastMessage(errorMessage, 'error');
    }
  };

  // Update employee handler
  const updateEmployee = async () => {
    if (!validatePhoneNumber(editForm.number)) {
      showToastMessage("Please enter a valid phone number (max 15 digits) or leave empty", 'error');
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const payload = {
        ...editForm,
        number: editForm.number || null,
        salary: parseFloat(editForm.salary) || 0
      };

      const response = await axios.put(
        `${API_BASE_URL}/employees/update/${employee.id}`,
        payload,
        { timeout: 5000 }
      );
      
      // Show success message and navigate back
      navigate('/employee-management', {
        state: { 
          toast: {
            message: "Employee updated successfully!",
            type: "success"
          }
        }
      });

    } catch (error) {
      let errorMessage = 'Failed to update employee';
      if (error.response?.data?.message?.includes('Data too long for column')) {
        errorMessage = 'Phone number is too long. Maximum 15 digits allowed.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setState(prev => ({ ...prev, loading: false }));
      showToastMessage(errorMessage, 'error');
    }
  };

  const deleteEmployee = async () => {
    if (window.confirm(`Permanently delete ${employee.name}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/employees/delete/${employee.id}`);
        navigate('/employee-management', { 
          state: { toast: { message: `${employee.name} deleted successfully`, type: 'success' } } 
        });
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete employee';
        showToastMessage(errorMessage, 'error');
      }
    }
  };

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      editForm: {
        ...prev.editForm,
        [name]: value
      }
    }));
  };

  const toggleEdit = () => {
    setState(prev => ({ 
      ...prev, 
      isEditing: !prev.isEditing,
      showMenu: false,
      editForm: {
        name: prev.employee.name,
        number: prev.employee.number || '',
        role: prev.employee.role,
        salary: prev.employee.salary || 0,
        profileImage: prev.employee.profileImage || DEFAULT_PROFILE_ICON
      }
    }));
  };

  const toggleMenu = () => {
    setState(prev => ({ ...prev, showMenu: !prev.showMenu }));
  };

  // Effects
  useEffect(() => {
    if (!employee) {
      fetchEmployee();
    }
  }, [name]);

  // Render components
  const renderLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-white text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p>Loading employee data...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white/90 p-6 rounded-lg max-w-md text-center">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Error</h3>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => navigate('/employee-management')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Back to Employee List
        </button>
      </div>
    </div>
  );

  const renderNotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white/90 p-6 rounded-lg max-w-md text-center">
        <img src={DEFAULT_PROFILE_ICON} alt="Default profile" className="w-20 h-20 mx-auto mb-3"/>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Employee Not Found</h3>
        <p className="text-gray-600">No employee matching "{name}" was found</p>
        <button 
          onClick={() => navigate('/employee-management')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Back to Employee List
        </button>
      </div>
    </div>
  );

  // Main render
  if (loading) return renderLoading();
  if (error) return renderError();
  if (!employee) return renderNotFound();

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 ${
          toastType === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-[slideIn_0.3s_ease-out_forwards]`}>
          <div className={`mr-2 ${
            toastType === 'error' ? 'text-red-100' : 'text-green-100'
          }`}>
            {toastType === 'error' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Profile Icon */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center">
            <img 
              src={employee.profileImage || DEFAULT_PROFILE_ICON} 
              alt="Profile" 
              className="w-12 h-12 mr-4 rounded-full border-4 border-white shadow-md transition-transform duration-300 hover:rotate-12"
              onError={(e) => {
                e.target.src = DEFAULT_PROFILE_ICON;
              }}
            />
            <h1 className="text-4xl font-bold text-white">Employee Profile</h1>
          </div>
          <p className="mt-2 text-white/90 font-medium">Detailed staff information</p>
        </header>
        
        <main>
          <div className="max-w-2xl mx-auto">
            {/* Employee Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Profile Image */}
                  <div className="relative group">
                    <img
                      src={employee.profileImage || DEFAULT_PROFILE_ICON}
                      alt="Employee"
                      className="w-24 h-24 rounded-full border-4 border-indigo-100 shadow-md object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = DEFAULT_PROFILE_ICON;
                      }}
                    />
                    <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      ID: {employee.id}
                    </span>
                  </div>
                  
                  {/* Employee Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      {/* Name and Role */}
                      {isEditing ? (
                        <div className="space-y-3 w-full">
                          <input
                            name="name"
                            value={editForm.name || ''}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="Employee Name"
                            required
                          />
                          <input
                            name="role"
                            value={editForm.role || ''}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="Role"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{employee.name}</h2>
                          <p className="text-indigo-600 font-medium">{employee.role}</p>
                        </div>
                      )}
                      
                      {/* Three-dot Menu */}
                      <div className="relative">
                        <button
                          onClick={toggleMenu}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
                          aria-label="Actions menu"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {showMenu && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-[fadeIn_0.2s_ease-out_forwards]">
                            <div className="py-1">
                              <button 
                                onClick={toggleEdit}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                              >
                                <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                              </button>
                              <button 
                                onClick={deleteEmployee}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
                              >
                                <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {isEditing ? (
                        <>
                          <div className="bg-gray-50 p-4 rounded-lg transition hover:bg-gray-100">
                            <label className="block font-medium text-gray-700 mb-2">Salary</label>
                            <input
                              type="number"
                              name="salary"
                              value={editForm.salary || ''}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                              required
                            />
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg transition hover:bg-gray-100">
                            <label className="block font-medium text-gray-700 mb-2">Contact</label>
                            <input
                              type="text"
                              name="number"
                              value={editForm.number || ''}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                              maxLength={MAX_PHONE_LENGTH}
                              pattern="[+]?\d*"
                              title="Phone number should contain only digits and optional + at start"
                              placeholder="Optional"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Max {MAX_PHONE_LENGTH} digits, numbers only (optional)
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg transition hover:bg-gray-100 col-span-2">
                            <label className="block font-medium text-gray-700 mb-2">Profile Image URL</label>
                            <input
                              type="url"
                              name="profileImage"
                              value={editForm.profileImage || ''}
                              onChange={handleInputChange}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                              placeholder="Enter image URL"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-50 p-4 rounded-lg transition hover:bg-gray-100">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h4 className="font-medium text-gray-700">Salary</h4>
                            </div>
                            <p className="text-lg font-semibold text-gray-800 pl-8">
                              {formatSalary(employee.salary)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg transition hover:bg-gray-100">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <h4 className="font-medium text-gray-700">Contact</h4>
                            </div>
                            <p className="text-lg font-semibold text-gray-800 pl-8">
                              {formatPhoneNumber(employee.number)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => navigate('/employee-management')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                >
                  Back to List
                </button>
                {isEditing ? (
                  <button
                    onClick={updateEmployee}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={toggleEdit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes slideIn {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeProfile;