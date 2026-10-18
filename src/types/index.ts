/**
 * Gulf Taxis Dispatch Cloud - Type Definitions
 */

export type UserRole = 'ADMINISTRATOR' | 'DISPATCHER' | 'BOOKING_AGENT';

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Assigned'
  | 'Driver En Route'
  | 'Arrived'
  | 'Passenger Picked Up'
  | 'Completed'
  | 'Cancelled'
  | 'No Show';

export type VehicleType =
  | 'Sedan'
  | 'Business Sedan'
  | 'SUV'
  | 'GMC'
  | 'Minivan'
  | 'Van'
  | 'Coaster'
  | 'Bus';

export type DriverAvailability = 'on_duty' | 'off_duty' | 'on_trip';
export type VehicleAvailability = 'available' | 'in_use' | 'maintenance';

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  status: 'active' | 'inactive';
  last_login_at?: string;
  created_at: string;
}

export interface Driver {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  whatsapp?: string;
  license_no?: string;
  status: 'active' | 'inactive';
  availability: DriverAvailability;
  rating: number;
  notes?: string;
  today_active_trips?: number;
  assigned_vehicle_reg?: string;
  assigned_vehicle_model?: string;
  created_at: string;
}

export interface Vehicle {
  id: number;
  uuid: string;
  registration_no: string;
  make_model: string;
  vehicle_type: VehicleType;
  passenger_capacity: number;
  luggage_capacity: number;
  availability: VehicleAvailability;
  assigned_driver_id?: number | null;
  assigned_driver_name?: string;
  assigned_driver_phone?: string;
  maintenance_notes?: string;
  created_at: string;
}

export interface Booking {
  id: number;
  uuid: string;
  booking_ref: string;
  pickup_date: string; // YYYY-MM-DD
  pickup_time: string; // HH:MM 24hr
  passenger_name: string;
  passenger_phone: string;
  passenger_whatsapp?: string;
  passenger_email?: string;
  flight_number?: string;
  airline_terminal?: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_count: number;
  luggage_count: number;
  vehicle_type: VehicleType;
  assigned_driver_id?: number | null;
  assigned_vehicle_id?: number | null;
  driver_name?: string;
  driver_phone?: string;
  vehicle_registration?: string;
  vehicle_model?: string;
  booking_source: string;
  customer_notes?: string;
  driver_instructions?: string;
  status: BookingStatus;
  internal_remarks?: string;
  created_by_user_id?: number;
  created_by_name?: string;
  last_updated_by_user_id?: number;
  last_updated_by_name?: string;
  version: number;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface AssignmentHistory {
  id: number;
  booking_id: number;
  driver_id: number;
  driver_name: string;
  vehicle_id?: number;
  assigned_by_user_id?: number;
  assigned_by_name?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  full_name?: string;
  role?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  ip_address?: string;
  details_json?: string;
  created_at: string;
}

export interface DailyReportSummary {
  date: string;
  summary: {
    total_today: number;
    pending_count: number;
    assigned_count: number;
    unassigned_count: number;
    in_progress_count: number;
    completed_count: number;
    cancelled_count: number;
    airport_pickups_count: number;
    drivers_on_duty: number;
  };
  vehicle_breakdown: { vehicle_type: VehicleType; count: number }[];
  hourly_pickups: { pickup_hour: number; count: number }[];
}

export interface BackupItem {
  filename: string;
  size_bytes: number;
  size_formatted: string;
  created_at: string;
  status: string;
}
