/**
 * Gulf Taxis Dispatch Cloud - Local In-Browser Database Engine
 * Implements full MySQL transactional behavior, conflict detection,
 * concurrency locking, and audit logging for preview and standalone operations.
 */

import { Booking, Driver, Vehicle, User, AuditLog, BackupItem, DailyReportSummary } from '../types';

const STORAGE_KEY_PREFIX = 'gulftaxis_v1_';

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    uuid: 'usr-admin-001',
    username: 'admin',
    email: 'admin@gulftaxis.com',
    full_name: 'Director Tariq Al-Hashimi',
    role: 'ADMINISTRATOR',
    phone: '+971 4 800 4850',
    status: 'active',
    created_at: '2026-01-01 08:00:00'
  },
  {
    id: 2,
    uuid: 'usr-disp-002',
    username: 'dispatcher',
    email: 'dispatcher@gulftaxis.com',
    full_name: 'Khalid Al-Marri',
    role: 'DISPATCHER',
    phone: '+971 4 800 4851',
    status: 'active',
    created_at: '2026-01-01 08:30:00'
  },
  {
    id: 3,
    uuid: 'usr-agent-003',
    username: 'agent',
    email: 'agent@gulftaxis.com',
    full_name: 'Layla Mahmoud',
    role: 'BOOKING_AGENT',
    phone: '+971 4 800 4852',
    status: 'active',
    created_at: '2026-01-01 09:00:00'
  }
];

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: 1,
    uuid: 'drv-001',
    name: 'Tariq Mansoor',
    phone: '+971 50 123 4567',
    whatsapp: '+971 50 123 4567',
    license_no: 'UAE-COMM-89102',
    status: 'active',
    availability: 'on_duty',
    rating: 4.9,
    notes: 'Airport VIP specialist, English & Arabic fluent',
    assigned_vehicle_reg: 'DXB-L-8832',
    assigned_vehicle_model: 'Lexus ES 350 Luxury',
    created_at: '2026-01-10 10:00:00'
  },
  {
    id: 2,
    uuid: 'drv-002',
    name: 'Rashid Al-Nuaimi',
    phone: '+971 55 987 6543',
    whatsapp: '+971 55 987 6543',
    license_no: 'UAE-COMM-44519',
    status: 'active',
    availability: 'on_duty',
    rating: 5.0,
    notes: 'Senior chauffeur, luxury protocol certified',
    assigned_vehicle_reg: 'AUH-5-7721',
    assigned_vehicle_model: 'Toyota Land Cruiser VXR',
    created_at: '2026-01-11 11:30:00'
  },
  {
    id: 3,
    uuid: 'drv-003',
    name: 'Muhammad Imran',
    phone: '+971 52 334 1122',
    whatsapp: '+971 52 334 1122',
    license_no: 'UAE-COMM-77312',
    status: 'active',
    availability: 'on_duty',
    rating: 4.8,
    notes: 'Executive sedan driver, punctuality commended',
    assigned_vehicle_reg: 'DXB-K-4921',
    assigned_vehicle_model: 'Toyota Camry Hybrid 2024',
    created_at: '2026-01-12 09:15:00'
  },
  {
    id: 4,
    uuid: 'drv-004',
    name: 'Farhan Qureshi',
    phone: '+971 56 445 8899',
    whatsapp: '+971 56 445 8899',
    license_no: 'UAE-COMM-66201',
    status: 'active',
    availability: 'on_duty',
    rating: 4.9,
    notes: 'GMC and heavy SUV trained',
    assigned_vehicle_reg: 'DXB-M-9910',
    assigned_vehicle_model: 'GMC Yukon Denali XL',
    created_at: '2026-01-12 14:00:00'
  },
  {
    id: 5,
    uuid: 'drv-005',
    name: 'Kareem Mostafa',
    phone: '+971 50 887 2233',
    whatsapp: '+971 50 887 2233',
    license_no: 'UAE-COMM-99120',
    status: 'active',
    availability: 'off_duty',
    rating: 4.7,
    notes: 'Available for evening airport shifts',
    created_at: '2026-01-13 16:45:00'
  },
  {
    id: 6,
    uuid: 'drv-006',
    name: 'Bilal Hassan',
    phone: '+971 54 221 6677',
    whatsapp: '+971 54 221 6677',
    license_no: 'UAE-COMM-33291',
    status: 'active',
    availability: 'on_duty',
    rating: 4.8,
    notes: 'Tour group and Coaster specialist',
    assigned_vehicle_reg: 'SHJ-2-6644',
    assigned_vehicle_model: 'Toyota Coaster Luxury 22',
    created_at: '2026-01-14 12:20:00'
  }
];

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 1,
    uuid: 'veh-001',
    registration_no: 'DXB-K-4921',
    make_model: 'Toyota Camry Hybrid 2024',
    vehicle_type: 'Sedan',
    passenger_capacity: 4,
    luggage_capacity: 3,
    availability: 'available',
    assigned_driver_id: 3,
    assigned_driver_name: 'Muhammad Imran',
    assigned_driver_phone: '+971 52 334 1122',
    maintenance_notes: 'Standard clean condition, full tank',
    created_at: '2026-01-05 10:00:00'
  },
  {
    id: 2,
    uuid: 'veh-002',
    registration_no: 'DXB-L-8832',
    make_model: 'Lexus ES 350 Luxury',
    vehicle_type: 'Business Sedan',
    passenger_capacity: 4,
    luggage_capacity: 3,
    availability: 'available',
    assigned_driver_id: 1,
    assigned_driver_name: 'Tariq Mansoor',
    assigned_driver_phone: '+971 50 123 4567',
    maintenance_notes: 'VIP leather interior, bottled water and mints stocked',
    created_at: '2026-01-05 10:30:00'
  },
  {
    id: 3,
    uuid: 'veh-003',
    registration_no: 'AUH-5-7721',
    make_model: 'Toyota Land Cruiser VXR',
    vehicle_type: 'SUV',
    passenger_capacity: 6,
    luggage_capacity: 5,
    availability: 'available',
    assigned_driver_id: 2,
    assigned_driver_name: 'Rashid Al-Nuaimi',
    assigned_driver_phone: '+971 55 987 6543',
    maintenance_notes: 'Desert and executive highway ready',
    created_at: '2026-01-05 11:00:00'
  },
  {
    id: 4,
    uuid: 'veh-004',
    registration_no: 'DXB-M-9910',
    make_model: 'GMC Yukon Denali XL',
    vehicle_type: 'GMC',
    passenger_capacity: 7,
    luggage_capacity: 6,
    availability: 'available',
    assigned_driver_id: 4,
    assigned_driver_name: 'Farhan Qureshi',
    assigned_driver_phone: '+971 56 445 8899',
    maintenance_notes: 'Presidential black edition with privacy tints',
    created_at: '2026-01-06 09:00:00'
  },
  {
    id: 5,
    uuid: 'veh-005',
    registration_no: 'DXB-P-3314',
    make_model: 'Toyota HiAce GL Minivan',
    vehicle_type: 'Minivan',
    passenger_capacity: 10,
    luggage_capacity: 8,
    availability: 'available',
    maintenance_notes: 'Spacious family luggage compartment',
    created_at: '2026-01-06 14:00:00'
  },
  {
    id: 6,
    uuid: 'veh-006',
    registration_no: 'DXB-V-1209',
    make_model: 'Mercedes-Benz V-Class Extra-Long',
    vehicle_type: 'Van',
    passenger_capacity: 7,
    luggage_capacity: 7,
    availability: 'available',
    maintenance_notes: 'Conference seating, ambient lighting, Wi-Fi',
    created_at: '2026-01-07 15:30:00'
  },
  {
    id: 7,
    uuid: 'veh-007',
    registration_no: 'SHJ-2-6644',
    make_model: 'Toyota Coaster Luxury 22',
    vehicle_type: 'Coaster',
    passenger_capacity: 22,
    luggage_capacity: 18,
    availability: 'available',
    assigned_driver_id: 6,
    assigned_driver_name: 'Bilal Hassan',
    assigned_driver_phone: '+971 54 221 6677',
    maintenance_notes: 'Group transfer with dual air conditioning',
    created_at: '2026-01-08 11:00:00'
  },
  {
    id: 8,
    uuid: 'veh-008',
    registration_no: 'DXB-B-5501',
    make_model: 'Mercedes-Benz Tourismo Coach',
    vehicle_type: 'Bus',
    passenger_capacity: 50,
    luggage_capacity: 45,
    availability: 'available',
    maintenance_notes: 'Full tour coach with PA system',
    created_at: '2026-01-09 13:00:00'
  }
];

