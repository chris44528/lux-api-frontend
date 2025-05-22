"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Bell,
  LogOut,
  Settings,
  Briefcase,
  FileText,
  Upload,
  ChevronDown,
  BarChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useMenuPermissions from "../../hooks/use-menu-permissions";
import { getNotifications } from "../../services/api";

type UserSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  email: string;
  onSave: (form: { username: string; email: string }) => Promise<void>;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  onToggleDarkMode: (checked: boolean) => void;
  darkMode: boolean;
};

function UserSettingsModal({
  open,
  onClose,
  username,
  email,
  onSave,
  onChangePassword,
  onToggleDarkMode,
  darkMode,
}: UserSettingsModalProps) {
  const [form, setForm] = useState({ username, email });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setForm({ username, email });
  }, [username, email]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          User Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Name
            </label>
            <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-100"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-100"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          {saveError && (
            <div className="text-red-500 text-sm mt-1">{saveError}</div>
          )}
          {saveSuccess && (
            <div className="text-green-600 text-sm mt-1">{saveSuccess}</div>
          )}
          <button
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 dark:bg-blue-700 dark:hover:bg-blue-800"
            onClick={async () => {
              setSaveError("");
              setSaveSuccess("");
              try {
                await onSave({ username: form.username, email: form.email });
                setSaveSuccess("Changes saved successfully");
              } catch (e) {
                const err = e as Error;
                setSaveError(err.message || "Failed to save changes");
              }
            }}
          >
            Save
          </button>
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Change Password
            </h3>
            <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-100"
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              className="w-full mt-2 p-2 border rounded dark:bg-gray-800 dark:text-gray-100"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              className="w-full mt-2 p-2 border rounded dark:bg-gray-800 dark:text-gray-100"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && (
              <div className="text-red-500 text-sm mt-1">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-green-600 text-sm mt-1">
                {passwordSuccess}
              </div>
            )}
            <button
              className="w-full mt-2 bg-primary text-white py-2 rounded hover:bg-primary/90"
              onClick={async () => {
                setPasswordError("");
                setPasswordSuccess("");
                if (newPassword !== confirmPassword) {
                  setPasswordError("Passwords do not match");
                  return;
                }
                try {
                  await onChangePassword(currentPassword, newPassword);
                  setPasswordSuccess("Password changed successfully");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                } catch (e) {
                  const err = e as Error;
                  setPasswordError(err.message || "Failed to change password");
                }
              }}
            >
              Change Password
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-gray-700 dark:text-gray-200">Dark Mode</span>
            {/* Toggle Switch */}
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                darkMode ? "bg-primary" : "bg-gray-300"
              }`}
              onClick={() => onToggleDarkMode(!darkMode)}
              aria-pressed={darkMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function DashboardHeader() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const [jobsDropdownOpen, setJobsDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [importsDropdownOpen, setImportsDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { permissions, loading } = useMenuPermissions();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const email = localStorage.getItem("email") || "";

  // Debug log to check what's in the permissions object
  console.log("Menu permissions from hook:", permissions);
  console.log("Analysis permission value:", permissions.analysis);
  console.log("Permission loading state:", loading);

  // Add additional debugging to check the type of each permission value
  Object.entries(permissions).forEach(([key, value]) => {
    console.log(
      `Permission ${key} type: ${typeof value}, value: ${value}, stringified: ${JSON.stringify(
        value
      )}`
    );
  });

  // Check if all permissions are set to false except for dashboard and bio-mass
  const visibleCount = Object.values(permissions).filter(Boolean).length;
  const expectedCount = Object.keys(permissions).length;

  console.log(
    `Total permissions: ${expectedCount}, Visible permissions: ${visibleCount}`
  );

  if (visibleCount <= 2 && !loading) {
    // If we have very few permissions, it might be a permissions issue
    console.warn(
      "Warning: Very few menu items are visible. This may indicate a permissions issue."
    );
  }

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setUnreadCount(data.filter((n) => !n.is_read).length);
      } catch {
        // Optionally handle error
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleJobsDropdown = () => {
    setJobsDropdownOpen(!jobsDropdownOpen);
    if (reportsDropdownOpen) setReportsDropdownOpen(false);
    if (importsDropdownOpen) setImportsDropdownOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  const toggleReportsDropdown = () => {
    setReportsDropdownOpen(!reportsDropdownOpen);
    if (jobsDropdownOpen) setJobsDropdownOpen(false);
    if (importsDropdownOpen) setImportsDropdownOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  const toggleImportsDropdown = () => {
    setImportsDropdownOpen(!importsDropdownOpen);
    if (jobsDropdownOpen) setJobsDropdownOpen(false);
    if (reportsDropdownOpen) setReportsDropdownOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (jobsDropdownOpen) setJobsDropdownOpen(false);
    if (reportsDropdownOpen) setReportsDropdownOpen(false);
    if (importsDropdownOpen) setImportsDropdownOpen(false);
  };

  const handleLogout = () => {
    // In a real app, you would sign out the user
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img className="h-8 w-auto" src="/logo.png" alt="Lux Solar" />
            <span className="text-xl font-bold">Lux Solar</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            {permissions.dashboard && (
              <Link
                to="/dashboard"
                className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Dashboard
              </Link>
            )}

            {/* Bio-mass Link */}
            {permissions["bio-mass"] && (
              <Link
                to="/bio-mass"
                className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Bio-mass
              </Link>
            )}

            {/* Analysis Link */}
            {Boolean(permissions.analysis) && (
              <Link
                to="/analysis"
                className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 flex items-center"
              >
                <BarChart className="mr-1 h-4 w-4" />
                Analysis
              </Link>
            )}

            {/* Jobs Dropdown */}
            {Boolean(permissions["job-management"]) && (
              <div className="relative">
                <button
                  onClick={toggleJobsDropdown}
                  className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 flex items-center"
                >
                  <Briefcase className="mr-1 h-4 w-4" />
                  Job Management <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                {jobsDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      <Link
                        to="/jobs"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        Job List
                      </Link>
                      {/* Placeholder for Engineer Dashboard */}
                      <div className="flex items-center px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        <span className="mr-2 h-4 w-4 inline-block bg-gray-200 rounded-full"></span>
                        Engineer Dashboard (Coming Soon)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reports Dropdown */}
            {Boolean(permissions.reports) && (
              <div className="relative">
                <button
                  onClick={toggleReportsDropdown}
                  className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 flex items-center"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Reports <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                {reportsDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      <Link
                        to="/reports/builder"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Report Builder
                      </Link>
                      <Link
                        to="/reports/reading"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Reading Report
                      </Link>
                      <Link
                        to="/reports/site-readings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Site Readings
                      </Link>
                      <Link
                        to="/reports/performance"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Performance Reports
                      </Link>
                      <Link
                        to="/reports/rdg"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        RDG Report
                      </Link>
                      <Link
                        to="/reports/fco"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        FCO Availability Report
                      </Link>
                      <Link
                        to="/reports/job-dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Job Report Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Imports Dropdown */}
            {Boolean(permissions.imports) && (
              <div className="relative">
                <button
                  onClick={toggleImportsDropdown}
                  className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 flex items-center"
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Imports <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                {importsDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      <Link
                        to="/imports/readings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Import Readings
                      </Link>
                      <Link
                        to="/imports/sites"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Import Sites
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings Link */}
            {Boolean(permissions.settings) && (
              <Link
                to="/settings"
                className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 flex items-center"
              >
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 dark:text-gray-200 hidden md:inline-block">
            Welcome {username}
          </span>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="relative h-8 w-8 rounded-full inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Avatar className="h-8 w-8">
                {/* If you have a user image URL, use it here. Otherwise, just show initials */}
                {/* Example: const userImage = localStorage.getItem('user_image'); */}
                {/* {userImage ? <AvatarImage src={userImage} alt="User" /> : null} */}
                <AvatarFallback>{getInitials(username)}</AvatarFallback>
              </Avatar>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-md shadow-lg z-10 border dark:border-gray-800">
                <div className="p-2">
                  <div className="px-4 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                        {username}
                      </p>
                      <p className="text-xs leading-none text-gray-500 dark:text-gray-300">
                        {email}
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
                  <button
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => {
                      setUserSettingsOpen(true);
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>User Settings</span>
                  </button>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 rounded-md"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Settings Modal */}
          <UserSettingsModal
            open={userSettingsOpen}
            onClose={() => setUserSettingsOpen(false)}
            username={username}
            email={email}
            onSave={async (form) => {
              // TODO: Implement save logic (call API to update user info)
              setUserSettingsOpen(false);
            }}
            onChangePassword={async (currentPassword, newPassword) => {
              // Call backend change-password endpoint
              const token = localStorage.getItem("access_token");
              const res = await fetch("/api/v1/users/change-password/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                  current_password: currentPassword,
                  new_password: newPassword,
                }),
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to change password");
              }
            }}
            onToggleDarkMode={setDarkMode}
            darkMode={darkMode}
          />

          {/* Mobile menu button */}
          <button
            className="block md:hidden -mr-1 p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 inset-x-0 bg-white border-b shadow-lg z-20 md:hidden">
          <div className="p-2">
            {Boolean(permissions.dashboard) && (
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            {Boolean(permissions["bio-mass"]) && (
              <Link
                to="/bio-mass"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bio-mass
              </Link>
            )}

            {Boolean(permissions.analysis) && (
              <Link
                to="/analysis"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analysis
              </Link>
            )}

            {Boolean(permissions["job-management"]) && (
              <>
                <div className="px-4 py-2 text-sm font-medium text-gray-900">
                  Job Management
                </div>
                <Link
                  to="/jobs"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Job List
                </Link>
                <Link
                  to="/calendar"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Job Calendar
                </Link>
              </>
            )}

            {Boolean(permissions.reports) && (
              <>
                <div className="px-4 py-2 text-sm font-medium text-gray-900">
                  Reports
                </div>
                <Link
                  to="/reports/builder"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Report Builder
                </Link>
                <Link
                  to="/reports/reading"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reading Report
                </Link>
                <Link
                  to="/reports/site-readings"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Site Readings
                </Link>
                <Link
                  to="/reports/performance"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Performance Reports
                </Link>
                <Link
                  to="/reports/rdg"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  RDG Report
                </Link>
                <Link
                  to="/reports/fco"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FCO Availability Report
                </Link>
                <Link
                  to="/reports/job-dashboard"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Job Report Dashboard
                </Link>
              </>
            )}

            {Boolean(permissions.imports) && (
              <>
                <div className="px-4 py-2 text-sm font-medium text-gray-900">
                  Imports
                </div>
                <Link
                  to="/imports/readings"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Import Readings
                </Link>
                <Link
                  to="/imports/sites"
                  className="block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Import Sites
                </Link>
              </>
            )}

            {Boolean(permissions.settings) && (
              <Link
                to="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
