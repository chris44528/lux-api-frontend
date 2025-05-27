# Holiday Management System Implementation Plan

## Overview
This document outlines the implementation plan for a comprehensive holiday management system that integrates with the job scheduling system. The feature will prevent job assignments during holidays/leave periods and automatically adjust job allocations when leave is requested.

## Database Schema

### 1. Holiday Types
```python
class HolidayType(models.Model):
    """Types of leave/holidays available"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)  # e.g., "Annual Leave", "Sick Leave", "Public Holiday"
    code = models.CharField(max_length=20, unique=True)  # e.g., "AL", "SL", "PH"
    color = models.CharField(max_length=7)  # Hex color for UI display
    requires_approval = models.BooleanField(default=True)
    max_days_per_year = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. Holiday Requests
```python
class HolidayRequest(models.Model):
    """Individual holiday/leave requests"""
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='holiday_requests')
    holiday_type = models.ForeignKey(HolidayType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    start_half_day = models.BooleanField(default=False)  # Morning half-day
    end_half_day = models.BooleanField(default=False)    # Afternoon half-day
    total_days = models.DecimalField(max_digits=4, decimal_places=1)  # Calculated field
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled')
    ], default='DRAFT')
    submitted_at = models.DateTimeField(null=True, blank=True)
    department = models.ForeignKey('core.Department', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3. Holiday Approvals
```python
class HolidayApproval(models.Model):
    """Approval workflow for holiday requests"""
    id = models.AutoField(primary_key=True)
    holiday_request = models.ForeignKey(HolidayRequest, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='holiday_approvals')
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected')
    ])
    comments = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 4. Department Approvers
```python
class DepartmentApprover(models.Model):
    """Defines who can approve holidays for each department"""
    id = models.AutoField(primary_key=True)
    department = models.ForeignKey('core.Department', on_delete=models.CASCADE)
    approver = models.ForeignKey(User, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)  # Primary approver
    can_approve_own_department = models.BooleanField(default=True)
    max_days_can_approve = models.IntegerField(null=True, blank=True)  # Limit approval authority
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['department', 'approver']
```

### 5. Holiday Entitlements
```python
class HolidayEntitlement(models.Model):
    """Annual holiday entitlements per user"""
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    holiday_type = models.ForeignKey(HolidayType, on_delete=models.CASCADE)
    year = models.IntegerField()
    total_days = models.DecimalField(max_digits=4, decimal_places=1)
    days_taken = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    days_pending = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    days_remaining = models.DecimalField(max_digits=4, decimal_places=1)  # Calculated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'holiday_type', 'year']
```

### 6. Public Holidays
```python
class PublicHoliday(models.Model):
    """System-wide public holidays"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    country = models.CharField(max_length=2, default='GB')  # ISO country code
    applies_to_all = models.BooleanField(default=True)
    departments = models.ManyToManyField('core.Department', blank=True)  # If not applies_to_all
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 7. Holiday Policy Configuration
```python
class HolidayPolicy(models.Model):
    """HR-configurable holiday policies"""
    id = models.AutoField(primary_key=True)
    department = models.ForeignKey('core.Department', on_delete=models.CASCADE, null=True, blank=True)
    holiday_type = models.ForeignKey(HolidayType, on_delete=models.CASCADE)
    
    # Entitlement settings
    default_annual_entitlement = models.DecimalField(max_digits=4, decimal_places=1, default=25)
    pro_rata_calculation = models.BooleanField(default=True)  # For part-time/new starters
    carry_over_days = models.DecimalField(max_digits=4, decimal_places=1, default=5)
    carry_over_expiry_months = models.IntegerField(default=3)  # Must use carried over days within X months
    
    # Booking restrictions
    min_notice_days = models.IntegerField(default=14)
    max_consecutive_days = models.IntegerField(default=20)
    max_advance_booking_days = models.IntegerField(default=365)
    allow_negative_balance = models.BooleanField(default=False)
    
    # Approval settings
    auto_approve_threshold_days = models.DecimalField(max_digits=3, decimal_places=1, default=2)
    require_manager_approval = models.BooleanField(default=True)
    require_hr_approval_over_days = models.IntegerField(null=True, blank=True)  # Escalate to HR for long periods
    
    # Blackout periods
    blackout_periods_enabled = models.BooleanField(default=False)
    
    # Applies to all departments if department is null
    is_global_policy = models.BooleanField(default=False)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['department', 'holiday_type', 'effective_from']
```

### 8. Blackout Periods
```python
class BlackoutPeriod(models.Model):
    """Periods when holidays cannot be taken"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)  # e.g., "Year-end processing", "Peak season"
    start_date = models.DateField()
    end_date = models.DateField()
    departments = models.ManyToManyField('core.Department', blank=True)  # Empty = all departments
    holiday_types = models.ManyToManyField(HolidayType, blank=True)  # Empty = all types
    reason = models.TextField()
    allow_emergency_override = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## API Endpoints

### 1. Holiday Types Management
```
GET    /api/holidays/types/
POST   /api/holidays/types/
GET    /api/holidays/types/{id}/
PUT    /api/holidays/types/{id}/
DELETE /api/holidays/types/{id}/
```

**Response Format (GET /api/holidays/types/):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "Annual Leave",
      "code": "AL",
      "color": "#4CAF50",
      "requires_approval": true,
      "max_days_per_year": 25,
      "is_active": true
    },
    {
      "id": 2,
      "name": "Sick Leave",
      "code": "SL",
      "color": "#FF9800",
      "requires_approval": true,
      "max_days_per_year": null,
      "is_active": true
    }
  ]
}
```

### 2. Holiday Requests
```
GET    /api/holidays/requests/                    # List all requests (filtered by permissions)
POST   /api/holidays/requests/                    # Create new request
GET    /api/holidays/requests/{id}/               # Get specific request
PUT    /api/holidays/requests/{id}/               # Update request
DELETE /api/holidays/requests/{id}/               # Delete request
POST   /api/holidays/requests/{id}/submit/        # Submit for approval
POST   /api/holidays/requests/{id}/cancel/        # Cancel request
GET    /api/holidays/requests/my-requests/        # Current user's requests
GET    /api/holidays/requests/pending-approval/   # Requests pending approval (for approvers)
GET    /api/holidays/requests/calendar/           # Calendar view data
```

**Request Format (POST /api/holidays/requests/):**
```json
{
  "holiday_type_id": 1,
  "start_date": "2024-07-01",
  "end_date": "2024-07-05",
  "start_half_day": false,
  "end_half_day": false,
  "reason": "Summer vacation"
}
```

**Response Format:**
```json
{
  "id": 123,
  "user": {
    "id": 456,
    "username": "john.doe",
    "full_name": "John Doe",
    "department": "Engineering"
  },
  "holiday_type": {
    "id": 1,
    "name": "Annual Leave",
    "code": "AL",
    "color": "#4CAF50"
  },
  "start_date": "2024-07-01",
  "end_date": "2024-07-05",
  "start_half_day": false,
  "end_half_day": false,
  "total_days": 5.0,
  "reason": "Summer vacation",
  "status": "DRAFT",
  "submitted_at": null,
  "approvals": [],
  "can_edit": true,
  "can_submit": true,
  "can_cancel": false
}
```

### 3. Approval Workflow
```
POST   /api/holidays/requests/{id}/approve/       # Approve request
POST   /api/holidays/requests/{id}/reject/        # Reject request
GET    /api/holidays/approvers/                   # List all approvers
POST   /api/holidays/approvers/                   # Add approver
DELETE /api/holidays/approvers/{id}/              # Remove approver
```

**Approval Request Format:**
```json
{
  "comments": "Approved. Enjoy your vacation!"
}
```

**Rejection Request Format:**
```json
{
  "comments": "Sorry, we need you during this period due to project deadline."
}
```

### 4. Entitlements Management
```
GET    /api/holidays/entitlements/                # List entitlements
POST   /api/holidays/entitlements/                # Create entitlement
PUT    /api/holidays/entitlements/{id}/           # Update entitlement
GET    /api/holidays/entitlements/summary/        # User's entitlement summary
GET    /api/holidays/entitlements/balance/{user_id}/ # Specific user's balance
```

**Entitlement Summary Response:**
```json
{
  "year": 2024,
  "entitlements": [
    {
      "holiday_type": {
        "id": 1,
        "name": "Annual Leave",
        "code": "AL"
      },
      "total_days": 25.0,
      "days_taken": 10.0,
      "days_pending": 5.0,
      "days_remaining": 10.0
    },
    {
      "holiday_type": {
        "id": 2,
        "name": "Sick Leave",
        "code": "SL"
      },
      "total_days": null,
      "days_taken": 2.0,
      "days_pending": 0,
      "days_remaining": null
    }
  ]
}
```

### 5. Public Holidays
```
GET    /api/holidays/public/                      # List public holidays
POST   /api/holidays/public/                      # Create public holiday
PUT    /api/holidays/public/{id}/                 # Update public holiday
DELETE /api/holidays/public/{id}/                 # Delete public holiday
GET    /api/holidays/public/upcoming/             # Upcoming public holidays
```

### 6. Reports and Analytics
```
GET    /api/holidays/reports/department-summary/  # Department holiday summary
GET    /api/holidays/reports/availability/        # Team availability report
GET    /api/holidays/reports/usage-trends/        # Holiday usage trends
GET    /api/holidays/reports/export/              # Export holiday data
```

**Department Summary Response:**
```json
{
  "department": "Engineering",
  "period": "2024-Q2",
  "summary": {
    "total_employees": 25,
    "total_days_taken": 125,
    "average_days_per_employee": 5.0,
    "employees_on_leave_today": 2,
    "upcoming_leaves_this_week": 4
  },
  "by_holiday_type": [
    {
      "type": "Annual Leave",
      "days_taken": 100,
      "employees_used": 20
    },
    {
      "type": "Sick Leave",
      "days_taken": 25,
      "employees_used": 10
    }
  ]
}
```

### 7. Integration Endpoints
```
GET    /api/holidays/check-availability/          # Check if users are available
POST   /api/holidays/job-conflicts/               # Check for job conflicts
GET    /api/holidays/team-calendar/               # Team calendar data
```

**Availability Check Request:**
```json
{
  "user_ids": [1, 2, 3],
  "date_range": {
    "start": "2024-07-01",
    "end": "2024-07-05"
  }
}
```

**Availability Check Response:**
```json
{
  "available_users": [1, 3],
  "unavailable_users": [
    {
      "user_id": 2,
      "reason": "Annual Leave",
      "dates": ["2024-07-03", "2024-07-04"]
    }
  ]
}
```

### 7. Holiday Policy Management (HR Only)
```
GET    /api/holidays/policies/                    # List all policies
POST   /api/holidays/policies/                    # Create new policy
GET    /api/holidays/policies/{id}/               # Get specific policy
PUT    /api/holidays/policies/{id}/               # Update policy
DELETE /api/holidays/policies/{id}/               # Delete policy
GET    /api/holidays/policies/department/{dept_id}/ # Get policies for department
POST   /api/holidays/policies/copy/               # Copy policy to multiple departments
```

**Policy Request Format:**
```json
{
  "department_id": 1,
  "holiday_type_id": 1,
  "default_annual_entitlement": 25.0,
  "pro_rata_calculation": true,
  "carry_over_days": 5.0,
  "carry_over_expiry_months": 3,
  "min_notice_days": 14,
  "max_consecutive_days": 20,
  "max_advance_booking_days": 365,
  "allow_negative_balance": false,
  "auto_approve_threshold_days": 2.0,
  "require_manager_approval": true,
  "require_hr_approval_over_days": 10,
  "blackout_periods_enabled": true,
  "is_global_policy": false,
  "effective_from": "2024-01-01"
}
```

### 8. Blackout Periods Management
```
GET    /api/holidays/blackout-periods/            # List blackout periods
POST   /api/holidays/blackout-periods/            # Create blackout period
PUT    /api/holidays/blackout-periods/{id}/       # Update blackout period
DELETE /api/holidays/blackout-periods/{id}/       # Delete blackout period
GET    /api/holidays/blackout-periods/active/     # Currently active blackout periods
```

### 9. Reports and Analytics
```
GET    /api/holidays/reports/department-summary/  # Department holiday summary
GET    /api/holidays/reports/availability/        # Team availability report
GET    /api/holidays/reports/usage-trends/        # Holiday usage trends
GET    /api/holidays/reports/export/              # Export holiday data
```

## Frontend Design Concepts

### 1. Holiday Calendar View
- **Full Calendar Component** using react-big-calendar or similar
- Color-coded by holiday type
- Mini user avatars on dates showing who's off
- Quick add holiday by clicking dates
- Monthly/Weekly/Daily views
- Filter by department/team/holiday type

### 2. Holiday Request Form
```typescript
interface HolidayRequestForm {
  holidayType: SelectField;      // Dropdown with color indicators
  startDate: DatePicker;         // With calendar popup
  endDate: DatePicker;           // Auto-calculate working days
  halfDayOptions: {
    startHalfDay: Checkbox;      // "Start on afternoon"
    endHalfDay: Checkbox;        // "End at lunch"
  };
  reason: TextArea;              // Optional for some types
  attachments: FileUpload;       // For sick notes, etc.
  conflictWarning: AlertBox;     // Shows job conflicts
}
```

### 3. Approval Dashboard
- **Kanban-style board** with columns: Pending | Approved | Rejected
- Card for each request showing:
  - Employee photo and name
  - Holiday dates and type
  - Days requested
  - Current workload/assigned jobs
  - Quick approve/reject buttons
- Bulk approval capabilities
- Filter and sort options

### 4. Entitlement Widget
```typescript
// Circular progress indicator showing:
interface EntitlementWidget {
  holidayType: string;
  totalDays: number;
  used: number;
  pending: number;
  remaining: number;
  progressRing: CircularProgress; // Visual indicator
  quickActions: {
    requestLeave: Button;
    viewHistory: Button;
  };
}
```

### 5. Team Availability Timeline
- **Gantt-style chart** showing:
  - Team members on Y-axis
  - Time on X-axis
  - Color bars for different leave types
  - Job assignments overlay
  - Capacity indicators

### 6. HR Policy Configuration Dashboard
```typescript
interface HRPolicyDashboard {
  departmentSelector: Select;           // Choose department or "Global"
  holidayTypeSelector: Select;          // Annual Leave, Sick Leave, etc.
  
