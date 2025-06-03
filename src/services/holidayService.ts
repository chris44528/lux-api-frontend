import apiClient from './api';

// Types
export interface HolidayType {
  id: number;
  name: string;
  code: string;
  color: string;
  requires_approval: boolean;
  max_days_per_year: number | null;
  is_active: boolean;
}

export interface HolidayRequest {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    department: string;
  };
  holiday_type: {
    id: number;
    name: string;
    code: string;
    color: string;
  };
  start_date: string;
  end_date: string;
  start_half_day: boolean;
  end_half_day: boolean;
  total_days: number;
  reason: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  submitted_at: string | null;
  approvals: HolidayApproval[];
  can_edit: boolean;
  can_submit: boolean;
  can_cancel: boolean;
}

export interface HolidayApproval {
  id: number;
  approver: {
    id: number;
    username: string;
    full_name: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string;
  approved_at: string | null;
}

export interface HolidayEntitlement {
  holiday_type: {
    id: number;
    name: string;
    code: string;
  };
  total_days: number | null;
  days_taken: number;
  days_pending: number;
  days_remaining: number | null;
}

export interface EntitlementSummary {
  year: number;
  entitlements: HolidayEntitlement[];
}

export interface PublicHoliday {
  id: number;
  name: string;
  date: string;
  is_recurring: boolean;
  country: string;
  applies_to_all: boolean;
}

export interface HolidayPolicy {
  id: number;
  department_id: number | null;
  holiday_type_id: number;
  default_annual_entitlement: number;
  pro_rata_calculation: boolean;
  carry_over_days: number;
  carry_over_expiry_months: number;
  min_notice_days: number;
  max_consecutive_days: number;
  max_advance_booking_days: number;
  allow_negative_balance: boolean;
  auto_approve_threshold_days: number;
  require_manager_approval: boolean;
  require_hr_approval_over_days: number | null;
  blackout_periods_enabled: boolean;
  is_global_policy: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface BlackoutPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  reason?: string;
  department_id?: number | null;
  department?: {
    id: number;
    name: string;
  };
  applies_to_all: boolean;
  allow_emergency_override?: boolean;
}

export interface DepartmentApprover {
  id: number;
  department: {
    id: number;
    name: string;
  };
  approver: {
    id: number;
    username: string;
    full_name: string;
  };
  is_primary: boolean;
  can_approve_own_department: boolean;
  max_days_can_approve: number | null;
}

export interface AvailabilityCheck {
  available_users: number[];
  unavailable_users: {
    user_id: number;
    reason: string;
    dates: string[];
  }[];
}

export interface DepartmentSummary {
  department: string;
  period: string;
  summary: {
    total_employees: number;
    total_days_taken: number;
    average_days_per_employee: number;
    employees_on_leave_today: number;
    upcoming_leaves_this_week: number;
  };
  by_holiday_type: {
    type: string;
    days_taken: number;
    employees_used: number;
  }[];
}

// API Service
class HolidayService {
  private baseUrl = '/holidays';

  // Holiday Types
  async getHolidayTypes() {
    const response = await apiClient.get<{ count: number; results: HolidayType[] }>(`${this.baseUrl}/types/`);
    return response.data;
  }

  async createHolidayType(data: Omit<HolidayType, 'id'>) {
    const response = await apiClient.post<HolidayType>(`${this.baseUrl}/types/`, data);
    return response.data;
  }

  async updateHolidayType(id: number, data: Partial<HolidayType>) {
    const response = await apiClient.put<HolidayType>(`${this.baseUrl}/types/${id}/`, data);
    return response.data;
  }

  async deleteHolidayType(id: number) {
    await apiClient.delete(`${this.baseUrl}/types/${id}/`);
  }

  // Holiday Requests
  async getHolidayRequests(params?: { status?: string; user_id?: number; department_id?: number }) {
    const response = await apiClient.get<{ count: number; results: HolidayRequest[] }>(`${this.baseUrl}/requests/`, { params });
    return response.data;
  }

  async getMyHolidayRequests() {
    const response = await apiClient.get<{ count: number; results: HolidayRequest[] }>(`${this.baseUrl}/requests/my-requests/`);
    return response.data;
  }

  async getPendingApprovals() {
    const response = await apiClient.get<{ count: number; results: HolidayRequest[] }>(`${this.baseUrl}/requests/pending-approval/`);
    return response.data;
  }

  async getHolidayRequest(id: number) {
    const response = await apiClient.get<HolidayRequest>(`${this.baseUrl}/requests/${id}/`);
    return response.data;
  }

