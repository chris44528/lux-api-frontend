# LUX Frontend Development Improvements Plan

## Overview
This document outlines the requested improvements to the LUX Frontend application based on feedback from the live development environment. The improvements span across job management, analysis pages, sidebar navigation, and reporting functionality.

## 1. Job Management Page Improvements (/jobs)

### 1.1 Checkbox Click Behavior Fix
**Issue**: Multi-select checkboxes on the left side of the table cannot be clicked independently as clicking anywhere on the row navigates to the job detail page.

**Frontend Changes**:
- Modify `job-table.tsx` line 649 to prevent row click event propagation when checkbox is clicked
- Add `onClick` handler to checkbox cell that stops propagation:
```tsx
<TableCell 
  className="px-6 py-4"
  onClick={(e) => e.stopPropagation()}
>
  <Checkbox
    checked={selectedJobs.has(job.id.toString())}
    onCheckedChange={(checked) => handleSelectJob(job.id.toString(), checked as boolean)}
  />
</TableCell>
```

### 1.2 Site Status Column Addition
**Feature**: Add a new "Site Status" calculated column showing communication status

**Frontend Changes**:
- Add new column header in `job-table.tsx` after "Queue" column
- Add status calculation logic based on meter readings
- Display status with appropriate styling

**Backend Requirements**:
- Create new API endpoint: `GET /api/v1/sites/{site_id}/communication-status/`
- Response format:
```json
{
  "status": "no_coms" | "zero_read",
  "days": number,
  "last_reading_date": "YYYY-MM-DD",
  "last_reading_value": number
}
```
- Logic:
  - Query `MeterReadings` table for site
  - If no readings in last X days: return "no_coms" with days count
  - If readings exist but sum = 0: return "zero_read" with days count

### 1.3 Advanced Filter Dropdown Background Fix
**Issue**: Transparent background makes text hard to read

**Frontend Changes**:
- Update `job-filter.tsx` line 357:
```tsx
<PopoverContent className="w-80 p-0 bg-white dark:bg-gray-800 border dark:border-gray-700" align="end">
```
- Ensure all child components have proper background styling

### 1.4 Connect Filters to Backend API
**Feature**: Replace dummy data with actual API data for "Assigned to" and "Queue" filters

**Frontend Changes**:
- Already fetching technicians and queues from API in `job-table.tsx`
- Remove mock data fallback (lines 268-317 in job-table.tsx)

**Backend Requirements**:
- Ensure endpoints return proper data:
  - `GET /api/v1/technicians/` - Return active technicians
  - `GET /api/v1/job-queues/` - Return configured queues

### 1.5 Bulk Actions Implementation
**Feature**: Select multiple sites and perform bulk actions (assign, meter test)

**Frontend Changes**:
- Bulk selection UI already exists
- Add "Bulk Meter Test" button to bulk actions section
- Create new `BulkMeterTestModal` component:
```tsx
interface BulkMeterTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobs: string[];
  onTestComplete: (results: MeterTestResult[]) => void;
}
```
- Implement progress tracking for each site
- Show results in modal with site name and test outcome

**Backend Requirements**:
- The existing meter test API (`POST /meter/reading`) only handles single requests
- Frontend will loop through selected sites and make individual API calls
- Consider adding bulk endpoint in future: `POST /api/v1/meter-tests/bulk/`

### 1.6 Default Job View Filtering
**Feature**: Default view should not show completed jobs

**Frontend Changes**:
- Update `job-table.tsx` to filter out completed jobs by default:
```tsx
const defaultFilters: JobFilters = {
  status: [], // Change to exclude 'completed'
  // ... other filters
}
```
- Add logic to exclude completed status unless explicitly viewing completed jobs

### 1.7 Sidebar Completed Jobs Link
**Feature**: Dedicated "Completed Jobs" link showing only completed jobs

**Frontend Changes**:
- Already exists in sidebar at line 430
- Create new route handler that sets filter to show only completed jobs
- Update the link to pass a query parameter or state to set the filter

## 2. Analysis Page Redesign

### 2.1 Three-Tab Structure
The analysis page should have three main tabs with drill-down capabilities.

#### 2.1.1 Connection Analysis Tab
**Purpose**: Show signal level and network connection analysis by location

**Frontend Implementation**:
- Update existing `ConnectionAnalysis` component
- Add hierarchical drill-down: Region → Sub-region → City/Town → Individual sites
- Display charts for:
  - Average signal strength by region
  - Connection uptime percentages
  - Network type distribution (2G/3G/4G)

**Backend Requirements**:
- New endpoint: `GET /api/v1/analysis/connection/`
- Parameters: `region`, `sub_region`, `date_range`, `drill_down_level`
- Response should include:
```json
{
  "regions": [
    {
      "name": "Yorkshire",
      "average_signal": -85,
      "connection_uptime": 95.5,
      "site_count": 150,
      "sub_regions": ["North", "South", "East", "West"]
    }
  ],
  "chart_data": {
    "signal_distribution": [...],
    "network_types": [...]
  }
}
```
- May need to geocode sites or add region mapping table

#### 2.1.2 Readings Analysis Tab
**Purpose**: Show performance metrics and anomalies by region

**Frontend Implementation**:
- Create new `ReadingsAnalysis` component
- Visual showcases:
  - Total readings collected per region (bar chart)
  - Average daily generation per region (line chart)
  - Anomaly detection highlighting (sites with unusual patterns)
  - Good vs bad performing areas heatmap