  entitlementSettings: {
    defaultDays: NumberInput;           // e.g., 25 days
    proRataEnabled: Toggle;             // Auto-calculate for part-time
    carryOverDays: NumberInput;         // e.g., 5 days max
    carryOverExpiry: NumberInput;       // Must use within X months
  };
  
  bookingRestrictions: {
    minNoticeDays: NumberInput;         // e.g., 14 days notice
    maxConsecutiveDays: NumberInput;    // e.g., 20 days max
    maxAdvanceBooking: NumberInput;     // e.g., 365 days ahead
    allowNegativeBalance: Toggle;
  };
  
  approvalWorkflow: {
    autoApproveThreshold: NumberInput;  // e.g., 2 days or less
    requireManagerApproval: Toggle;
    escalateToHRAfter: NumberInput;     // e.g., 10+ days
  };
  
  blackoutPeriods: {
    enabled: Toggle;
    periods: BlackoutPeriodManager;     // Add/edit/delete periods
  };
  
  previewPane: PolicyPreview;          // Shows how policy affects users
  copyToDepartments: MultiSelect;      // Bulk apply to multiple departments
}
```

### 7. Blackout Period Manager
```typescript
interface BlackoutPeriodForm {
  name: TextInput;                     // "Year-end processing"
  dateRange: DateRangePicker;          // Start and end dates
  affectedDepartments: MultiSelect;    // Select departments
  affectedHolidayTypes: MultiSelect;   // Which types of leave
  reason: TextArea;                    // Explanation
  allowEmergencyOverride: Toggle;      // HR can still approve
  