  async createHolidayRequest(data: {
    holiday_type_id: number;
    start_date: string;
    end_date: string;
    start_half_day?: boolean;
    end_half_day?: boolean;
    reason?: string;
    department?: string;
  }) {
    const response = await apiClient.post<HolidayRequest>(`${this.baseUrl}/requests/`, data);
    return response.data;
  }

  async updateHolidayRequest(id: number, data: Partial<HolidayRequest>) {
    const response = await apiClient.put<HolidayRequest>(`${this.baseUrl}/requests/${id}/`, data);
    return response.data;
  }

  async deleteHolidayRequest(id: number) {
    await apiClient.delete(`${this.baseUrl}/requests/${id}/`);
  }

  async submitHolidayRequest(id: number) {
    const response = await apiClient.post<HolidayRequest>(`${this.baseUrl}/requests/${id}/submit/`);
    return response.data;
  }

  async cancelHolidayRequest(id: number) {
    const response = await apiClient.post<HolidayRequest>(`${this.baseUrl}/requests/${id}/cancel/`);
    return response.data;
  }

  async approveHolidayRequest(id: number, comments?: string) {
    const response = await apiClient.post<HolidayRequest>(`${this.baseUrl}/requests/${id}/approve/`, { comments });
    return response.data;
  }

  async rejectHolidayRequest(id: number, comments: string) {
    const response = await apiClient.post<HolidayRequest>(`${this.baseUrl}/requests/${id}/reject/`, { comments });
    return response.data;
  }

  async getCalendarData(params?: { start_date?: string; end_date?: string; department_id?: number }) {
    const response = await apiClient.get<HolidayRequest[]>(`${this.baseUrl}/requests/calendar/`, { params });
    return response.data;
  }

  // Entitlements
  async getEntitlements(params?: { year?: number; user_id?: number; holiday_type_id?: number }) {
    const response = await apiClient.get<{ count: number; results: HolidayEntitlement[] }>(`${this.baseUrl}/entitlements/`, { params });
    return response.data;
  }

  async createEntitlement(data: {
    user_id: number;
    holiday_type_id: number;
    year: number;
    total_days: number;
  }) {
    const response = await apiClient.post<HolidayEntitlement>(`${this.baseUrl}/entitlements/`, data);
    return response.data;
  }

  async updateEntitlement(id: number, data: Partial<HolidayEntitlement>) {
    const response = await apiClient.put<HolidayEntitlement>(`${this.baseUrl}/entitlements/${id}/`, data);
    return response.data;
  }

  async deleteEntitlement(id: number) {
    await apiClient.delete(`${this.baseUrl}/entitlements/${id}/`);
  }

  async getEntitlementSummary(year?: number) {
    const params = year ? { year } : undefined;
    const response = await apiClient.get<EntitlementSummary>(`${this.baseUrl}/entitlements/summary/`, { params });
    return response.data;
  }

  async getUserBalance(userId: number) {
    const response = await apiClient.get<EntitlementSummary>(`${this.baseUrl}/entitlements/balance/${userId}/`);
    return response.data;
  }

  // Public Holidays
  async getPublicHolidays() {
    const response = await apiClient.get<{ count: number; results: PublicHoliday[] }>(`${this.baseUrl}/public/`);
    return response.data;
  }

  async getUpcomingPublicHolidays() {
    const response = await apiClient.get<PublicHoliday[]>(`${this.baseUrl}/public/upcoming/`);
    return response.data;
  }

  async createPublicHoliday(data: Omit<PublicHoliday, 'id'>) {
    const response = await apiClient.post<PublicHoliday>(`${this.baseUrl}/public/`, data);
    return response.data;
  }

  async updatePublicHoliday(id: number, data: Partial<PublicHoliday>) {
    const response = await apiClient.put<PublicHoliday>(`${this.baseUrl}/public/${id}/`, data);
    return response.data;
  }

  async deletePublicHoliday(id: number) {
    await apiClient.delete(`${this.baseUrl}/public/${id}/`);
  }

  // Policies
  async getPolicies(params?: { department_id?: number | null; holiday_type_id?: number }) {
    const response = await apiClient.get<{ count: number; results: HolidayPolicy[] }>(`${this.baseUrl}/policies/`, { params });
    return response.data;
  }

  async getDepartmentPolicies(departmentId: number) {
    const response = await apiClient.get<HolidayPolicy[]>(`${this.baseUrl}/policies/department/${departmentId}/`);
    return response.data;
  }

  async createPolicy(data: Omit<HolidayPolicy, 'id'>) {
    const response = await apiClient.post<HolidayPolicy>(`${this.baseUrl}/policies/`, data);
    return response.data;
  }

  async updatePolicy(id: number, data: Partial<HolidayPolicy>) {
    const response = await apiClient.put<HolidayPolicy>(`${this.baseUrl}/policies/${id}/`, data);
    return response.data;
  }

