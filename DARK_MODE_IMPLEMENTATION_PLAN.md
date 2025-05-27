# Dark Mode Implementation Plan

## Current Status
- ✅ Dark mode toggle exists in Sidebar.tsx (User Settings modal)
- ✅ Basic implementation using Tailwind CSS dark classes
- ✅ State persisted in localStorage
- ⚠️ Limited coverage - only a few components have dark mode styles
- ❌ No centralized theme context
- ❌ Many components missing dark mode support

## Implementation Steps

### 1. Create Theme Context (Priority: High)
Create a centralized theme context to manage dark mode state across the application.

**File to create:** `src/contexts/ThemeContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### 2. Update Tailwind Configuration (Priority: High)
**File:** `tailwind.config.js`
```javascript
module.exports = {
  darkMode: 'class', // Explicitly set dark mode to class-based
  // ... rest of config
}
```

### 3. Wrap App with ThemeProvider (Priority: High)
**File:** `src/main.tsx`
- Wrap the entire app with ThemeProvider

### 4. Update Sidebar Component (Priority: High)
**File:** `src/components/Sidebar.tsx`
- Replace local dark mode state with `useTheme` hook
- Remove local toggle logic

### 5. Components Requiring Dark Mode Updates (Priority: High)

#### Layout Components
- ✅ `StaffLayout.tsx` - Already has `dark:bg-gray-900`
- ❌ `EngineerLayout.tsx` - Needs dark mode classes

#### Core Components
- ❌ `Login.tsx` - Missing dark mode styles
- ❌ `Register.tsx` - Missing dark mode styles
- ❌ `LandingPage.tsx` - Missing dark mode styles
- ❌ `ErrorBoundary.tsx` - Missing dark mode styles
- ❌ `NotFound.tsx` - Missing dark mode styles

#### Dashboard Components
- ❌ `NewDashboardPage.tsx` - Missing dark mode styles
- ❌ `DashboardGrid.tsx` - Missing dark mode styles
- ❌ `Widget.tsx` - Missing dark mode styles

#### Site Components
- ❌ `SitesPage.tsx` - Missing dark mode styles
- ❌ `SiteCard.tsx` - Missing dark mode styles
- ❌ `SiteList.tsx` - Missing dark mode styles
- ❌ `StaffSiteDetailPage.tsx` - Missing dark mode styles

#### Job Management Components
- ❌ `job-table.tsx` - Missing dark mode styles
- ❌ `job-board.tsx` - Missing dark mode styles
- ❌ `job-card.tsx` - Missing dark mode styles
- ❌ `job-filter.tsx` - Missing dark mode styles

#### Modal Components
- ❌ All modal components need dark mode support

#### Form Components
- ❌ All form inputs need dark mode styles

### 6. Common Dark Mode Classes to Add

#### Background Colors
- `bg-white` → `bg-white dark:bg-gray-800`
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-900`
- `bg-gray-100` → `bg-gray-100 dark:bg-gray-700`

#### Text Colors
- `text-gray-900` → `text-gray-900 dark:text-white`
- `text-gray-700` → `text-gray-700 dark:text-gray-300`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`

#### Border Colors
- `border-gray-200` → `border-gray-200 dark:border-gray-700`
- `border-gray-300` → `border-gray-300 dark:border-gray-600`

#### Card/Modal Backgrounds
- Add: `dark:bg-gray-800` for cards
- Add: `dark:bg-gray-800 dark:border-gray-700` for modals

#### Input Fields
- Add: `dark:bg-gray-700 dark:text-white dark:border-gray-600`

### 7. UI Components Library Updates (Priority: Medium)
Update all components in `src/components/ui/`:
- `button.tsx` - Add dark mode variants
- `card.tsx` - Add dark mode backgrounds
- `input.tsx` - Add dark mode styles
- `select.tsx` - Add dark mode styles
- `dialog.tsx` - Add dark mode backgrounds
- `table.tsx` - Add dark mode styles
- etc.

### 8. Charts and Visualizations (Priority: Medium)
- Update chart themes for dark mode
- Ensure proper contrast for data visualization

### 9. Testing Checklist
- [ ] Toggle works from settings
- [ ] State persists on page refresh
- [ ] All text is readable in dark mode
- [ ] Forms are usable in dark mode
- [ ] Modals have proper dark backgrounds
- [ ] Charts are visible in dark mode
- [ ] No white flashes on page load
- [ ] Hover states work in dark mode

### 10. Performance Considerations
- Add `color-scheme` meta tag to prevent flash
- Ensure dark mode class is applied before first paint

## Implementation Order
1. Create ThemeContext and provider
2. Update Tailwind config
3. Integrate ThemeProvider in main.tsx
4. Update Sidebar to use context
5. Update core layout components
6. Update authentication pages
7. Update dashboard components
8. Update remaining components
9. Test thoroughly

## Estimated Time
- Initial setup (Context + Provider): 1 hour
- Core components: 2-3 hours
- All components: 6-8 hours
- Testing and refinement: 2 hours

Total: ~12 hours for complete implementation