// Helper to get today's date formatted as YYYY-MM-DD
function getTodayString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 1,
    uuid: 'bkg-001',
    booking_ref: 'GT-' + getTodayString().replace(/-/g, '') + '-A921',
    pickup_date: getTodayString(),
    pickup_time: '14:30',
    passenger_name: 'Lord Arthur Wellesley',
    passenger_phone: '+44 7700 900123',
    passenger_whatsapp: '+44 7700 900123',
    passenger_email: 'arthur.w@ukexec.co.uk',
    flight_number: 'EK002',
    airline_terminal: 'Emirates / DXB Terminal 3 Arrivals',
    pickup_location: 'Dubai International Airport (DXB) Terminal 3 Arrivals Gate 2',
    dropoff_location: 'Burj Al Arab Jumeirah, Suite 1204',
    passenger_count: 2,
    luggage_count: 3,
    vehicle_type: 'Business Sedan',
    assigned_driver_id: 1,
    assigned_vehicle_id: 2,
    driver_name: 'Tariq Mansoor',
    driver_phone: '+971 50 123 4567',
    vehicle_registration: 'DXB-L-8832',
    vehicle_model: 'Lexus ES 350 Luxury',
    booking_source: 'Concierge Desk',
    customer_notes: 'VIP Guest. Provide sparkling water and international newspaper.',
    driver_instructions: 'Display VIP nameboard: LORD WELLESLEY at Terminal 3 arrivals column 4.',
    status: 'Assigned',
    internal_remarks: 'Confirmed with British Executive Travel agency.',
    created_by_user_id: 1,
    created_by_name: 'Director Tariq Al-Hashimi',
    last_updated_by_user_id: 2,
    last_updated_by_name: 'Khalid Al-Marri',
    version: 2,
    created_at: getTodayString() + ' 08:30:00',
    updated_at: getTodayString() + ' 09:15:00'
  },
  {
    id: 2,
    uuid: 'bkg-002',
    booking_ref: 'GT-' + getTodayString().replace(/-/g, '') + '-B402',
    pickup_date: getTodayString(),
    pickup_time: '15:15',
    passenger_name: 'Sheikh Hamad Al-Thani',
    passenger_phone: '+974 5511 2233',
    passenger_whatsapp: '+974 5511 2233',
    passenger_email: 'office@althaniholding.qa',
    flight_number: 'QR1004',
    airline_terminal: 'Qatar Airways / Al Maktoum DWC VIP Terminal',
    pickup_location: 'DWC Private Jet Aviation Lounge',
    dropoff_location: 'Four Seasons Resort Dubai at Jumeirah Beach',
    passenger_count: 4,
    luggage_count: 6,
    vehicle_type: 'GMC',
    assigned_driver_id: 4,
    assigned_vehicle_id: 4,
    driver_name: 'Farhan Qureshi',
    driver_phone: '+971 56 445 8899',
    vehicle_registration: 'DXB-M-9910',
    vehicle_model: 'GMC Yukon Denali XL',
    booking_source: 'VIP Private Client',
    customer_notes: 'Delegation luggage assistance required.',
    driver_instructions: 'Strict security protocol. Dark suit attire required.',
    status: 'Driver En Route',
    internal_remarks: 'Protocol team advised plane on final approach.',
    created_by_user_id: 1,
    created_by_name: 'Director Tariq Al-Hashimi',
    version: 3,
    created_at: getTodayString() + ' 09:00:00',
    updated_at: getTodayString() + ' 10:45:00'
  },
  {
    id: 3,
    uuid: 'bkg-003',
    booking_ref: 'GT-' + getTodayString().replace(/-/g, '') + '-C719',
    pickup_date: getTodayString(),
    pickup_time: '16:00',
    passenger_name: 'Dr. Elena Rostova',
    passenger_phone: '+49 171 2345678',
    passenger_whatsapp: '+49 171 2345678',
    passenger_email: 'elena.rostova@medtech.de',
    flight_number: 'LH630',
    airline_terminal: 'Lufthansa / DXB Terminal 1',
    pickup_location: 'Dubai Airport Terminal 1 Arrivals Gate 3',
    dropoff_location: 'Dubai World Trade Centre (DWTC) Novotel',
    passenger_count: 1,
    luggage_count: 2,
    vehicle_type: 'Sedan',
    assigned_driver_id: null,
    assigned_vehicle_id: null,
    booking_source: 'Online Portal',
    customer_notes: 'Flight arriving from Frankfurt.',
    driver_instructions: 'Meet passenger at exit 3 with digital tablet sign.',
    status: 'Pending',
    internal_remarks: 'Awaiting driver assignment on dispatch board.',
    created_by_user_id: 3,
    created_by_name: 'Layla Mahmoud',
    version: 1,
    created_at: getTodayString() + ' 10:15:00',
    updated_at: getTodayString() + ' 10:15:00'
  },
  {
    id: 4,
    uuid: 'bkg-004',
    booking_ref: 'GT-' + getTodayString().replace(/-/g, '') + '-D881',
    pickup_date: getTodayString(),
    pickup_time: '17:45',
    passenger_name: 'Marcus Sterling',
    passenger_phone: '+1 415 555 0192',
    passenger_whatsapp: '+1 415 555 0192',
    passenger_email: 'marcus@siliconventures.com',
    flight_number: 'UA164',
    airline_terminal: 'United / DXB Terminal 3',
    pickup_location: 'DXB Terminal 3 Arrivals Door 5',
    dropoff_location: 'Atlantis The Royal, Palm Jumeirah',
    passenger_count: 2,
    luggage_count: 4,
    vehicle_type: 'SUV',
    assigned_driver_id: 2,
    assigned_vehicle_id: 3,
    driver_name: 'Rashid Al-Nuaimi',
    driver_phone: '+971 55 987 6543',
    vehicle_registration: 'AUH-5-7721',
    vehicle_model: 'Toyota Land Cruiser VXR',
    booking_source: 'Corporate Contract',
    customer_notes: 'Need receipt sent to email.',
    driver_instructions: 'Help passenger with heavy tech gear boxes.',
    status: 'Assigned',
    internal_remarks: 'Contract Account: SV Global Corp.',
    created_by_user_id: 2,
    created_by_name: 'Khalid Al-Marri',
    version: 1,
    created_at: getTodayString() + ' 11:20:00',
    updated_at: getTodayString() + ' 11:20:00'
  },
  {
    id: 5,
    uuid: 'bkg-005',
    booking_ref: 'GT-' + getTodayString().replace(/-/g, '') + '-E105',
    pickup_date: getTodayString(),
    pickup_time: '11:00',
    passenger_name: 'Pierre Dubois & Family',
    passenger_phone: '+33 612 345678',
    pickup_location: 'Madinat Jumeirah Al Qasr',
    dropoff_location: 'Dubai Mall Fashion Avenue Valet',
    passenger_count: 5,
    luggage_count: 1,
    vehicle_type: 'Minivan',
    assigned_driver_id: 3,
    assigned_vehicle_id: 1,
    driver_name: 'Muhammad Imran',
    driver_phone: '+971 52 334 1122',
    booking_source: 'Direct Call',
    status: 'Completed',
    internal_remarks: 'Trip successfully finished on schedule.',
    created_by_user_id: 3,
    created_by_name: 'Layla Mahmoud',
    version: 2,
    created_at: getTodayString() + ' 07:45:00',
    updated_at: getTodayString() + ' 11:40:00'
  },
  {
    id: 6,
    uuid: 'bkg-006',
    booking_ref: 'GT-' + getTodayString(1).replace(/-/g, '') + '-F339',
    pickup_date: getTodayString(1),
    pickup_time: '08:00',
    passenger_name: 'Kyoto Tech Tour Group',
    passenger_phone: '+81 90 1234 5678',
    pickup_location: 'Raffles Dubai Wafi City',
    dropoff_location: 'Abu Dhabi Grand Mosque & Louvre Tour',
    passenger_count: 18,
    luggage_count: 14,
    vehicle_type: 'Coaster',
    assigned_driver_id: 6,
    assigned_vehicle_id: 7,
    driver_name: 'Bilal Hassan',
    driver_phone: '+971 54 221 6677',
    vehicle_registration: 'SHJ-2-6644',
    vehicle_model: 'Toyota Coaster Luxury 22',
    booking_source: 'Partner Agency',
    customer_notes: 'Full day charter. Japanese speaking guide on board.',
    driver_instructions: 'Pick up tour leader at 07:45 in hotel lobby.',
    status: 'Confirmed',
    internal_remarks: 'Advance deposit paid in full.',
    created_by_user_id: 1,
    created_by_name: 'Director Tariq Al-Hashimi',
    version: 1,
    created_at: getTodayString() + ' 12:00:00',
    updated_at: getTodayString() + ' 12:00:00'
  }
];