  async deletePolicy(id: number) {
    await apiClient.delete(`${this.baseUrl}/policies/${id}/`);
  }

  async copyPolicy(policyId: number, data: { department_ids: number[] }) {
    const response = await apiClient.post<HolidayPolicy[]>(`${this.baseUrl}/policies/copy/`, {
      policy_id: policyId,
      ...data
    });
    return response.data;
  }

  // Blackout Periods
  async getBlackoutPeriods() {
    const response = await apiClient.get<{ count: number; results: BlackoutPeriod[] }>(`${this.baseUrl}/blackout-periods/`);
    return response.data;
  }

  async getActiveBlackoutPeriods() {
    const response = await apiClient.get<BlackoutPeriod[]>(`${this.baseUrl}/blackout-periods/active/`);
    return response.data;
  }

  async createBlackoutPeriod(data: Omit<BlackoutPeriod, 'id'>) {
    const response = await apiClient.post<BlackoutPeriod>(`${this.baseUrl}/blackout-periods/`, data);
    return response.data;
  }

  async updateBlackoutPeriod(id: number, data: Partial<BlackoutPeriod>) {
    const response = await apiClient.put<BlackoutPeriod>(`${this.baseUrl}/blackout-periods/${id}/`, data);
    return response.data;
  }

  async deleteBlackoutPeriod(id: number) {
    await apiClient.delete(`${this.baseUrl}/blackout-periods/${id}/`);
  }

  // Approvers
  async getApprovers() {
    const response = await apiClient.get<{ count: number; results: DepartmentApprover[] }>(`${this.baseUrl}/approvers/`);
    return response.data;
  }

  async addApprover(data: {
    department_id: number;
    approver_id: number;
    is_primary?: boolean;
    can_approve_own_department?: boolean;
    max_days_can_approve?: number;
  }) {
    const response = await apiClient.post<DepartmentApprover>(`${this.baseUrl}/approvers/`, data);
    return response.data;
  }

  async removeApprover(id: number) {
    await apiClient.delete(`${this.baseUrl}/approvers/${id}/`);
  }

  // Integration
  async checkAvailability(userIds: number[], startDate: string, endDate: string) {
    const response = await apiClient.post<AvailabilityCheck>(`${this.baseUrl}/check-availability/`, {
      user_ids: userIds,
      date_range: {
        start: startDate,
        end: endDate
      }
    });
    return response.data;
  }

  async checkJobConflicts(requestId: number) {
    const response = await apiClient.post(`${this.baseUrl}/job-conflicts/`, { request_id: requestId });
    return response.data;
  }

  async getTeamCalendar(params?: { department_id?: number; start_date?: string; end_date?: string }) {
    const response = await apiClient.get(`${this.baseUrl}/team-calendar/`, { params });
    return response.data;
  }

  // Reports
  async getDepartmentSummary(departmentId?: number, period?: string) {
    const params = { department_id: departmentId, period };
    const response = await apiClient.get<DepartmentSummary>(`${this.baseUrl}/reports/department-summary/`, { params });
    return response.data;
  }

  async getAvailabilityReport(params?: { start_date?: string; end_date?: string; department_id?: number }) {
    const response = await apiClient.get(`${this.baseUrl}/reports/availability/`, { params });
    return response.data;
  }

  async getUsageTrends(params?: { year?: number; department_id?: number }) {
    const response = await apiClient.get(`${this.baseUrl}/reports/usage-trends/`, { params });
    return response.data;
  }

  async exportHolidayData(format: 'csv' | 'excel' = 'excel') {
    const response = await apiClient.get(`${this.baseUrl}/reports/export/`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  // Helper method to get departments
  async getDepartments(): Promise<{ results: any[] }> {
    try {
      // Try the departments endpoint first
      const response = await apiClient.get('/departments/');
      return response.data;
    } catch (error) {
      try {
        // If departments endpoint doesn't exist, try to get from groups
        const groupsResponse = await apiClient.get('/users/groups/');
        const departments = groupsResponse.data.results
          .filter((group: any) => group.name.toLowerCase().includes('department') || group.is_department)
          .map((group: any) => ({
            id: group.id,
            name: group.name.replace('Department', '').trim()
          }));
        
        if (departments.length > 0) {
          return { results: departments };
        }
      } catch (groupError) {
        console.error('Failed to fetch departments from groups:', groupError);
      }
      
      // Final fallback mock data
      return {
        results: [
          { id: 1, name: 'Engineering' },
          { id: 2, name: 'Sales' },
          { id: 3, name: 'Marketing' },
          { id: 4, name: 'HR' },
          { id: 5, name: 'Finance' }
        ]
      };
    }
  }
}

export const holidayService = new HolidayService();