  conflictWarning: AlertBox;           // Shows existing bookings
  impactSummary: ImpactDisplay;        // How many users affected
}
```

### 8. Policy History & Audit Trail
```typescript
interface PolicyAuditLog {
  changes: TimelineView;               // Visual timeline of changes
  compareVersions: PolicyComparison;   // Side-by-side diff view
  exportAudit: Button;                 // Download audit trail
  rollbackOption: Button;              // Revert to previous version
}
```

### 9. Mobile-Responsive Design
- **Bottom sheet** for quick request on mobile
- Swipe gestures for approval/rejection
- Native date pickers
- Condensed calendar view
- Push notifications for approvals

## Approval Workflow

### Workflow States
```
DRAFT → PENDING → APPROVED/REJECTED → CANCELLED (if needed)
```

### Approval Rules
1. **Auto-approval** for requests under X days (configurable)
2. **Multi-level approval** for extended leave
3. **Department-based routing**
4. **Delegation** when approver is on leave
5. **Escalation** after X days without response

### Notification System
```typescript
interface HolidayNotification {
  type: 'REQUEST_SUBMITTED' | 'REQUEST_APPROVED' | 'REQUEST_REJECTED' | 
        'APPROVAL_NEEDED' | 'REMINDER' | 'CONFLICT_DETECTED';
  recipients: User[];
  channels: ('EMAIL' | 'SMS' | 'IN_APP' | 'PUSH')[];
  data: {
    request: HolidayRequest;
    message: string;
    actionUrl: string;
  };
}
```

## Job Integration

### Automatic Job Reallocation
```python
def reallocate_jobs_for_holiday(holiday_request):
    """
    Automatically reassign jobs when holiday is approved
    """
    affected_jobs = Job.objects.filter(
        assigned_to=holiday_request.user,
        scheduled_date__range=[
            holiday_request.start_date,
            holiday_request.end_date
        ],
        status__in=['PENDING', 'SCHEDULED']
    )
    
    for job in affected_jobs:
        # Find available team member
        available_user = find_available_user(
            job.scheduled_date,
            job.required_skills,
            job.department
        )
        
        if available_user:
            job.assigned_to = available_user
            job.reassignment_reason = f"Holiday cover for {holiday_request.user.full_name}"
            job.save()
            
            # Notify new assignee
            send_job_reassignment_notification(job, available_user)
        else:
            # Escalate if no one available
            create_unassigned_job_alert(job)
