# Dark Mode Implementation - Quick Start Guide

## What's Been Done (85+ minutes of work)

### ✅ Foundation Complete
1. **Created Theme Context** (`/src/contexts/ThemeContext.tsx`)
   - Centralized dark mode state management
   - Automatically applies/removes 'dark' class to document
   - Persists preference to localStorage

2. **Updated Core Files**
   - `tailwind.config.js` - Added `darkMode: 'class'`
   - `main.tsx` - Wrapped app with ThemeProvider
   - `Sidebar.tsx` - Refactored to use theme context

3. **Added Dark Mode to Key Components**
   - ✅ StaffLayout - Already had dark mode
   - ✅ EngineerLayout - Added dark background
   - ✅ Login page - Full dark mode support
   - ✅ Register page - Full dark mode support
   - ✅ LandingPage - Full dark mode support
   - ✅ ErrorBoundary - Full dark mode support
   - ✅ NotFound - Full dark mode support
   - ✅ Dashboard pages - All dashboard components
   - ✅ DashboardGrid - All widgets and charts
   - ✅ Widget - Container and content
   - ✅ Sidebar - Partial dark mode (needs more work on nav items)
   - ✅ All Site Management - SitesPage, SiteCard, SiteList, SitesView
   - ✅ Job Management (partial) - job-table, job-board, job-card, job-column
   - ✅ Entire UI Component Library - 15 components total

## How to Test
1. Run `npm run dev`
2. Go to User Settings (bottom of sidebar)
3. Toggle Dark Mode switch
4. Check Login/Register pages in dark mode

## How to Continue

### Next Priority Components (Start Here)
1. **SitesPage.tsx** - Main sites listing page
2. **SiteCard.tsx** - Individual site cards  
3. **job-table.tsx** - Job management table (high usage)
4. **UI Component Library** - button, input, select, etc.

### Quick Reference - Dark Mode Classes
```css
/* Backgrounds */
bg-white → bg-white dark:bg-gray-800
bg-gray-50 → bg-gray-50 dark:bg-gray-900
bg-gray-100 → bg-gray-100 dark:bg-gray-700

/* Text */
text-gray-900 → text-gray-900 dark:text-white
text-gray-700 → text-gray-700 dark:text-gray-300
text-gray-600 → text-gray-600 dark:text-gray-400

/* Borders */
border-gray-200 → border-gray-200 dark:border-gray-700
border-gray-300 → border-gray-300 dark:border-gray-600

/* Inputs */
Add: dark:bg-gray-700 dark:text-white dark:border-gray-600

/* Cards/Modals */
Add: dark:bg-gray-800 dark:shadow-gray-700

/* Buttons (green) */
bg-green-600 → bg-green-600 dark:bg-green-700
hover:bg-green-700 → hover:bg-green-700 dark:hover:bg-green-600
```

### Simple Process for Each Component
1. Find all `className` attributes
2. Add dark variants after light colors
3. Test in browser with dark mode toggle
4. Check hover states and focus states

### Components Still Needing Dark Mode
- ✅ ~~All Dashboard components~~ COMPLETED
- ✅ ~~All Site management components~~ COMPLETED (except detail pages)
- Remaining Job management components (job-filter, job-detail-page)
- All Modal components
- ✅ ~~All UI library components (`/src/components/ui/`)~~ COMPLETED
- ✅ ~~Charts and data visualizations~~ COMPLETED in Dashboard
- Staff/Engineer Site Detail Pages
- Settings pages
- Reports pages
- Bio-mass components
- Calendar page

## Time Saved
By setting up the foundation properly, each component now only needs CSS class updates - no logic changes required. The toggle works globally from User Settings.

## Tips
- Use browser DevTools to test - add/remove 'dark' class on `<html>` element
- Check contrast - ensure text is readable on dark backgrounds
- Don't forget hover and focus states
- Test form validation states in dark mode