export interface Site {
    site_id: number;
    site_name: string;
    account: string;
    fco: string;
    fit_id: string;
    address: string;
    region: string;
    postcode: string;
    install_date: string;
    azimuth?: string;
    array_type?: string;
    pitch?: string;
    panel_size?: string;
    panel_type?: string;
    previous_meter?: string;
    meter_change_date?: string | null;
    total_generation_increase?: string;
    low_riso?: boolean;
    shading?: boolean;
    trina_project?: boolean;
    inverter_num?: string;
    inverter_install_date?: string;
    inverter_exchange_date?: string | null;
}

export interface Customer {
    id?: number;
    owner?: string;
    site_id?: number;
    loan_num?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    owner_address?: string;
}

export interface Meter {
    id?: number;
    site_id?: number;
    meter_serial?: string;
    export_meter?: boolean;
    inverter_number?: string;
    last_reading?: string;
    last_reading_date?: string;
    meter_model?: string;
    meter_type?: string;
    install_date?: string;
}

export interface MeterDetails {
    id: number;
    site_id: Site;
    meter_serial: string;
    export_meter: boolean;
    inverter_number: string;
    last_reading: string;
    last_reading_date: string;
    // Add other meter fields as needed
}

export interface SimDetails {
    id: number;
    site_id: Site;
    meter_id: MeterDetails;
    sim_serial: string;
    sim_num: string;
    ctn?: string;
    sim_ip?: string;
    assigned_date?: string;
    // Add other SIM fields as needed
}

export interface SystemNote {
    id: number;
    notes: string;
    note_date: string;
    note_author: string;
    site_name: string;
    image: string | null;
    image_description: string | null;
    is_favorite: boolean;
    site_id: number;
}

export interface SiteAlert {
    id: number;
    message: string;
    alert_type: 'info' | 'warning' | 'danger' | 'success';
    created_by: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
}

export interface MeterReading {
    id: number;
    site_id: Site;
    reading_date: string;
    reading: number;
    // Add other reading fields as needed
}

export interface ActAdditionalFields {
    id: number;
    site_id: Site;
    survey_date: string;
    survey_returned_date: string;
    home_visit_date: string;
    home_visitor_name: string;
    lightweight: boolean;
    number_of_panels: string;
    trina_project?: boolean;
}

export interface DashboardSite {
    site_id: string;
    site_name: string;
    address: string;
    postcode: string;
    fit_id: string;
    fco: string;
    region: string;
    install_date: string | null;
    panel_size: string;
}

export interface SiteData {
    site: DashboardSite;
    latest_read: string;
    last_updated: string;
    is_zero_read: boolean;
    is_old_reading: boolean;
    meter_serial: string;
}

export interface Pagination {
    current_page: number;
    num_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

export interface DashboardResponse {
    filtered_sites: SiteData[];
    total_reads: number;
    no_comms: number;
    zero_reads: number;
    current_filter: 'all' | 'no_comms' | 'zero_reads';
    pagination: Pagination;
    metrics_last_updated: string | null;
}

// Add interface for paginated response from API
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// New type definitions for API responses
export interface ApiSite {
    site_id: number;
    site_name: string;
    address: string;
    postcode: string;
    region: string;
    install_date: string;
    fit_id: string;
    fco: string;
}

export interface ApiCustomer {
    loan_num: string;
    owner?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    owner_address?: string;
}

export interface ApiMeter {
    inverter_number: string;
    last_reading: string;
    last_reading_date: string;
    meter_model?: string;
    meter_type?: string;
    meter_serial?: string;
}

export interface ApiSiteDetailResponse {
    site: ApiSite;
    customer?: ApiCustomer;
    meter?: ApiMeter;
}

export interface ApiSiteSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ApiSite[];
}

export interface MeterTest {
    id: number;
    site_id: number;
    meter_model: string;
    test_reading: string;
    test_date: string;
    signal_level?: string;
    operator?: string;
    status?: number;
    cs_attachment?: number;
    ps_status?: number;
    cell_id?: number;
    location_id?: number;
    ber?: number;
    mcc?: number;
    mnc?: number;
    channel?: number;
    neighboring_cells?: Record<string, string | number>;
    capture_time?: string;
}

export interface MonitoringAlert {
    id: number;
    message: string;
    level: 'info' | 'warning' | 'error';
    created_at: string;
}

export interface MonitoringLog {
    id: number;
    message: string;
    level: 'info' | 'warning' | 'error';
    created_at: string;
}

export interface SiteDetailResponse {
    site: Site;
    customer: Customer | null;
    meters: Meter[];
    active_meter: Meter | null;
    sim: SimDetails | null;
    readings: {
        date: string;
        meter_reading: string | number;
        meter_serial: string | null;
        generation_increase: string | number | null;
    }[];
    notes: SystemNote[];
    notes_count: number;
    active_alerts: SiteAlert[];
    meter_history: {
        old_meter: string;
        new_meter: string;
        change_date: string;
        closing_reading: string | number;
        new_meter_opening_reading: string | number;
    }[];
    meter_tests: MeterTest[];
    monitoring: {
        enabled: boolean;
        last_ping: string | null;
        alerts: MonitoringAlert[];
        logs: MonitoringLog[];
    };
    last_reading: {
        reading: string | number;
        date: string | null;
    };
    act_additional_fields: ActAdditionalFields | null;
    pagination: {
        current_page: number;
        has_more: boolean;
        start_date: string;
        end_date: string;
    };
}

// Report Builder Types
export interface DatabaseColumn {
    id: string;
    name: string;
    type: string;
    description?: string;
    table_name: string;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
    is_nullable?: boolean;
    related_table?: string;
    related_model?: string;
    supports_aggregation?: boolean;
    supported_functions?: string[];
}

export interface DatabaseTable {
    id: string;
    name: string;
    description?: string;
    columns: DatabaseColumn[];
    app?: string;
    record_count?: number;
}

export interface ReportFilter {
    id: string | number;
    column: string;
    operator: string;
    value: string;
}

export interface ReportDateRange {
    startDate: string | null;
    endDate: string | null;
}

export interface ReportQueryParams {
    tables: string[];
    columns: string[];
    filters: ReportFilter[];
    dateRange?: ReportDateRange;
    page?: number;
    pageSize?: number;
}

export interface ReportQueryResult {
    results: Record<string, string | number | boolean | null>[];
    count: number;
    columns?: string[];
    valid_columns?: string[];
    column_aliases?: Record<string, string>;
}

// Enhanced Report Builder Types
export interface AggregationConfig {
    function: 'SUM' | 'AVG' | 'COUNT' | 'COUNT_DISTINCT' | 'MIN' | 'MAX';
    column: string;
    alias?: string;
}

export interface ReportTemplate {
    id: number;
    name: string;
    description: string;
    tables: string[];
    columns: string[];
    aggregations: AggregationConfig[];
    groupBy: string[];
    filters: ReportFilter[];
    dateRange: ReportDateRange;
    orderBy: Array<{ column: string; direction: 'ASC' | 'DESC' }>;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_run: string | null;
    run_count: number;
    is_public: boolean;
    is_owner?: boolean;
}
