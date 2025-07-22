import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useRestrictedNavigation from "../hooks/useRestrictedNavigation";
import { useUIPermissionContext } from "../contexts/UIPermissionContext";
import api, { getNotifications, markNotificationAsRead } from "../services/api";
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
  Wrench,
  Route,
  ClipboardList,
  Users,
  AlertTriangle,
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
              Username
            </label>
            <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700"
              value={form.username}
              readOnly
              disabled
            />
          </div>
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
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
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
              className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
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
        </div>
      </div>
    </div>
  );
}

// Notifications modal component
function NotificationsModal({ open, onClose, notifications, onMarkAsRead }) {
  const navigate = useNavigate();
  
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
                    <Link
                      to={notification.report_url}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400 mt-2 inline-block"
                      onClick={(e) => {
                        // Log the URL for debugging
                        console.log('Modal navigating to:', notification.report_url);
                        
                        // Check if it's a valid internal route
                        const validRoutes = ['/reports/', '/jobs/', '/site/', '/holidays/'];
                        const isValidRoute = validRoutes.some(route => notification.report_url.startsWith(route));
                        
                        if (!isValidRoute) {
                          e.preventDefault();
                          console.error('Invalid report URL:', notification.report_url);
                          // Navigate to dashboard as fallback
                          navigate('/dashboard');
                        }
                        
                        onClose();
                      }}
                    >
                      View details →
                    </Link>
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
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPopupRef = useRef<HTMLDivElement>(null);

  // Track which submenus are expanded
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    jobs: false,
    reports: false,
    imports: false,
    holidays: false,
    engineer: false,
  });

  // Function to toggle a submenu - only allow one expanded at a time
  const toggleSubmenu = (menu: string) => {
    setExpandedMenus((prev) => {
      const isCurrentlyExpanded = prev[menu];
      // Collapse all menus
      const allCollapsed = Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false,
      }), {});
      
      // If the clicked menu wasn't expanded, expand it
      return isCurrentlyExpanded ? allCollapsed : {
        ...allCollapsed,
        [menu]: true,
      };
    });
  };

  // User info - get from stored user object
  const username = localStorage.getItem("username") || "User";
  const getUserEmail = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.email || "No email found";
      }
      return "No email found";
    } catch (error) {
      return "No email found";
    }
  };
  const email = getUserEmail();

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        const newUnreadCount = data.filter((n) => !n.is_read).length;
        
        // Use functional state update to get previous count
        setNotifications(prevNotifications => {
          const previousUnreadCount = prevNotifications.filter((n) => !n.is_read).length;
          
          // Check if there's a new notification
          if (newUnreadCount > previousUnreadCount && data.length > 0) {
            const unreadNotifications = data.filter((n) => !n.is_read);
            if (unreadNotifications.length > 0) {
              const latestNotif = unreadNotifications[0];
              console.log('Latest notification report_url:', latestNotif.report_url); // Debug log
              setLatestNotification(latestNotif);
              setShowNotificationPopup(true);
              // Auto-hide popup after 5 seconds
              setTimeout(() => setShowNotificationPopup(false), 5000);
            }
          }
          
          return data;
        });
        
        setUnreadCount(newUnreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s (1 minute)
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationPopupRef.current &&
        !notificationPopupRef.current.contains(event.target as Node) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setShowNotificationPopup(false);
      }
    };

    if (showNotificationPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationPopup]);

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
      // Call API to mark notification as read
      await markNotificationAsRead(notificationId);
      
      // Update local state
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
      case "warning":
        return <AlertTriangle className="mr-2 h-5 w-5" />;
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
          uiPermissions['dashboard.module.root'] === true) && (
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/dashboard"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Home className="mr-2 h-5 w-5" />
              Dashboard
            </Link>
          </li>
        )}

        {/* Sites */}
        {uiPermissions['sites.module.root'] === true && (
          <li>
            <Link
              to="/sites"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/sites"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Sites
            </Link>
          </li>
        )}

        {/* Transfers */}
        {uiPermissions['sites.module.root'] === true && (
          <li>
            <Link
              to="/transfers"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname.startsWith("/transfers")
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Home className="mr-2 h-5 w-5" />
              Home Owner Transfers
            </Link>
          </li>
        )}

        {/* Bio-mass */}
        {(navigationItems?.some((item) => item.path === "/bio-mass") ||
        uiPermissions['bio.module.root'] === true) && (
          <li>
            <Link
              to="/bio-mass"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/bio-mass"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Leaf className="mr-2 h-5 w-5" />
              Bio-mass
            </Link>
          </li>
        )}

        {/* Analysis */}
        {(navigationItems?.some((item) => item.path === "/analysis") ||
        uiPermissions['analysis.module.root'] === true) && (
          <li>
            <Link
              to="/analysis"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/analysis"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <BarChart className="mr-2 h-5 w-5" />
              Analysis
            </Link>
          </li>
        )}

        {/* Job Management */}
        {uiPermissions['jobs.module.root'] === true && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("jobs")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/job")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Job List
                  </Link>
                  <Link
                    to="/jobs/new"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/jobs/new"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Create Job
                  </Link>
                  <Link
                    to="/completed-jobs"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/completed-jobs"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Completed Jobs
                  </Link>
                  <Link
                    to="/calendar"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/calendar"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Calendar
                  </Link>
                  <Link
                    to="/postcards"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/postcards"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Post Cards
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Reports */}
        {uiPermissions['reports.module.root'] === true && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("reports")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/reports")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Report Builder
                  </Link>
                  <Link
                    to="/reports/reading"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/reading"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Reading Report
                  </Link>
                  <Link
                    to="/reports/rdg"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/rdg"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    RDG Report
                  </Link>
                  <Link
                    to="/reports/fco"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/fco"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    FCO Availability Report
                  </Link>
                  <Link
                    to="/reports/job-dashboard"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/job-dashboard"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Job Report
                  </Link>
                  <Link
                    to="/reports/legal"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/legal"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Legal Report
                  </Link>
                  <Link
                    to="/reports/temp-removals"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/reports/temp-removals"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Temp Removal Report
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Imports */}
        {uiPermissions['imports.module.root'] === true && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("imports")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/imports")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Import Readings
                  </Link>
                  <Link
                    to="/imports/sites"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/imports/sites"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Import Sites
                  </Link>
                  <Link
                    to="/imports/bulk-notes"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/imports/bulk-notes"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Bulk System Notes
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Engineer Management */}
        {uiPermissions['jobs.module.root'] === true && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("engineer")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/engineer")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center">
                  <Wrench className="mr-2 h-5 w-5" />
                  Engineer
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedMenus.engineer ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedMenus.engineer && (
                <div className="ml-9 space-y-1">
                  <Link
                    to="/engineer/forms/builder"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/engineer/forms/builder"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Form Builder
                  </Link>
                  <Link
                    to="/engineer/routes/builder"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/engineer/routes/builder"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Route Builder
                  </Link>
                  <Link
                    to="/engineer/job-allocation"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/engineer/job-allocation"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Job Allocation
                  </Link>
                  <Link
                    to="/engineer/location-tracker"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/engineer/location-tracker"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Location Tracker
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {/* Holiday Management */}
        {uiPermissions['holidays.module.root'] === true && (
          <li>
            <div className="space-y-1">
              <button
                onClick={() => toggleSubmenu("holidays")}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname.startsWith("/holidays")
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Holiday Calendar
                  </Link>
                  <Link
                    to="/holidays/my-requests"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/my-requests"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    My Requests
                  </Link>
                  <Link
                    to="/holidays/entitlements"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/entitlements"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    My Entitlements
                  </Link>
                  <Link
                    to="/holidays/team"
                    className={`block px-3 py-1 rounded-md text-sm ${
                      location.pathname === "/holidays/team"
                        ? "text-green-700 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    Team View
                  </Link>
                  {uiPermissions['holidays.entitlements.approve'] === true && (
                    <Link
                      to="/holidays/approvals"
                      className={`block px-3 py-1 rounded-md text-sm ${
                        location.pathname === "/holidays/approvals"
                          ? "text-green-700 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      Approvals
                    </Link>
                  )}
                  {uiPermissions['holidays.policies.manage'] === true && (
                    <>
                      <Link
                        to="/holidays/policies"
                        className={`block px-3 py-1 rounded-md text-sm ${
                          location.pathname === "/holidays/policies"
                            ? "text-green-700 font-medium"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                      >
                        HR Policies
                      </Link>
                      <Link
                        to="/holidays/public"
                        className={`block px-3 py-1 rounded-md text-sm ${
                          location.pathname === "/holidays/public"
                            ? "text-green-700 font-medium"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {getNavIcon(item.icon)}
                {item.name}
              </Link>
            </li>
          ))}

        {/* Settings */}
        {uiPermissions['settings.module.root'] === true && (
          <li>
            <Link
              to="/settings"
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === "/settings"
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Lux Portal</h1>
        </Link>
        <button
          className="block md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* User profile section near the top */}
      <div className="p-4 border-b dark:border-gray-700 mb-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(username)}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Welcome, {username}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{email}</div>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderNavigationItems()}
      </div>

      {/* Bottom actions section */}
      <div className="border-t dark:border-gray-700 p-4 space-y-2">
        {/* Notifications */}
        <div className="relative">
          <button 
            ref={notificationButtonRef}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <div className="relative mr-2">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </button>
          
          {/* Notification Popup */}
          {showNotificationPopup && latestNotification && (
            <div 
              ref={notificationPopupRef}
              className="absolute left-full ml-2 top-0 w-72 transform transition-all duration-300 ease-out origin-left"
              style={{
                animation: showNotificationPopup ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out',
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    New Notification
                  </h3>
                  <button
                    onClick={() => setShowNotificationPopup(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {latestNotification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(latestNotification.created_at).toLocaleTimeString()}
                </p>
                {latestNotification.report_url && (
                  <Link
                    to={latestNotification.report_url}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400 mt-2 inline-block"
                    onClick={(e) => {
                      // Log the URL for debugging
                      console.log('Navigating to:', latestNotification.report_url);
                      
                      // Check if it's a valid internal route
                      const validRoutes = ['/reports/', '/jobs/', '/site/', '/holidays/'];
                      const isValidRoute = validRoutes.some(route => latestNotification.report_url.startsWith(route));
                      
                      if (!isValidRoute) {
                        e.preventDefault();
                        console.error('Invalid report URL:', latestNotification.report_url);
                        // Optionally navigate to a default page
                        navigate('/dashboard');
                      }
                      
                      setShowNotificationPopup(false);
                    }}
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes slideOut {
            from {
              opacity: 0;
              transform: scaleX(0);
            }
            to {
              opacity: 1;
              transform: scaleX(1);
            }
          }
          
          @keyframes slideIn {
            from {
              opacity: 1;
              transform: scaleX(1);
            }
            to {
              opacity: 0;
              transform: scaleX(0);
            }
          }
        `}</style>

        {/* User Settings */}
        <button
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
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
