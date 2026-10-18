import React from 'react';
import { Booking, Driver, Vehicle, User } from '../types';
import { 
  Calendar, Clock, UserX, UserCheck, ShieldCheck, 
  Plane, Activity, CheckCircle2, XCircle, ArrowUpRight, 
  Car, Users, FileText, PlusCircle, Search, AlertTriangle
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  user: User;
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  onSelectBooking: (booking: Booking) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  bookings,
  drivers,
  vehicles,
  onNavigate,
  onOpenNewBooking,
  onSelectBooking
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.pickup_date === todayStr);

  const pendingBookings = todayBookings.filter(b => b.status === 'Pending');
  const unassignedTrips = todayBookings.filter(b => !b.assigned_driver_id && b.status !== 'Completed' && b.status !== 'Cancelled');
  const assignedTrips = todayBookings.filter(b => b.status === 'Assigned');
  const driversOnDuty = drivers.filter(d => d.availability === 'on_duty' && d.status === 'active');
  const upcomingAirportPickups = todayBookings.filter(b => Boolean(b.flight_number) && b.status !== 'Completed' && b.status !== 'Cancelled');
  const inProgressTrips = todayBookings.filter(b => ['Driver En Route', 'Arrived', 'Passenger Picked Up'].includes(b.status));
  const completedToday = todayBookings.filter(b => b.status === 'Completed');
  const cancelledToday = todayBookings.filter(b => b.status === 'Cancelled');

  // Sorted upcoming trips
  const upcomingTrips = [...todayBookings]
    .filter(b => b.status !== 'Completed' && b.status !== 'Cancelled')
    .sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Operational Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
            <span>Operational Day</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{todayStr}</span>
            <span>·</span>
            <span className="text-slate-400">Gulf Standard Time (UTC+4)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Dispatch Command Center
          </h2>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Booking</span>
          </button>
          <button
            onClick={() => onNavigate('dispatch')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          >
            <span>Open Dispatch Board</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 9 Mandatory Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. Today's Bookings */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Today's Bookings</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums mt-2">
            {todayBookings.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total active & finished trips today
          </div>
        </div>

        {/* 2. Pending Bookings */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Bookings</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums mt-2">
            {pendingBookings.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Awaiting confirmation or review
          </div>
        </div>

        {/* 3. Unassigned Trips */}
        <div className={`rounded-xl p-4 flex flex-col justify-between border ${
          unassignedTrips.length > 0 
            ? 'bg-rose-950/20 border-rose-500/30' 
            : 'bg-[#0d2137]/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={unassignedTrips.length > 0 ? 'text-rose-300 font-medium' : 'text-slate-400'}>
              Unassigned Trips
            </span>
            <UserX className={`w-4 h-4 ${unassignedTrips.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-2 ${
            unassignedTrips.length > 0 ? 'text-rose-400' : 'text-white'
          }`}>
            {unassignedTrips.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Needs driver allocation immediately
          </div>
        </div>

        {/* 4. Assigned Trips */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Assigned Trips</span>
            <UserCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums mt-2">
            {assignedTrips.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Chauffeur & vehicle confirmed
          </div>
        </div>

        {/* 5. Drivers on Duty */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Drivers on Duty</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-teal-400 font-mono tabular-nums mt-2">
            {driversOnDuty.length} <span className="text-sm font-normal text-slate-500">/ {drivers.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Available for immediate dispatch
          </div>
        </div>

        {/* 6. Upcoming Airport Pickups */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Upcoming Airport Pickups</span>
            <Plane className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-sky-400 font-mono tabular-nums mt-2">
            {upcomingAirportPickups.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Flight tracked transfers today
          </div>
        </div>

        {/* 7. Trips in Progress */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Trips in Progress</span>
            <Activity className="w-4 h-4 text-teal-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-teal-300 font-mono tabular-nums mt-2">
            {inProgressTrips.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            En route, arrived, or passenger aboard
          </div>
        </div>

        {/* 8. Completed Today */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums mt-2">
            {completedToday.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Finished transfers safely
          </div>
        </div>

        {/* 9. Cancelled Bookings */}
        <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cancelled Bookings</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono tabular-nums mt-2">
            {cancelledToday.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Voided or customer requested
          </div>
        </div>
      </div>

      {/* Operational Split: Urgent Pickups & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Pickups (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0d2137]/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Upcoming Priority Dispatches
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sorted by pickup time (24-Hour Format)
              </p>
            </div>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingTrips.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No pending trips scheduled for today.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {upcomingTrips.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 rounded-lg cursor-pointer transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-center shrink-0">
                      <div className="text-xs font-bold font-mono text-teal-400 tabular-nums">
                        {b.pickup_time}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">
                        {b.vehicle_type}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {b.booking_ref}
                        </span>
                        {b.flight_number && (
                          <span className="text-[11px] font-mono font-medium text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/50">
                            {b.flight_number}
                          </span>
                        )}
                        <span className="text-xs text-slate-300 font-medium">
                          {b.passenger_name}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                        <span className="text-slate-300">{b.pickup_location}</span>
                        <span className="mx-1 text-slate-600">→</span>
                        <span>{b.dropoff_location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                      b.status === 'Pending'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : b.status === 'Assigned'
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : b.status === 'Driver En Route'
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {b.status}
                    </span>

                    <span className="text-xs text-slate-400">
                      {b.driver_name ? b.driver_name : <span className="text-rose-400">Unassigned</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launchpad & Fleet Health (1 Col) */}
        <div className="space-y-4">
          <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white tracking-tight mb-3">
              Operational Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={onOpenNewBooking}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-teal-400" />
                  <span>Quick Create Booking</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('dispatch')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Open Dispatch Board</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('bookings')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-teal-400" />
                  <span>Search All Bookings</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('fleet')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-teal-400" />
                  <span>Driver & Vehicle Fleet</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Daily Dispatch Reports</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {user.role === 'ADMINISTRATOR' && (
                <button
                  onClick={() => onNavigate('users')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-amber-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>User Management & Permissions</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Quick System Note */}
          <div className="bg-[#0b192c] border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Hostinger Architecture Status</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              No Node.js production server required. Deploys as static HTML/React files + PHP 8.2+ API with MySQL InnoDB storage on Hostinger shared hosting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
