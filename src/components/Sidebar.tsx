import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useRestrictedNavigation from "../hooks/useRestrictedNavigation";
import { useUIPermissionContext } from "../contexts/UIPermissionContext";
import api, { getNotifications } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import {
  Bell,
  LogOut,
  Settings,
  Briefcase,
  FileText,
  Upload,
  ChevronDown,
  BarChart,
  Home,
  MapPin,
  Calendar,
  Leaf,
  CheckSquare,
  Menu,
  X,
  Palmtree,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

// User settings modal component
function UserSettingsModal({
  open,
  onClose,
  username,
  email,
  onSave,
  onChangePassword,
  onToggleDarkMode,
  darkMode,
}) {
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
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                darkMode ? "bg-primary" : "bg-gray-300"
              }`}
              onClick={onToggleDarkMode}
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

// Notifications modal component
function NotificationsModal({ open, onClose, notifications, onMarkAsRead }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No notifications
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.is_read
                      ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  {notification.report_url && (
                    <a
                      href={notification.report_url}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400 mt-2 inline-block"
                    >
                      View details →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to get user initials
function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Define permissions outside component to prevent recreating on every render
const SIDEBAR_PERMISSIONS = [
  'dashboard.module.root',
  'sites.module.root', 
  'bio.module.root',
  'analysis.module.root',  // Fixed: was 'reports.analysis.view'
  'jobs.module.root',
  'reports.module.root',
  'imports.module.root',
  'holidays.module.root',
  'holidays.entitlements.approve',
  'holidays.policies.manage',
  'settings.module.root'
];

const Sidebar = () => {
  const { navigationItems, loading: navLoading } = useRestrictedNavigation();
  // Use the context directly to avoid re-fetching on navigation
  const { permissions, isLoaded } = useUIPermissionContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Create a stable permissions object
  const uiPermissions = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (isLoaded) {
      SIDEBAR_PERMISSIONS.forEach(perm => {
        result[perm] = permissions[perm] || false;
      });
    }
    return result;
  }, [permissions, isLoaded]);

  // State from dashboard header
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { darkMode, toggleDarkMode } = useTheme();

  // Track which submenus are expanded
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    jobs: false,
    reports: false,
    imports: false,
    holidays: false,
  });

  // Function to toggle a submenu
  const toggleSubmenu = (menu: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  // User info
  const username = localStorage.getItem("username") || "User";
  const email = localStorage.getItem("email") || "";

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Dark mode is now handled by ThemeContext

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  // Handle mark notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      // TODO: Add API call to mark notification as read
      // For now, just update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Get icon component for a navigation item
  const getNavIcon = (icon) => {
    switch (icon) {
      case "dashboard":
        return <Home className="mr-2 h-5 w-5" />;
      case "location":
        return <MapPin className="mr-2 h-5 w-5" />;
      case "job":
        return <Briefcase className="mr-2 h-5 w-5" />;
      case "check":
        return <CheckSquare className="mr-2 h-5 w-5" />;
      case "calendar":
        return <Calendar className="mr-2 h-5 w-5" />;
      case "report":
        return <FileText className="mr-2 h-5 w-5" />;
      case "settings":
        return <Settings className="mr-2 h-5 w-5" />;
      case "energy":
        return <Leaf className="mr-2 h-5 w-5" />;
      case "chart":
        return <BarChart className="mr-2 h-5 w-5" />;
      default:
        return null;
    }
  };

  // Only show loading state on initial load
  if (navLoading || !isLoaded) {
    return (
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 hidden md:block h-screen">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-8"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 bg-gray-100 dark:bg-gray-700 rounded mb-2 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  // Create navigation items based on restricted navigation
  const renderNavigationItems = () => {
    // Build a combined navigation based on both sources
    return (
      <ul className="space-y-2">
        {/* Dashboard */}
        {(navigationItems?.some((item) => item.path === "/dashboard") || 
          uiPermissions['dashboard.module.root']) && (
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/dashboard"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Home className="mr-2 h-5 w-5" />
              Dashboard
            </Link>
          </li>
        )}

        {/* Sites */}
        {uiPermissions['sites.module.root'] !== false && (
          <li>
            <Link
              to="/sites"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/sites"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Sites
            </Link>
          </li>
        )}

        {/* Bio-mass */}
        {(navigationItems?.some((item) => item.path === "/bio-mass") ||
        uiPermissions['bio.module.root']) && (
          <li>
            <Link
              to="/bio-mass"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/bio-mass"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Leaf className="mr-2 h-5 w-5" />
              Bio-mass
            </Link>
          </li>
        )}

        {/* Analysis */}
        {(navigationItems?.some((item) => item.path === "/analysis") ||
        uiPermissions['analysis.module.root']) && (
          <li>
            <Link
              to="/analysis"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/analysis"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart className="mr-2 h-5 w-5" />
              Analysis
            </Link>
          </li>
        )}

        {/* Job Management */}
        {uiPermissions['jobs.module.root'] && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("jobs")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/job")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Job Management
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedMenus.jobs ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMenus.jobs && (
                <div className="ml-9 space-y-1">
                  <Link
                    to="/jobs"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/jobs"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Job List
                  </Link>
                  <Link
                    to="/jobs/new"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/jobs/new"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Create Job
                  </Link>
                  <Link
                    to="/completed-jobs"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/completed-jobs"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Completed Jobs
                  </Link>
                  <Link
                    to="/calendar"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/calendar"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Calendar
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Reports */}
        {uiPermissions['reports.module.root'] && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("reports")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/reports")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Reports
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedMenus.reports ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMenus.reports && (
                <div className="ml-9 space-y-1">
                  <Link
                    to="/reports/builder"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/builder"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Report Builder
                  </Link>
                  <Link
                    to="/reports/reading"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/reading"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Reading Report
                  </Link>
                  <Link
                    to="/reports/rdg"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/rdg"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    RDG Report
                  </Link>
                  <Link
                    to="/reports/fco"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/fco"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    FCO Availability Report
                  </Link>
                  <Link
                    to="/reports/job-dashboard"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/job-dashboard"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Job Report
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Imports */}
        {uiPermissions['imports.module.root'] && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("imports")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/imports")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Imports
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedMenus.imports ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMenus.imports && (
                <div className="ml-9 space-y-1">
                  <Link
                    to="/imports/readings"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/imports/readings"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Import Readings
                  </Link>
                  <Link
                    to="/imports/sites"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/imports/sites"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Import Sites
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Holiday Management */}
        {uiPermissions['holidays.module.root'] && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("holidays")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/holidays")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Palmtree className="mr-2 h-5 w-5" />
                  Holidays
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedMenus.holidays ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMenus.holidays && (
                <div className="ml-9 space-y-1">
                  <Link
                    to="/holidays/calendar"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/calendar"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Holiday Calendar
                  </Link>
                  <Link
                    to="/holidays/my-requests"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/my-requests"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    My Requests
                  </Link>
                  <Link
                    to="/holidays/entitlements"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/entitlements"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    My Entitlements
                  </Link>
                  <Link
                    to="/holidays/team"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/team"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Team View
                  </Link>
                  {uiPermissions['holidays.entitlements.approve'] && (
                    <Link
                      to="/holidays/approvals"
                      className={`block px-3 py-1 rounded-md text-sm ${
                        location.pathname === "/holidays/approvals"
                          ? "text-green-700 font-medium"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Approvals
                    </Link>
                  )}
                  {uiPermissions['holidays.policies.manage'] && (
                    <>
                      <Link
                        to="/holidays/policies"
                        className={`block px-3 py-1 rounded-md text-sm ${
                          location.pathname === "/holidays/policies"
                            ? "text-green-700 font-medium"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        HR Policies
                      </Link>
                      <Link
                        to="/holidays/public"
                        className={`block px-3 py-1 rounded-md text-sm ${
                          location.pathname === "/holidays/public"
                            ? "text-green-700 font-medium"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Public Holidays
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        )}

        {/* Show any additional items from navigationItems not explicitly handled above */}
        {navigationItems
          ?.filter(
            (item) =>
              ![
                "/dashboard",
                "/bio-mass",
                "/analysis",
                "/settings",
                "/sites",
                "/completed-jobs",  // Add this to exclude completed jobs from main menu
              ].includes(item.path) &&
              !item.path.startsWith("/job") &&
              !item.path.startsWith("/reports") &&
              !item.path.startsWith("/imports") &&
              !item.path.startsWith("/holidays")
          )
          .map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === item.path
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {getNavIcon(item.icon)}
                {item.name}
              </Link>
            </li>
          ))}

        {/* Settings */}
        {(navigationItems?.some((item) => item.path === "/settings") ||
        uiPermissions['settings.module.root']) && (
          <li>
            <Link
              to="/settings"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/settings"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Link>
          </li>
        )}
      </ul>
    );
  };

  const sidebarContent = (
    <>
      {/* App logo */}
      <div className="p-4 border-b flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Lux Portal</h1>
        </Link>
        <button
          className="block md:hidden text-gray-500 hover:text-gray-700"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* User profile section near the top */}
      <div className="p-4 border-b mb-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(username)}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium">Welcome, {username}</div>
            <div className="text-xs text-gray-500">{email}</div>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderNavigationItems()}
      </div>

      {/* Bottom actions section */}
      <div className="border-t p-4 space-y-2">
        {/* Notifications */}
        <button 
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md relative"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="mr-2 h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute left-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Settings */}
        <button
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          onClick={() => setUserSettingsOpen(true)}
        >
          <Settings className="mr-2 h-5 w-5" />
          User Settings
        </button>

        {/* Logout */}
        <button
          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  // Mobile menu button for small screens
  const mobileMenuButton = (
    <button
      className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center h-10 w-10 rounded-md bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    >
      {mobileMenuOpen ? <X /> : <Menu />}
    </button>
  );

  // Settings Modal
  const settingsModal = (
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
        try {
          await api.post("/users/change-password/", {
            current_password: currentPassword,
            new_password: newPassword,
          });
        } catch (error) {
          throw new Error(error.response?.data?.error || "Failed to change password");
        }
      }}
      onToggleDarkMode={toggleDarkMode}
      darkMode={darkMode}
    />
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile Menu Button */}
      {mobileMenuButton}

      {/* Mobile Sidebar (off-canvas) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-600 bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Sidebar panel */}
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 flex flex-col h-full">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {settingsModal}

      {/* Notifications Modal */}
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
};

export default React.memo(Sidebar);