```

### Conflict Detection
```python
def check_holiday_conflicts(user, start_date, end_date):
    """
    Check for conflicts before approving holiday
    """
    conflicts = {
        'jobs': [],
        'critical_periods': [],
        'team_capacity': None
    }
    
    # Check assigned jobs
    assigned_jobs = Job.objects.filter(
        assigned_to=user,
        scheduled_date__range=[start_date, end_date],
        priority='HIGH'
    )
    
    # Check team capacity
    team_members = User.objects.filter(department=user.department)
    members_on_leave = HolidayRequest.objects.filter(
        user__in=team_members,
        status='APPROVED',
        start_date__lte=end_date,
        end_date__gte=start_date
    ).count()
    
    capacity_percentage = ((team_members.count() - members_on_leave - 1) / 
                          team_members.count()) * 100
    
    return conflicts
```

### Policy Validation & Enforcement
```python
def validate_holiday_request(request, user):
    """
    Validate holiday request against current policies
    """
    # Get applicable policy
    policy = get_policy_for_user_and_type(user, request.holiday_type)
    
    validation_errors = []
    
    # Check notice period
    if (request.start_date - timezone.now().date()).days < policy.min_notice_days:
        validation_errors.append(f"Minimum {policy.min_notice_days} days notice required")
    
    # Check consecutive days
    if request.total_days > policy.max_consecutive_days:
        validation_errors.append(f"Maximum {policy.max_consecutive_days} consecutive days allowed")
    
    # Check advance booking
    if (request.start_date - timezone.now().date()).days > policy.max_advance_booking_days:
        validation_errors.append(f"Cannot book more than {policy.max_advance_booking_days} days in advance")
    
    # Check entitlement balance
    if not policy.allow_negative_balance:
        remaining_days = get_remaining_entitlement(user, request.holiday_type)
        if request.total_days > remaining_days:
            validation_errors.append("Insufficient holiday balance")
    
    # Check blackout periods
    blackout_conflicts = check_blackout_periods(request)
    if blackout_conflicts:
        validation_errors.extend(blackout_conflicts)
    
    return validation_errors
