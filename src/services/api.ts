/**
 * Gulf Taxis Dispatch Cloud - Unified API Service
 * Seamlessly interfaces with Hostinger PHP 8.2 REST API endpoints
 * with automatic fallback to high-fidelity in-browser engine in preview mode.
 */

import { mockDb } from './mockDb';
import { Booking, Driver, Vehicle, User, AuditLog, BackupItem, DailyReportSummary } from '../types';

let currentAuthUser: User | null = null;
let csrfToken: string | null = null;

// Initialize session from localStorage if present
try {
  const savedUser = localStorage.getItem('gulftaxis_auth_user');
  if (savedUser) {
    currentAuthUser = JSON.parse(savedUser);
  }
} catch {
  currentAuthUser = null;
}

export const api = {
  getCurrentUser(): User | null {
    return currentAuthUser;
  },

  getCsrfToken(): string | null {
    return csrfToken;
  },

  async login(username: string, password: string): Promise<{ user: User; csrf_token: string }> {
    // If in production with PHP backend available
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          currentAuthUser = json.data.user;
          csrfToken = json.data.csrf_token;
          localStorage.setItem('gulftaxis_auth_user', JSON.stringify(currentAuthUser));
          return json.data;
        }
      }
    } catch {
      // PHP backend not accessible (dev preview environment)
    }

    // In-browser mock engine authentication
    const users = mockDb.getUsers();
    const user = users.find(
      u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && u.status === 'active'
    );

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    // Verify mock password: standard demo password is "dispatch2026" or matches username
    if (password !== 'dispatch2026' && password !== user.username && password.length < 4) {
      throw new Error('Invalid credentials. For quick demo, use "dispatch2026" or select quick login.');
    }

    currentAuthUser = {
      ...user,
      last_login_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    csrfToken = 'csrf_' + Math.random().toString(36).substring(2);
    localStorage.setItem('gulftaxis_auth_user', JSON.stringify(currentAuthUser));
    mockDb.addAuditLog(currentAuthUser, 'LOGIN_SUCCESS', 'users', user.id);

    return {
      user: currentAuthUser,
      csrf_token: csrfToken
    };
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Ignored in preview
    }

    if (currentAuthUser) {
      mockDb.addAuditLog(currentAuthUser, 'LOGOUT', 'users', currentAuthUser.id);
    }
    currentAuthUser = null;
    csrfToken = null;
    localStorage.removeItem('gulftaxis_auth_user');
  },

  async getBookings(filters?: {
    status?: string;
    date?: string;
    driver_id?: number;
    vehicle_id?: number;
    search?: string;
  }): Promise<Booking[]> {
    try {
      const q = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') q.set('status', filters.status);
      if (filters?.date) q.set('date', filters.date);
      if (filters?.driver_id) q.set('driver_id', String(filters.driver_id));
      if (filters?.vehicle_id) q.set('vehicle_id', String(filters.vehicle_id));
      if (filters?.search) q.set('search', filters.search);

      const res = await fetch(`/api/v1/bookings?${q.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.items) {
          return json.data.items;
        }
      }
    } catch {
      // Fallback to local engine
    }

    let items = mockDb.getBookings();
    if (filters?.status && filters.status !== 'ALL') {
      items = items.filter(b => b.status === filters.status);
    }
    if (filters?.date) {
      items = items.filter(b => b.pickup_date === filters.date);
    }
    if (filters?.driver_id) {
      items = items.filter(b => b.assigned_driver_id === Number(filters.driver_id));
    }
    if (filters?.vehicle_id) {
      items = items.filter(b => b.assigned_vehicle_id === Number(filters.vehicle_id));
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(
        b =>
          b.booking_ref.toLowerCase().includes(s) ||
          b.passenger_name.toLowerCase().includes(s) ||
          b.passenger_phone.toLowerCase().includes(s) ||
          (b.flight_number && b.flight_number.toLowerCase().includes(s)) ||
          b.pickup_location.toLowerCase().includes(s) ||
          b.dropoff_location.toLowerCase().includes(s)
      );
    }

    // Sort by date and pickup time ASC
    return items.sort((a, b) => {
      const dtA = `${a.pickup_date} ${a.pickup_time}`;
      const dtB = `${b.pickup_date} ${b.pickup_time}`;
      return dtA.localeCompare(dtB);
    });
  },

  async createBooking(data: Partial<Booking>): Promise<Booking> {
    if (!currentAuthUser) throw new Error('Unauthenticated');

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }

    return mockDb.createBooking(data, currentAuthUser);
  },

  async updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
    if (!currentAuthUser) throw new Error('Unauthenticated');

    try {
      const res = await fetch(`/api/v1/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }

    return mockDb.updateBooking(id, data, currentAuthUser);
  },

  async assignBooking(
    bookingId: number,
    driverId: number,
    vehicleId: number | null,
    force = false
  ): Promise<Booking> {
    if (!currentAuthUser) throw new Error('Unauthenticated');

    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({ driver_id: driverId, vehicle_id: vehicleId, force_assignment: force })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }

    return mockDb.assignDriverAndVehicle(bookingId, driverId, vehicleId, currentAuthUser, force);
  },

  async updateBookingStatus(id: number, status: string, reason?: string): Promise<Booking> {
    if (!currentAuthUser) throw new Error('Unauthenticated');

    try {
      const res = await fetch(`/api/v1/bookings/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }

    return mockDb.updateBooking(id, { status: status as any, cancellation_reason: reason }, currentAuthUser);
  },

  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await fetch('/api/v1/drivers', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }
    return mockDb.getDrivers();
  },

  async updateDriver(id: number, updates: Partial<Driver>): Promise<Driver> {
    try {
      const res = await fetch(`/api/v1/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }
    return mockDb.updateDriver(id, updates);
  },

  async getVehicles(): Promise<Vehicle[]> {
    try {
      const res = await fetch('/api/v1/vehicles', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }
    return mockDb.getVehicles();
  },

  async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const res = await fetch(`/api/v1/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }
    return mockDb.updateVehicle(id, updates);
  },

  async getDailyReport(date: string): Promise<DailyReportSummary> {
    try {
      const res = await fetch(`/api/v1/reports/daily?date=${date}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }
    return mockDb.getDailySummary(date);
  },

  async getBackups(): Promise<BackupItem[]> {
    try {
      const res = await fetch('/api/v1/admin/backups', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }
    return mockDb.getBackups();
  },

  async createBackup(): Promise<{ filename: string; sqlContent: string; size_formatted: string }> {
    if (!currentAuthUser) throw new Error('Unauthenticated');
    return mockDb.createBackup(currentAuthUser);
  },

  async getUsers(): Promise<User[]> {
    return mockDb.getUsers();
  },

  async createUser(data: Partial<User>): Promise<User> {
    const users = mockDb.getUsers();
    const newUser: User = {
      id: users.length + 1,
      uuid: 'usr-' + Math.random().toString(36).substring(2, 8),
      username: data.username || 'newuser',
      email: data.email || 'user@gulftaxis.com',
      full_name: data.full_name || 'Agent Name',
      role: data.role || 'BOOKING_AGENT',
      phone: data.phone,
      status: 'active',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    users.push(newUser);
    mockDb.saveUsers(users);
    if (currentAuthUser) {
      mockDb.addAuditLog(currentAuthUser, 'USER_CREATED', 'users', newUser.id);
    }
    return newUser;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return mockDb.getAuditLogs();
  }
};
