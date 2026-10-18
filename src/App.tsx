/**
 * Gulf Taxis Dispatch Cloud - Main Application Entry
 * Built for Hostinger Shared Hosting (PHP 8.2+ & MySQL) with Vite + React + Tailwind
 * Strictly enforces Login Page First before any private operational records appear.
 */

import React, { useState, useEffect } from 'react';
import { User, Booking, Driver, Vehicle, BookingStatus } from './types';
import { api } from './services/api';
import { LoginScreen } from './components/LoginScreen';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DispatchBoard } from './components/DispatchBoard';
import { BookingRegisterView } from './components/BookingRegisterView';
import { FleetManagement } from './components/FleetManagement';
import { ReportsView } from './components/ReportsView';
import { HostingerDeployCenter } from './components/HostingerDeployCenter';
import { UserManagementView } from './components/UserManagementView';
import { BookingFormModal } from './components/BookingFormModal';
import { BookingVoucherModal } from './components/BookingVoucherModal';
import { BackupModal } from './components/BackupModal';
import { SetupWizardModal } from './components/SetupWizardModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [backups, setBackups] = useState<any[]>([]);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [voucherBooking, setVoucherBooking] = useState<Booking | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Load operational data when user is authenticated
  const refreshAllData = async () => {
    if (!currentUser) return;
    try {
      const [bList, dList, vList, bkList] = await Promise.all([
        api.getBookings(),
        api.getDrivers(),
        api.getVehicles(),
        api.getBackups()
      ]);
      setBookings(bList);
      setDrivers(dList);
      setVehicles(vList);
      setBackups(bkList);
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser]);

  // Mandatory Login First Rule:
  // When user opens website, if not authenticated, show ONLY the LoginScreen!
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
          }}
          onOpenSetup={() => setIsSetupModalOpen(true)}
        />

        {isSetupModalOpen && (
          <SetupWizardModal
            isOpen={isSetupModalOpen}
            onClose={() => setIsSetupModalOpen(false)}
            onSetupComplete={() => {
              setIsSetupModalOpen(false);
            }}
          />
        )}
      </>
    );
  }

  // --- Handlers for Booking Actions ---
  const handleSaveBooking = async (data: Partial<Booking>) => {
    if (bookingToEdit) {
      await api.updateBooking(bookingToEdit.id, data);
    } else {
      await api.createBooking(data);
    }
    await refreshAllData();
  };

  const handleUpdateBookingStatus = async (
    bookingId: number,
    status: BookingStatus,
    reason?: string
  ) => {
    await api.updateBookingStatus(bookingId, status, reason);
    await refreshAllData();
  };

  const handleAssignDriver = async (
    bookingId: number,
    driverId: number,
    vehicleId: number | null,
    force = false
  ) => {
    await api.assignBooking(bookingId, driverId, vehicleId, force);
    await refreshAllData();
  };

  const handleCancelBooking = async (booking: Booking) => {
    const reason = window.prompt(`Reason for cancelling booking #${booking.booking_ref}:`, 'Customer requested');
    if (reason !== null) {
      await api.updateBookingStatus(booking.id, 'Cancelled', reason);
      await refreshAllData();
    }
  };

  // --- Handlers for Fleet Actions ---
  const handleUpdateDriver = async (id: number, updates: Partial<Driver>) => {
    await api.updateDriver(id, updates);
    await refreshAllData();
  };

  const handleAddDriver = async (driver: Partial<Driver>) => {
    const dList = await api.getDrivers();
    const newId = dList.length > 0 ? Math.max(...dList.map(d => d.id)) + 1 : 1;
    const newDriver: Driver = {
      id: newId,
      uuid: 'drv-' + Math.random().toString(36).substring(2, 7),
      name: driver.name || 'New Chauffeur',
      phone: driver.phone || '',
      whatsapp: driver.whatsapp || driver.phone || '',
      license_no: driver.license_no || 'UAE Commercial',
      status: 'active',
      availability: driver.availability || 'on_duty',
      rating: 5.0,
      notes: driver.notes,
      created_at: new Date().toISOString()
    };
    dList.push(newDriver);
    // save in storage
    localStorage.setItem('gulftaxis_v1_drivers', JSON.stringify(dList));
    await refreshAllData();
  };

  const handleUpdateVehicle = async (id: number, updates: Partial<Vehicle>) => {
    await api.updateVehicle(id, updates);
    await refreshAllData();
  };

  const handleAddVehicle = async (vehicle: Partial<Vehicle>) => {
    const vList = await api.getVehicles();
    const newId = vList.length > 0 ? Math.max(...vList.map(v => v.id)) + 1 : 1;
    const newVehicle: Vehicle = {
      id: newId,
      uuid: 'veh-' + Math.random().toString(36).substring(2, 7),
      registration_no: vehicle.registration_no || 'DXB-NEW',
      make_model: vehicle.make_model || 'Standard Sedan',
      vehicle_type: vehicle.vehicle_type || 'Sedan',
      passenger_capacity: vehicle.passenger_capacity || 4,
      luggage_capacity: vehicle.luggage_capacity || 3,
      availability: vehicle.availability || 'available',
      assigned_driver_id: vehicle.assigned_driver_id,
      maintenance_notes: vehicle.maintenance_notes,
      created_at: new Date().toISOString()
    };
    vList.push(newVehicle);
    localStorage.setItem('gulftaxis_v1_vehicles', JSON.stringify(vList));
    await refreshAllData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#07111e] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-900">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          // If non-admin tries to access users, guard it
          if (tab === 'users' && currentUser.role !== 'ADMINISTRATOR') return;
          setActiveTab(tab);
        }}
        onOpenNewBooking={() => {
          setBookingToEdit(null);
          setIsBookingModalOpen(true);
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={currentUser}
            bookings={bookings}
            drivers={drivers}
            vehicles={vehicles}
            onNavigate={(t) => setActiveTab(t)}
            onOpenNewBooking={() => {
              setBookingToEdit(null);
              setIsBookingModalOpen(true);
            }}
            onSelectBooking={(b) => {
              setBookingToEdit(b);
              setIsBookingModalOpen(true);
            }}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchBoard
            user={currentUser}
            bookings={bookings}
            drivers={drivers}
            vehicles={vehicles}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onAssignDriver={handleAssignDriver}
            onEditBooking={(b) => {
              setBookingToEdit(b);
              setIsBookingModalOpen(true);
            }}
            onPrintVoucher={(b) => setVoucherBooking(b)}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingRegisterView
            bookings={bookings}
            drivers={drivers}
            vehicles={vehicles}
            user={currentUser}
            onOpenNewBooking={() => {
              setBookingToEdit(null);
              setIsBookingModalOpen(true);
            }}
            onEditBooking={(b) => {
              setBookingToEdit(b);
              setIsBookingModalOpen(true);
            }}
            onPrintVoucher={(b) => setVoucherBooking(b)}
            onCancelBooking={handleCancelBooking}
          />
        )}

        {activeTab === 'fleet' && (
          <FleetManagement
            drivers={drivers}
            vehicles={vehicles}
            user={currentUser}
            onUpdateDriver={handleUpdateDriver}
            onAddDriver={handleAddDriver}
            onUpdateVehicle={handleUpdateVehicle}
            onAddVehicle={handleAddVehicle}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            bookings={bookings}
            drivers={drivers}
            vehicles={vehicles}
            user={currentUser}
            onPrintVoucher={(b) => setVoucherBooking(b)}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'ADMINISTRATOR' && (
          <UserManagementView currentUser={currentUser} />
        )}

        {activeTab === 'deploy' && (
          <HostingerDeployCenter />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-[#0b192c] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Gulf Taxis Dispatch Cloud · Production Architecture: Hostinger Shared Apache + PHP 8.2+ + MySQL
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Server Session: Active</span>
            <span>·</span>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-teal-400 hover:underline"
            >
              Export Backup (.sql)
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('deploy')}
              className="text-teal-400 hover:underline"
            >
              Hostinger Package
            </button>
          </div>
        </div>
      </footer>

      {/* Booking Create & Edit Modal */}
      <BookingFormModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingToEdit(null);
        }}
        bookingToEdit={bookingToEdit}
        drivers={drivers}
        vehicles={vehicles}
        currentUser={currentUser}
        onSave={handleSaveBooking}
      />

      {/* Booking Voucher Modal (Printable) */}
      <BookingVoucherModal
        booking={voucherBooking}
        onClose={() => setVoucherBooking(null)}
      />

      {/* Backup and Restore Modal (Administrator) */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentUser={currentUser}
        backups={backups}
        onRefreshBackups={refreshAllData}
      />
    </div>
  );
}