```

## Security Considerations

### Permissions
```python
class HolidayPermissions:
    VIEW_OWN_HOLIDAYS = 'holidays.view_own'
    VIEW_DEPARTMENT_HOLIDAYS = 'holidays.view_department'
    VIEW_ALL_HOLIDAYS = 'holidays.view_all'
    CREATE_HOLIDAY_REQUEST = 'holidays.create_request'
    APPROVE_HOLIDAYS = 'holidays.approve'
    MANAGE_ENTITLEMENTS = 'holidays.manage_entitlements'
    MANAGE_PUBLIC_HOLIDAYS = 'holidays.manage_public'
    MANAGE_POLICIES = 'holidays.manage_policies'  # HR only
    MANAGE_BLACKOUTS = 'holidays.manage_blackouts'  # HR only
    VIEW_REPORTS = 'holidays.view_reports'
```

### Data Privacy
- Users can only see own requests by default
- Managers see their department only
- HR sees all with audit trail
- Sensitive reasons can be marked private
- GDPR compliance for data retention

## Implementation Status

### ✅ Backend Implementation (COMPLETED)
The following components have been successfully implemented:

1. **Database Models** ✅
   - HolidayType - Different types of leave (Annual, Sick, etc.)
   - HolidayRequest - Individual holiday requests with status tracking
   - HolidayApproval - Approval workflow records
   - DepartmentApprover - Department-based approval configuration
   - HolidayEntitlement - User entitlements tracking
   - PublicHoliday - System-wide holidays
   - HolidayPolicy - HR-configurable policies per department/type
   - BlackoutPeriod - Periods when holidays cannot be taken

2. **API Endpoints** ✅
   - All CRUD operations for holiday management
   - Holiday request submission and approval workflow
   - Entitlement tracking and balance checking
   - Policy management for HR
   - Public holiday management
   - Department approval configuration
   - Availability checking and conflict detection
   - Department summary reports

3. **Permissions System** ✅
   - Custom permissions for different user roles
   - Department-based access control
   - HR-specific management permissions

4. **Validation & Business Logic** ✅
   - Policy enforcement (notice periods, consecutive days, etc.)
   - Blackout period checking
   - Entitlement balance validation
   - Overlapping request prevention
   - Auto-approval for small requests

5. **Management Commands** ✅
   - setup_holiday_permissions - Configure permissions
   - init_holiday_data - Initialize sample data

### API Endpoint Examples

**Base URL**: `/api/v1/holidays/`

**Available Endpoints**:
- `GET /api/v1/holidays/types/` - List holiday types
- `GET /api/v1/holidays/requests/` - List holiday requests
- `POST /api/v1/holidays/requests/` - Create new request
- `GET /api/v1/holidays/requests/my-requests/` - User's own requests
- `GET /api/v1/holidays/requests/pending-approval/` - Requests awaiting approval
- `POST /api/v1/holidays/requests/{id}/submit/` - Submit request for approval
- `POST /api/v1/holidays/requests/{id}/approve/` - Approve request
- `POST /api/v1/holidays/requests/{id}/reject/` - Reject request
- `GET /api/v1/holidays/entitlements/summary/` - User's entitlement summary
- `GET /api/v1/holidays/policies/` - List holiday policies (HR only)
- `GET /api/v1/holidays/public/upcoming/` - Upcoming public holidays
- `POST /api/v1/holidays/check-availability/` - Check user availability

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2) ✅ COMPLETED
- Database models and migrations ✅
- Basic CRUD APIs ✅
- User authentication integration ✅
- Simple request/approval flow ✅

### Phase 2: Approval Workflow (Week 3-4)
- Department approver setup
- Multi-level approval logic
- Email notifications
- Status tracking

### Phase 3: Frontend Integration (Week 5-6)
- Calendar component
- Request forms
- Approval dashboard
- Mobile responsive design

### Phase 4: Job Integration (Week 7-8)
- Conflict detection
- Auto-reallocation logic
- Capacity planning
- Alert system

### Phase 5: Advanced Features (Week 9-10)
- Reports and analytics
- Bulk operations
- Public holiday management
- Excel import/export

### Phase 6: Testing & Deployment (Week 11-12)
- Comprehensive testing
- Performance optimization
- Documentation
- User training

## Testing Strategy

### Unit Tests
```python
class HolidayRequestTests(TestCase):
    def test_calculate_working_days(self):
        """Test working days calculation excluding weekends"""
        pass
    
    def test_entitlement_deduction(self):
        """Test that approved holidays deduct from entitlement"""
        pass
    
    def test_approval_workflow(self):
        """Test the approval state machine"""
        pass
