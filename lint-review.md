# Frontend Lint Review Report

## Overview
This report provides a comprehensive review of linting issues in the frontend codebase. The review focuses on TypeScript type safety, unused variables, and other common code quality issues.

## TypeScript Configuration
The project uses a strict TypeScript configuration with the following settings:
- `strict: true` - Enables all strict type checking options
- `noUnusedLocals: true` - Reports errors on unused local variables
- `noUnusedParameters: true` - Reports errors on unused parameters
- `noFallthroughCasesInSwitch: true` - Reports errors for fallthrough cases in switch statements
- `noUncheckedSideEffectImports: true` - Ensures imports with side effects are properly handled

## Issues Fixed

### 1. Removed Unused Imports
Removed unused imports from the API service file:
```typescript
// Before
import { 
    SiteDetailResponse, // Unused
    Customer,           // Unused
    Meter,              // Unused
    MeterReading,       // Unused
    ActAdditionalFields,// Unused
    SimDetails,         // Unused
    PaginatedResponse
} from '../types/api';

// After
import { 
    SystemNote, 
    PaginatedResponse
} from '../types/api';
```

### 2. Added Proper Type Definitions
Added proper type definitions for the cache and API responses:

```typescript
// Before
const siteDetailCache: any = {};

// After
interface SiteDetailCacheItem {
    data: Record<string, unknown>;
    timestamp: number;
}
const siteDetailCache: Record<string, SiteDetailCacheItem> = {};
```

### 3. Improved Error Handling
Added proper error handling with typed interfaces:

```typescript
// Before
} catch (error: any) {
    console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
    });
    throw error;
}

// After
interface ApiError {
    response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
    };
    message: string;
}

// ...

} catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
    });
    throw error;
}
```

### 4. Added Type Definitions for API Responses
Added proper type definitions for API responses:

```typescript
// Before
interface MeterTestStatusResponse {
    status: string;
    result?: any;
    error?: string;
}

// After
interface MeterTestResult {
    value: number;
    unit: string;
    scaler: number;
    status: string;
    timestamp: string;
}

interface MeterTestStatusResponse {
    status: string;
    result?: Record<string, MeterTestResult>;
    error?: string;
}
```

### 5. Added Type Definitions for Third-Party Libraries
Created a type definition file for lodash/debounce:

```typescript
// src/types/lodash.d.ts
declare module 'lodash/debounce' {
    function debounce<T extends (...args: unknown[]) => unknown>(
        func: T,
        wait?: number,
        options?: {
            leading?: boolean;
            maxWait?: number;
            trailing?: boolean;
        }
    ): T & {
        cancel(): void;
        flush(): ReturnType<T>;
    };

    export default debounce;
}
```

### 6. Improved Type Safety in SiteDetail.tsx
Added proper type definitions for the SiteDetail component:

```typescript
// Before
const processReadings = useCallback((readings: any[]) => {
  // ...
});

// After
interface ApiReading {
  date: string;
  meter_reading: string | number;
  meter_serial: string | null;
  generation_increase: string | number | null;
  is_generation?: boolean;
}

const processReadings = (readings: ApiReading[]) => {
  // ...
  return {
    // ...
  } as ProcessedReading;
};
```

```typescript
// Before
const sites = response.results.map((site: any) => ({
  // ...
}));

// After
interface SiteSearchResult {
  Site_id: number;
  Site_Name: string;
  Address?: string;
  Postcode?: string;
  Region?: string;
  InstallDate?: string;
  FITid?: string;
  Fco?: string;
}

const sites = response.results.map((site: SiteSearchResult) => ({
  // ...
}));
```

## Remaining Issues

### 1. Use of `any` Type in Other Files
There are still occurrences of the `any` type in other files that should be addressed:

#### In `types/api.ts`:
```typescript
active_alerts: any[];
meter_tests: any[];
alerts: any[];
logs: any[];
```

### 2. Type Assertion Issues
There are still some type assertion issues that need to be addressed:

```typescript
// Type 'undefined' is not assignable to type 'string'
Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

### 3. Function Parameter Type Issues
There are issues with function parameter types in some callbacks:

```typescript
Argument of type '(term: string) => void' is not assignable to parameter of type '(...args: unknown[]) => unknown'.
```

## Recommendations for Further Improvements

1. Continue replacing `any` types with proper type definitions in other files.
2. Add proper null/undefined checks before using optional properties.
3. Create proper type definitions for callback functions.
4. Consider using a linting tool like ESLint with TypeScript rules to automatically catch these issues.
5. Add proper return types to all functions.

## Conclusion
We've made significant improvements to the type safety of the codebase, particularly in the API service file and the SiteDetail component. These changes will help prevent bugs and improve code maintainability. However, there are still some linting issues that should be addressed in other files. 