**Backend Requirements**:
- New endpoint: `GET /api/v1/analysis/readings/`
- Parameters: `region`, `date_range`, `anomaly_threshold`
- Response format:
```json
{
  "regions": [
    {
      "name": "Yorkshire",
      "total_readings": 45000,
      "average_daily_generation": 125.5,
      "anomaly_count": 12,
      "performance_score": 85
    }
  ],
  "anomalies": [
    {
      "site_id": 123,
      "site_name": "Site ABC",
      "anomaly_type": "zero_generation",
      "duration_days": 3
    }
  ]
}
```

#### 2.1.3 Performance Analysis Tab
**Purpose**: Compare actual generation vs PVGIS predictions

**Frontend Implementation**:
- Create new `PerformanceAnalysis` component
- Use `SitePVGISData` table for predictions
- Calculate monthly performance percentage (actual/predicted * 100)
- Filters for:
  - Underperforming systems (< 80% of predicted)
  - High performing systems (> 100% of predicted)
  - Date range selection
- Drill-down from region to individual site level

**Backend Requirements**:
- New endpoint: `GET /api/v1/analysis/performance/`
- Parameters: `region`, `performance_threshold`, `date_range`
- Response:
```json
{
  "performance_summary": {
    "total_sites": 500,
    "underperforming": 50,
    "overperforming": 120,
    "average_performance": 92.5
  },
  "site_performance": [
    {
      "site_id": 123,
      "site_name": "Site ABC",
      "monthly_performance": [
        {"month": "2024-01", "actual": 1200, "predicted": 1100, "percentage": 109},
        {"month": "2024-02", "actual": 1000, "predicted": 1200, "percentage": 83}
      ]
    }
  ]
}
```

## 3. Sidebar Adjustments

### 3.1 Remove Completed Jobs from Root
**Implementation**:
- The "Completed Jobs" link should only appear under Job Management dropdown
- Already correctly implemented in current code (line 430 in Sidebar.tsx)
- No additional changes needed

## 4. Reports Suite for Job Management

### 4.1 Job Management Reports
Create comprehensive reports for tracking job metrics.

**Report Types to Implement**:

1. **Job Status Summary Report**
   - Total jobs by status
   - Average time in each status
   - Trend over time

2. **Technician Performance Report**
   - Jobs assigned per technician
   - Completion rates
   - Average job duration

3. **Queue Analysis Report**
   - Jobs per queue
   - Queue backlog trends
   - Priority distribution

4. **Job Completion Metrics**
   - On-time completion rate
   - Overdue jobs analysis
   - Time to completion distribution

**Frontend Implementation**:
- Add new report options to Reports dropdown
- Create report components using existing report builder framework
- Add export functionality for all reports

**Backend Requirements**:
- New endpoints under `/api/v1/reports/jobs/`:
  - `GET /status-summary/`
  - `GET /technician-performance/`
  - `GET /queue-analysis/`
  - `GET /completion-metrics/`
- All endpoints should support date range filtering and export formats

## 5. Backend API Summary

### New Endpoints Required:

1. **Site Communication Status**
   - `GET /api/v1/sites/{site_id}/communication-status/`
   - Returns no_coms or zero_read status with day count

2. **Analysis Endpoints**
   - `GET /api/v1/analysis/connection/` - Connection analysis data
   - `GET /api/v1/analysis/readings/` - Readings analysis with anomalies
   - `GET /api/v1/analysis/performance/` - PVGIS comparison data

3. **Job Reports Endpoints**
   - `GET /api/v1/reports/jobs/status-summary/`
   - `GET /api/v1/reports/jobs/technician-performance/`
   - `GET /api/v1/reports/jobs/queue-analysis/`
   - `GET /api/v1/reports/jobs/completion-metrics/`

### Database Considerations:

1. **Region Mapping**
   - May need to add `region` and `sub_region` fields to Site model
   - Or create a separate `SiteRegion` mapping table
   - Consider using postcodes for automatic region assignment

2. **Performance Optimization**
   - Add indexes on `MeterReadings` table for date queries
   - Consider materialized views for analysis data
   - Cache frequently accessed analysis results

## 6. Implementation Priority

### Phase 1 (Quick Wins)
1. Fix checkbox click behavior
2. Fix filter dropdown background
3. Connect filters to actual API data
4. Implement default job view filtering

### Phase 2 (Core Features)
1. Add Site Status column with backend API
2. Implement bulk actions for job assignment
3. Create Connection Analysis tab with basic functionality

### Phase 3 (Advanced Features)
1. Implement bulk meter testing with progress modal
2. Complete Readings Analysis tab
3. Complete Performance Analysis tab
4. Add job management reports

## 7. Questions for Backend Team

1. **Region Data**: How should sites be mapped to regions? Do we have this data or need to derive from postcodes?
2. **PVGIS Data**: Is the `SitePVGISData` table populated for all sites? What's the update frequency?
3. **Meter Test API**: Can we add a bulk endpoint or should frontend handle multiple requests?
4. **Performance**: What's the current database size and expected query performance for analysis endpoints?
5. **Caching**: Should analysis data be cached? If so, what's the acceptable data staleness?

## 8. Testing Considerations

### Frontend Testing
- Unit tests for new calculation logic (Site Status, Performance %)
- Integration tests for bulk actions
- E2E tests for analysis drill-down flows

### Backend Testing
- Load testing for analysis endpoints with large datasets
- Unit tests for status calculation logic
- Integration tests for new report endpoints

## Next Steps

1. Review and approve this plan
2. Clarify backend questions
3. Create detailed tickets for each phase
4. Begin Phase 1 implementation
5. Set up staging environment for testing