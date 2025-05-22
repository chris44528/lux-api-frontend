// User related interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active?: boolean;
  groups: UserGroup[];
  last_login?: string;
  date_joined?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  user: number;
  avatar?: string;
  phone_number?: string;
  department?: string;
  job_title?: string;
  is_approved: boolean;
}

export interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  is_active?: boolean;
  groups?: number[];
}

// Group related interfaces
export interface UserGroup {
  id: number;
  name: string;
  description?: string;
  users?: User[];
}

// Access control related interfaces
export interface GroupAccess {
  id: number;
  group: number;
  resource_type: string;
  resource_id: number;
  access_level: string;
  created_at: string;
  updated_at: string;
}

// Permission related interfaces
export interface Permission {
  id: number;
  codename: string;
  name: string;
  content_type: number;
}

export interface GroupPermission {
  id: number;
  group: number;
  permission: number;
}

// Generic paginated response interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} 