```

### Integration Tests
- API endpoint testing
- Job reallocation testing
- Notification delivery
- Permission enforcement

### E2E Tests
- Complete holiday request flow
- Approval process
- Calendar interactions
- Mobile responsiveness

## Performance Considerations

### Database Optimization
- Index on date fields for quick lookups
- Materialized view for availability queries
- Caching for public holidays
- Pagination for large datasets

### API Optimization
```python
# Use select_related and prefetch_related
holiday_requests = HolidayRequest.objects.select_related(
    'user', 'holiday_type', 'department'
).prefetch_related(
    'approvals__approver'
).filter(
    department=user.department
)
```

### Frontend Optimization
- Lazy load calendar events
- Virtual scrolling for long lists
- Debounce availability checks
- Cache entitlement data

## Monitoring and Analytics

### Key Metrics
- Average approval time
- Holiday usage patterns
- Peak holiday periods
- Unplanned absence rates
- Department coverage levels

### Dashboards
```typescript
interface HolidayMetrics {
  requestVolume: TimeSeriesChart;
  approvalTimes: BarChart;
  departmentUsage: PieChart;
  yearOverYearTrends: LineChart;
  peakPeriods: HeatMap;
}
```

## Future Enhancements

1. **AI-Powered Suggestions**
   - Optimal holiday scheduling
   - Conflict prediction
   - Fair distribution algorithms

2. **Integration Extensions**
   - Payroll system sync
   - Calendar app integration (Google, Outlook)
   - Slack/Teams notifications

3. **Advanced Features**
   - Holiday trading/selling
   - Carry-over policies
   - Location-based holidays
   - Team holiday coordination

4. **Mobile App**
   - Native iOS/Android apps
   - Offline capability
   - Biometric approval
   - Widget support

## Configuration Options

```python
HOLIDAY_SETTINGS = {
    'DEFAULT_ANNUAL_LEAVE_DAYS': 25,
    'ALLOW_NEGATIVE_BALANCE': False,
    'MAX_CONSECUTIVE_DAYS': 20,
    'ADVANCE_BOOKING_DAYS': 365,
    'MIN_NOTICE_DAYS': 14,
    'APPROVAL_TIMEOUT_DAYS': 7,
    'FISCAL_YEAR_START': 'APRIL',
    'CARRY_OVER_DAYS': 5,
    'BLACKOUT_PERIODS': [],
    'AUTO_APPROVE_THRESHOLD': 2,
    'REQUIRE_ATTACHMENT_FOR': ['SL'],  # Sick leave
}
```

## Conclusion

This holiday management system provides a comprehensive solution for managing employee leave while integrating seamlessly with the job scheduling system. The modular design allows for phased implementation and future enhancements based on user feedback and changing requirements.


Summary

  I've successfully implemented the complete holiday management system backend according to the requirements in holidays.md. Here's what was completed:

  ✅ Backend Components Implemented:

  1. Django App Structure
    - Created apps/holidays app with proper configuration
    - Integrated with existing project structure
  2. Database Models (8 models)
    - HolidayType - Leave types with color coding
    - HolidayRequest - Request tracking with auto-calculation of working days
    - HolidayApproval - Approval workflow tracking
    - DepartmentApprover - Department-based approval configuration
    - HolidayEntitlement - Annual entitlement tracking
    - PublicHoliday - Public holiday management
    - HolidayPolicy - HR-configurable policies (entitlements, notice periods, max consecutive days)
    - BlackoutPeriod - Restricted periods management
  3. API Endpoints (35+ endpoints)
    - Full CRUD for all models
    - Special actions: submit, approve, reject, cancel
    - Reports: department summary, availability checks
    - Policy management with copy functionality
  4. Key Features
    - HR-configurable policies per department/holiday type
    - Automatic working days calculation (excludes weekends)
    - Half-day support
    - Auto-approval for requests under threshold
    - Blackout period validation
    - Department-based approval workflow
    - Entitlement tracking with pending/taken/remaining
    - Job conflict detection (placeholder for integration)
  5. Permissions & Security
    - 9 custom permissions created
    - Department-based access control
    - HR-only policy management
  6. Management Commands
    - setup_holiday_permissions - Sets up all permissions
    - init_holiday_data - Creates sample holiday types, policies, and UK public holidays

  The system is now ready for frontend integration. All API endpoints follow the exact format specified in holidays.md, making frontend development straightforward.