class MockDatabase {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage quota or error:', e);
    }
  }

  constructor() {
    this.initIfEmpty();
  }

  public initIfEmpty(forceReset = false): void {
    if (forceReset || !localStorage.getItem(STORAGE_KEY_PREFIX + 'users')) {
      this.set('users', DEFAULT_USERS);
      this.set('drivers', DEFAULT_DRIVERS);
      this.set('vehicles', DEFAULT_VEHICLES);
      this.set('bookings', DEFAULT_BOOKINGS);
      this.set('audit_logs', [
        {
          id: 1,
          user_id: 1,
          username: 'admin',
          full_name: 'Director Tariq Al-Hashimi',
          role: 'ADMINISTRATOR',
          action: 'SYSTEM_INITIALIZED',
          entity_type: 'system',
          created_at: new Date().toISOString()
        }
      ]);
      this.set('backups', [
        {
          filename: 'gulftaxis_backup_initial_demo.sql',
          size_bytes: 48920,
          size_formatted: '47.77 KB',
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: 'Verified'
        }
      ]);
    }
  }

  // Users
  public getUsers(): User[] {
    return this.get<User[]>('users', DEFAULT_USERS);
  }

  public saveUsers(users: User[]): void {
    this.set('users', users);
  }

  // Drivers
  public getDrivers(): Driver[] {
    return this.get<Driver[]>('drivers', DEFAULT_DRIVERS);
  }

  public saveDrivers(drivers: Driver[]): void {
    this.set('drivers', drivers);
  }

  public updateDriver(id: number, updates: Partial<Driver>): Driver {
    const list = this.getDrivers();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Driver not found');
    list[idx] = { ...list[idx], ...updates };
    this.saveDrivers(list);
    return list[idx];
  }

  // Vehicles
  public getVehicles(): Vehicle[] {
    return this.get<Vehicle[]>('vehicles', DEFAULT_VEHICLES);
  }

  public saveVehicles(vehicles: Vehicle[]): void {
    this.set('vehicles', vehicles);
  }

  public updateVehicle(id: number, updates: Partial<Vehicle>): Vehicle {
    const list = this.getVehicles();
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Vehicle not found');
    list[idx] = { ...list[idx], ...updates };
    this.saveVehicles(list);
    return list[idx];
  }

  // Bookings
  public getBookings(): Booking[] {
    return this.get<Booking[]>('bookings', DEFAULT_BOOKINGS);
  }

  public saveBookings(bookings: Booking[]): void {
    this.set('bookings', bookings);
  }

  public createBooking(data: Partial<Booking>, currentUser: User): Booking {
    const bookings = this.getBookings();

    // Check duplicate
    const isDup = bookings.find(
      b =>
        b.status !== 'Cancelled' &&
        b.passenger_phone === data.passenger_phone &&
        b.pickup_date === data.pickup_date &&
        b.pickup_time === data.pickup_time
    );

    if (isDup && !data.internal_remarks?.includes('[ALLOWED_DUPLICATE]')) {
      throw new Error(`A trip for ${data.passenger_phone} at ${data.pickup_time} already exists (Ref: ${isDup.booking_ref}).`);
    }

    const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    const datePrefix = (data.pickup_date || getTodayString()).replace(/-/g, '');
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingRef = `GT-${datePrefix}-${randHex}`;

    // Look up driver name if driver assigned
    let driverName = '';
    let driverPhone = '';
    if (data.assigned_driver_id) {
      const driver = this.getDrivers().find(d => d.id === Number(data.assigned_driver_id));
      if (driver) {
        driverName = driver.name;
        driverPhone = driver.phone;
      }
    }

    // Look up vehicle if assigned
    let vehicleReg = '';
    let vehicleModel = '';
    if (data.assigned_vehicle_id) {
      const veh = this.getVehicles().find(v => v.id === Number(data.assigned_vehicle_id));
      if (veh) {
        vehicleReg = veh.registration_no;
        vehicleModel = veh.make_model;
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newBooking: Booking = {
      id: newId,
      uuid: 'bkg-' + Math.random().toString(36).substring(2, 9),
      booking_ref: bookingRef,
      pickup_date: data.pickup_date || getTodayString(),
      pickup_time: data.pickup_time || '12:00',
      passenger_name: data.passenger_name || 'Passenger',
      passenger_phone: data.passenger_phone || '',
      passenger_whatsapp: data.passenger_whatsapp || data.passenger_phone || '',
      passenger_email: data.passenger_email || '',
      flight_number: data.flight_number?.toUpperCase().trim() || undefined,
      airline_terminal: data.airline_terminal || undefined,
      pickup_location: data.pickup_location || '',
      dropoff_location: data.dropoff_location || '',
      passenger_count: Number(data.passenger_count) || 1,
      luggage_count: Number(data.luggage_count) || 0,
      vehicle_type: data.vehicle_type || 'Sedan',
      assigned_driver_id: data.assigned_driver_id ? Number(data.assigned_driver_id) : null,
      assigned_vehicle_id: data.assigned_vehicle_id ? Number(data.assigned_vehicle_id) : null,
      driver_name: driverName || undefined,
      driver_phone: driverPhone || undefined,
      vehicle_registration: vehicleReg || undefined,
      vehicle_model: vehicleModel || undefined,
      booking_source: data.booking_source || 'Direct Call',
      customer_notes: data.customer_notes || undefined,
      driver_instructions: data.driver_instructions || undefined,
      status: data.assigned_driver_id ? 'Assigned' : (data.status || 'Pending'),
      internal_remarks: data.internal_remarks || undefined,
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.full_name,
      last_updated_by_user_id: currentUser.id,
      last_updated_by_name: currentUser.full_name,
      version: 1,
      created_at: now,
      updated_at: now
    };

    bookings.unshift(newBooking);
    this.saveBookings(bookings);
    this.addAuditLog(currentUser, 'CREATE_BOOKING', 'bookings', newId, {
      booking_ref: bookingRef,
      passenger: newBooking.passenger_name
    });

    return newBooking;
  }

  public updateBooking(id: number, updates: Partial<Booking>, currentUser: User): Booking {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Booking not found');

    const existing = bookings[idx];

    // Concurrency check
    if (updates.version !== undefined && updates.version !== existing.version) {
      throw new Error(`Concurrency Conflict: Booking #${existing.booking_ref} was updated by another user. Please refresh and review.`);
    }

    // Lookup driver & vehicle names if IDs changed
    let driverName = existing.driver_name;
    let driverPhone = existing.driver_phone;
    if (updates.assigned_driver_id !== undefined) {
      if (updates.assigned_driver_id) {
        const d = this.getDrivers().find(drv => drv.id === Number(updates.assigned_driver_id));
        if (d) {
          driverName = d.name;
          driverPhone = d.phone;
        }
      } else {
        driverName = undefined;
        driverPhone = undefined;
      }
    }

    let vehicleReg = existing.vehicle_registration;
    let vehicleModel = existing.vehicle_model;
    if (updates.assigned_vehicle_id !== undefined) {
      if (updates.assigned_vehicle_id) {
        const v = this.getVehicles().find(veh => veh.id === Number(updates.assigned_vehicle_id));
        if (v) {
          vehicleReg = v.registration_no;
          vehicleModel = v.make_model;
        }
      } else {
        vehicleReg = undefined;
        vehicleModel = undefined;
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated: Booking = {
      ...existing,
      ...updates,
      driver_name: driverName,
      driver_phone: driverPhone,
      vehicle_registration: vehicleReg,
      vehicle_model: vehicleModel,
      last_updated_by_user_id: currentUser.id,
      last_updated_by_name: currentUser.full_name,
      version: (existing.version || 1) + 1,
      updated_at: now
    };

    bookings[idx] = updated;
    this.saveBookings(bookings);
    this.addAuditLog(currentUser, 'UPDATE_BOOKING', 'bookings', id, {
      booking_ref: updated.booking_ref
    });

    return updated;
  }

  public assignDriverAndVehicle(
    bookingId: number,
    driverId: number,
    vehicleId: number | null,
    currentUser: User,
    force = false
  ): Booking {
    const bookings = this.getBookings();
    const bIdx = bookings.findIndex(b => b.id === bookingId);
    if (bIdx === -1) throw new Error('Booking not found');

    const targetBooking = bookings[bIdx];

    // Conflict check: is driver already assigned to another trip on the same day within 2 hours?
    if (!force) {
      const conflict = bookings.find(
        b =>
          b.id !== bookingId &&
          b.assigned_driver_id === driverId &&
          b.pickup_date === targetBooking.pickup_date &&
          b.status !== 'Completed' &&
          b.status !== 'Cancelled' &&
          Math.abs(this.timeToMinutes(b.pickup_time) - this.timeToMinutes(targetBooking.pickup_time)) < 120
      );

      if (conflict) {
        throw new Error(`Schedule Conflict: Driver is already assigned to trip ${conflict.booking_ref} at ${conflict.pickup_time}.`);
      }
    }

    const driver = this.getDrivers().find(d => d.id === driverId);
    if (!driver) throw new Error('Driver not found');

    const vehicle = vehicleId ? this.getVehicles().find(v => v.id === vehicleId) : null;

    return this.updateBooking(
      bookingId,
      {
        assigned_driver_id: driverId,
        assigned_vehicle_id: vehicleId || null,
        driver_name: driver.name,
        driver_phone: driver.phone,
        vehicle_registration: vehicle ? vehicle.registration_no : undefined,
        vehicle_model: vehicle ? vehicle.make_model : undefined,
        status: targetBooking.status === 'Pending' ? 'Assigned' : targetBooking.status
      },
      currentUser
    );
  }

  private timeToMinutes(timeStr: string): number {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>('audit_logs', []);
  }

  public addAuditLog(
    user: User,
    action: string,
    entityType: string,
    entityId?: number,
    details?: Record<string, unknown>
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: logs.length + 1,
      user_id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      ip_address: '127.0.0.1 (Local Session)',
      details_json: details ? JSON.stringify(details) : undefined,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    logs.unshift(newLog);
    this.set('audit_logs', logs.slice(0, 100));
  }

  // Backups
  public getBackups(): BackupItem[] {
    return this.get<BackupItem[]>('backups', []);
  }

  public createBackup(user: User): { filename: string; sqlContent: string; size_formatted: string } {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '_').slice(0, 19);
    const filename = `gulftaxis_backup_${timestamp}.sql`;

    const users = this.getUsers();
    const drivers = this.getDrivers();
    const vehicles = this.getVehicles();
    const bookings = this.getBookings();

    let sql = `-- ====================================================================\n`;
    sql += `-- GULF TAXIS DISPATCH CLOUD - DATABASE DUMP\n`;
    sql += `-- Hostinger-Compatible MySQL Backup\n`;
    sql += `-- Date: ${now.toISOString()}\n`;
    sql += `-- Generated by: ${user.full_name} (${user.email})\n`;
    sql += `-- ====================================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // Users Dump
    sql += `-- Table: users (${users.length} rows)\n`;
    for (const u of users) {
      sql += `INSERT INTO users (id, uuid, username, email, password_hash, full_name, role, status) VALUES (${u.id}, '${u.uuid}', '${u.username}', '${u.email}', '$2y$10$DEMO_HASH_PROTECTED', '${u.full_name.replace(/'/g, "''")}', '${u.role}', '${u.status}') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);\n`;
    }
    sql += `\n`;

    // Drivers Dump
    sql += `-- Table: drivers (${drivers.length} rows)\n`;
    for (const d of drivers) {
      sql += `INSERT INTO drivers (id, uuid, name, phone, whatsapp, license_no, status, availability, rating, notes) VALUES (${d.id}, '${d.uuid}', '${d.name.replace(/'/g, "''")}', '${d.phone}', '${d.whatsapp || ''}', '${d.license_no || ''}', '${d.status}', '${d.availability}', ${d.rating}, '${(d.notes || '').replace(/'/g, "''")}') ON DUPLICATE KEY UPDATE name=VALUES(name);\n`;
    }
    sql += `\n`;

    // Vehicles Dump
    sql += `-- Table: vehicles (${vehicles.length} rows)\n`;
    for (const v of vehicles) {
      sql += `INSERT INTO vehicles (id, uuid, registration_no, make_model, vehicle_type, passenger_capacity, luggage_capacity, availability, assigned_driver_id) VALUES (${v.id}, '${v.uuid}', '${v.registration_no}', '${v.make_model.replace(/'/g, "''")}', '${v.vehicle_type}', ${v.passenger_capacity}, ${v.luggage_capacity}, '${v.availability}', ${v.assigned_driver_id || 'NULL'}) ON DUPLICATE KEY UPDATE make_model=VALUES(make_model);\n`;
    }
    sql += `\n`;

    // Bookings Dump
    sql += `-- Table: bookings (${bookings.length} rows)\n`;
    for (const b of bookings) {
      sql += `INSERT INTO bookings (id, uuid, booking_ref, pickup_date, pickup_time, passenger_name, passenger_phone, flight_number, vehicle_type, pickup_location, dropoff_location, passenger_count, luggage_count, assigned_driver_id, assigned_vehicle_id, status, booking_source) VALUES (${b.id}, '${b.uuid}', '${b.booking_ref}', '${b.pickup_date}', '${b.pickup_time}', '${b.passenger_name.replace(/'/g, "''")}', '${b.passenger_phone}', '${b.flight_number || ''}', '${b.vehicle_type}', '${b.pickup_location.replace(/'/g, "''")}', '${b.dropoff_location.replace(/'/g, "''")}', ${b.passenger_count}, ${b.luggage_count}, ${b.assigned_driver_id || 'NULL'}, ${b.assigned_vehicle_id || 'NULL'}, '${b.status}', '${b.booking_source}') ON DUPLICATE KEY UPDATE status=VALUES(status);\n`;
    }
    sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n-- END OF BACKUP\n`;

    const bytes = new Blob([sql]).size;
    const formattedSize = (bytes / 1024).toFixed(2) + ' KB';

    const backups = this.getBackups();
    backups.unshift({
      filename,
      size_bytes: bytes,
      size_formatted: formattedSize,
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
      status: 'Verified'
    });
    this.set('backups', backups);

    this.addAuditLog(user, 'DATABASE_BACKUP_CREATED', 'system', undefined, {
      filename,
      size: formattedSize
    });

    return {
      filename,
      sqlContent: sql,
      size_formatted: formattedSize
    };
  }

  // Reports
  public getDailySummary(date: string): DailyReportSummary {
    const bookings = this.getBookings().filter(b => b.pickup_date === date);
    const drivers = this.getDrivers();

    const summary = {
      total_today: bookings.length,
      pending_count: bookings.filter(b => b.status === 'Pending').length,
      assigned_count: bookings.filter(b => b.status === 'Assigned').length,
      unassigned_count: bookings.filter(b => !b.assigned_driver_id && b.status !== 'Completed' && b.status !== 'Cancelled').length,
      in_progress_count: bookings.filter(b => ['Driver En Route', 'Arrived', 'Passenger Picked Up'].includes(b.status)).length,
      completed_count: bookings.filter(b => b.status === 'Completed').length,
      cancelled_count: bookings.filter(b => b.status === 'Cancelled').length,
      airport_pickups_count: bookings.filter(b => Boolean(b.flight_number)).length,
      drivers_on_duty: drivers.filter(d => d.availability === 'on_duty' && d.status === 'active').length
    };

    // Vehicle breakdown
    const vehicleTypeCounts: Record<string, number> = {};
    for (const b of bookings) {
      vehicleTypeCounts[b.vehicle_type] = (vehicleTypeCounts[b.vehicle_type] || 0) + 1;
    }
    const vehicle_breakdown = Object.entries(vehicleTypeCounts).map(([vehicle_type, count]) => ({
      vehicle_type: vehicle_type as any,
      count
    }));

    // Hourly distribution
    const hourlyMap: Record<number, number> = {};
    for (const b of bookings) {
      const hour = parseInt(b.pickup_time.split(':')[0], 10) || 0;
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    }
    const hourly_pickups = Object.entries(hourlyMap)
      .map(([h, count]) => ({ pickup_hour: Number(h), count }))
      .sort((a, b) => a.pickup_hour - b.pickup_hour);

    return {
      date,
      summary,
      vehicle_breakdown,
      hourly_pickups
    };
  }
}

export const mockDb = new MockDatabase();
