import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, User, BookingStatus } from '../types';
import { 
  Filter, Search, UserCheck, AlertTriangle, 
  Clock, ArrowUpDown, ChevronLeft, ChevronRight, 
  Phone, MessageSquare, ExternalLink, RefreshCw, 
  Printer, Check, AlertCircle, Calendar
} from 'lucide-react';

interface DispatchBoardProps {
  user: User;
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onUpdateBookingStatus: (bookingId: number, status: BookingStatus, reason?: string) => Promise<void>;
  onAssignDriver: (bookingId: number, driverId: number, vehicleId: number | null, force?: boolean) => Promise<void>;
  onEditBooking: (booking: Booking) => void;
  onPrintVoucher: (booking: Booking) => void;
  onRefresh: () => void;
}

export const DispatchBoard: React.FC<DispatchBoardProps> = ({
  user,
  bookings,
  drivers,
  vehicles,
  onUpdateBookingStatus,
  onAssignDriver,
  onEditBooking,
  onPrintVoucher,
  onRefresh
}) => {
  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [dateFilter, setDateFilter] = useState<string>('TODAY'); // TODAY, TOMORROW, ALL, CUSTOM
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');
  const [flightSearch, setFlightSearch] = useState<string>('');
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Assignment Modal
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<Booking | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [assignConflictWarning, setAssignConflictWarning] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Status Change Confirmation Modal
  const [statusModalBooking, setStatusModalBooking] = useState<Booking | null>(null);
  const [targetStatus, setTargetStatus] = useState<BookingStatus | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Helper to test if pickup is overdue
  const isPickupOverdue = (booking: Booking): boolean => {
    if (['Completed', 'Cancelled', 'Passenger Picked Up', 'No Show'].includes(booking.status)) {
      return false;
    }
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (booking.pickup_date < today) return true;
    if (booking.pickup_date === today) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const [bHour, bMin] = booking.pickup_time.split(':').map(Number);
      return currentHours > bHour || (currentHours === bHour && currentMinutes > bMin);
    }
    return false;
  };

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Date filter
      if (dateFilter === 'TODAY' && b.pickup_date !== todayStr) return false;
      if (dateFilter === 'TOMORROW' && b.pickup_date !== tomorrowStr) return false;
      if (dateFilter === 'CUSTOM' && b.pickup_date !== customDate) return false;

      // Status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

      // Unassigned
      if (unassignedOnly && (b.assigned_driver_id || ['Completed', 'Cancelled'].includes(b.status))) {
        return false;
      }

      // Driver
      if (driverFilter !== 'ALL' && b.assigned_driver_id !== Number(driverFilter)) {
        return false;
      }

      // Vehicle
      if (vehicleFilter !== 'ALL' && b.vehicle_type !== vehicleFilter) {
        return false;
      }

      // Flight Search
      if (flightSearch.trim()) {
        const query = flightSearch.toLowerCase().trim();
        const matchesFlight = b.flight_number?.toLowerCase().includes(query);
        const matchesRef = b.booking_ref.toLowerCase().includes(query);
        const matchesPass = b.passenger_name.toLowerCase().includes(query);
        if (!matchesFlight && !matchesRef && !matchesPass) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = `${a.pickup_date} ${a.pickup_time}`;
      const timeB = `${b.pickup_date} ${b.pickup_time}`;
      return sortDirection === 'asc' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
    });
  }, [
    bookings,
    dateFilter,
    todayStr,
    tomorrowStr,
    customDate,
    statusFilter,
    unassignedOnly,
    driverFilter,
    vehicleFilter,
    flightSearch,
    sortDirection
  ]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Handle Assignment Modal Opening
  const handleOpenAssignModal = (b: Booking) => {
    setSelectedBookingForAssign(b);
    setSelectedDriverId(b.assigned_driver_id || '');
    setSelectedVehicleId(b.assigned_vehicle_id || '');
    setAssignConflictWarning(null);
  };

  // Check Conflict in Assign Modal
  const handleDriverSelectChange = (driverIdStr: string) => {
    const dId = driverIdStr ? Number(driverIdStr) : '';
    setSelectedDriverId(dId);
    setAssignConflictWarning(null);

    if (dId && selectedBookingForAssign) {
      // Find default vehicle for this driver
      const assignedVeh = vehicles.find(v => v.assigned_driver_id === dId);
      if (assignedVeh && !selectedVehicleId) {
        setSelectedVehicleId(assignedVeh.id);
      }

      // Check for driver conflict on same date within 2 hours
      const conflict = bookings.find(
        b =>
          b.id !== selectedBookingForAssign.id &&
          b.assigned_driver_id === dId &&
          b.pickup_date === selectedBookingForAssign.pickup_date &&
          !['Completed', 'Cancelled'].includes(b.status) &&
          Math.abs(timeToMinutes(b.pickup_time) - timeToMinutes(selectedBookingForAssign.pickup_time)) < 120
      );

      if (conflict) {
        setAssignConflictWarning(
          `Schedule Warning: This driver is already assigned to trip #${conflict.booking_ref} (${conflict.pickup_time}) within 2 hours.`
        );
      }
    }
  };

  const handleVehicleSelectChange = (vehicleIdStr: string) => {
    const vId = vehicleIdStr ? Number(vehicleIdStr) : '';
    setSelectedVehicleId(vId);

    if (vId && selectedBookingForAssign) {
      const veh = vehicles.find(v => v.id === vId);
      if (veh && selectedBookingForAssign.passenger_count > veh.passenger_capacity) {
        setAssignConflictWarning(
          `Capacity Warning: Passenger count (${selectedBookingForAssign.passenger_count}) exceeds vehicle seat capacity (${veh.passenger_capacity}).`
        );
      }
    }
  };

  const timeToMinutes = (t: string) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Submit Driver & Vehicle Assignment
  const handleConfirmAssignment = async (force = false) => {
    if (!selectedBookingForAssign || !selectedDriverId) return;
    setAssignLoading(true);
    try {
      await onAssignDriver(
        selectedBookingForAssign.id,
        Number(selectedDriverId),
        selectedVehicleId ? Number(selectedVehicleId) : null,
        force
      );
      setSelectedBookingForAssign(null);
    } catch (err: any) {
      setAssignConflictWarning(err?.message || 'Assignment failed.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Status Change Prompt
  const handlePromptStatusChange = (booking: Booking, newStatus: BookingStatus) => {
    setStatusModalBooking(booking);
    setTargetStatus(newStatus);
    setCancellationReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalBooking || !targetStatus) return;
    setStatusChangeLoading(true);
    try {
      await onUpdateBookingStatus(statusModalBooking.id, targetStatus, cancellationReason);
      setStatusModalBooking(null);
      setTargetStatus(null);
    } catch (err: any) {
      alert(err?.message || 'Status update failed');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Confirmed':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Assigned':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'Driver En Route':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'Arrived':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'Passenger Picked Up':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'No Show':
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dispatch Controls & Filtering Toolbar */}
      <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Date Segmented Filter */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
            <button
              onClick={() => { setDateFilter('TODAY'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                dateFilter === 'TODAY'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setDateFilter('TOMORROW'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                dateFilter === 'TOMORROW'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => { setDateFilter('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                dateFilter === 'ALL'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Dates
            </button>
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('CUSTOM');
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 border-none focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Search by Flight, Ref, or Passenger */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={flightSearch}
                onChange={(e) => { setFlightSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search flight number (e.g. EK002), booking ref, or passenger..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <button
              onClick={onRefresh}
              title="Refresh Dispatch Board"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Filter Line */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Unassigned Quick Toggle */}
          <button
            onClick={() => { setUnassignedOnly(!unassignedOnly); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              unassignedOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-semibold'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            Unassigned Only
          </button>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Assigned">Assigned</option>
              <option value="Driver En Route">Driver En Route</option>
              <option value="Arrived">Arrived</option>
              <option value="Passenger Picked Up">Passenger Picked Up</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>

          {/* Vehicle Type Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Vehicle:</span>
            <select
              value={vehicleFilter}
              onChange={(e) => { setVehicleFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="ALL">All Types</option>
              <option value="Sedan">Sedan</option>
              <option value="Business Sedan">Business Sedan</option>
              <option value="SUV">SUV</option>
              <option value="GMC">GMC</option>
              <option value="Minivan">Minivan</option>
              <option value="Van">Van</option>
              <option value="Coaster">Coaster</option>
              <option value="Bus">Bus</option>
            </select>
          </div>

          {/* Driver Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Driver:</span>
            <select
              value={driverFilter}
              onChange={(e) => { setDriverFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="ALL">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Time Sorting Toggle */}
          <button
            onClick={() => setSortDirection(s => s === 'asc' ? 'desc' : 'asc')}
            className="ml-auto text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Time: {sortDirection === 'asc' ? 'Earliest First' : 'Latest First'}</span>
          </button>
        </div>
      </div>

      {/* Main Table: Desktop View (MANDATORY EXACT COLUMN ORDER) */}
      <div className="hidden lg:block bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                {/* MANDATORY COLUMN ORDER:
                    Pickup Date | Pickup Time | Booking Reference | Flight Number | Vehicle Type | Passenger Name | Passenger Phone | Pickup Location | Drop-off Location | Passengers/Luggage | Assigned Driver | Status | Actions
                    Vehicle Type MUST appear immediately after Flight Number! */}
                <th className="py-3.5 px-3 whitespace-nowrap">Pickup Date</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Pickup Time</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Booking Ref</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Flight No.</th>
                <th className="py-3.5 px-3 whitespace-nowrap text-teal-400">Vehicle Type</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Passenger Name</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Passenger Phone</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Pickup Location</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Drop-off Location</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Pax / Lug</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Assigned Driver</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => {
                  const overdue = isPickupOverdue(b);
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        overdue ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* 1. Pickup Date */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums text-slate-300">
                        {b.pickup_date}
                      </td>

                      {/* 2. Pickup Time (with overdue alert indicator if applicable) */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-white tabular-nums">
                        <div className="flex items-center gap-1.5">
                          {overdue && (
                            <span title="Overdue Pickup" className="text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                            </span>
                          )}
                          <span>{b.pickup_time}</span>
                        </div>
                      </td>

                      {/* 3. Booking Reference */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-teal-300">
                        {b.booking_ref}
                      </td>

                      {/* 4. Flight Number */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono">
                        {b.flight_number ? (
                          <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 font-semibold text-[11px]">
                            {b.flight_number}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* 5. Vehicle Type (MUST APPEAR IMMEDIATELY AFTER FLIGHT NUMBER) */}
                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-teal-300">
                        {b.vehicle_type}
                      </td>

                      {/* 6. Passenger Name */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-white max-w-[140px] truncate">
                        {b.passenger_name}
                      </td>

                      {/* 7. Passenger Phone */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums text-slate-300">
                        <a
                          href={`tel:${b.passenger_phone.replace(/\s+/g, '')}`}
                          className="hover:text-teal-400 transition"
                        >
                          {b.passenger_phone}
                        </a>
                      </td>

                      {/* 8. Pickup Location */}
                      <td className="py-3 px-3 max-w-[180px] truncate text-slate-300" title={b.pickup_location}>
                        {b.pickup_location}
                      </td>

                      {/* 9. Drop-off Location */}
                      <td className="py-3 px-3 max-w-[180px] truncate text-slate-300" title={b.dropoff_location}>
                        {b.dropoff_location}
                      </td>

                      {/* 10. Passengers / Luggage */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums text-slate-400">
                        {b.passenger_count}p / {b.luggage_count}b
                      </td>

                      {/* 11. Assigned Driver */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {b.driver_name ? (
                          <div className="leading-tight">
                            <div className="font-medium text-slate-200">{b.driver_name}</div>
                            {b.vehicle_registration && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {b.vehicle_registration}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignModal(b)}
                            className="px-2 py-0.5 text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded hover:bg-rose-500/20 transition cursor-pointer"
                          >
                            + Assign Driver
                          </button>
                        )}
                      </td>

                      {/* 12. Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>

                      {/* 13. Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Driver Assign / Reassign Button */}
                          <button
                            onClick={() => handleOpenAssignModal(b)}
                            title="Assign or Change Driver/Vehicle"
                            className="p-1 text-slate-400 hover:text-teal-400 transition"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Print Voucher */}
                          <button
                            onClick={() => onPrintVoucher(b)}
                            title="Print Passenger Voucher"
                            className="p-1 text-slate-400 hover:text-white transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Quick Status Dropdown or Action */}
                          <select
                            value={b.status}
                            onChange={(e) => handlePromptStatusChange(b, e.target.value as BookingStatus)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Driver En Route">Driver En Route</option>
                            <option value="Arrived">Arrived</option>
                            <option value="Passenger Picked Up">Passenger Picked Up</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="No Show">No Show</option>
                          </select>

                          {/* Edit Full Booking */}
                          <button
                            onClick={() => onEditBooking(b)}
                            className="text-xs text-teal-400 hover:text-teal-300 ml-1 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedBookings.length === 0 ? (
          <div className="p-8 text-center bg-[#0d2137] border border-slate-800 rounded-xl text-slate-400 text-xs">
            No bookings found matching current filters.
          </div>
        ) : (
          paginatedBookings.map((b) => {
            const overdue = isPickupOverdue(b);
            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border bg-[#0d2137] space-y-3 shadow-md ${
                  overdue ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                {/* Header row: Time, Ref, Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white tabular-nums">
                      {b.pickup_time}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {b.pickup_date}
                    </span>
                    {overdue && (
                      <span className="text-[10px] text-rose-400 font-semibold uppercase px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-800">
                        Overdue
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(b.status)}`}>
                    {b.status}
                  </span>
                </div>

                {/* Key Ref & Flight & Vehicle Type */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-teal-300">
                    {b.booking_ref}
                  </span>
                  {b.flight_number && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 font-mono text-[11px]">
                      {b.flight_number}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-teal-400">
                    {b.vehicle_type}
                  </span>
                </div>

                {/* Passenger Info & Quick Dial */}
                <div className="text-xs text-slate-300">
                  <div className="font-semibold text-white">{b.passenger_name}</div>
                  <div className="flex items-center gap-3 mt-1 text-slate-400">
                    <a href={`tel:${b.passenger_phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 text-teal-400 hover:underline">
                      <Phone className="w-3 h-3" />
                      <span>{b.passenger_phone}</span>
                    </a>
                    {b.passenger_whatsapp && (
                      <a href={`https://wa.me/${b.passenger_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-400 hover:underline">
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div><strong className="text-slate-300">From:</strong> {b.pickup_location}</div>
                  <div><strong className="text-slate-300">To:</strong> {b.dropoff_location}</div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Load: {b.passenger_count} Passengers · {b.luggage_count} Luggage
                  </div>
                </div>

                {/* Assigned Driver & Mobile Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Assigned Driver:</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {b.driver_name || <span className="text-rose-400">Unassigned</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAssignModal(b)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => onPrintVoucher(b)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditBooking(b)}
                      className="px-2.5 py-1 text-xs font-medium bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between py-3 px-2 text-xs text-slate-400">
        <div>
          Showing {filteredBookings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} trips
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono tabular-nums text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Driver & Vehicle Assignment Modal with Conflict Warnings */}
      {selectedBookingForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0d2137] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Dispatch Trip Assignment</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Ref: {selectedBookingForAssign.booking_ref} ({selectedBookingForAssign.pickup_date} at {selectedBookingForAssign.pickup_time})
                </p>
              </div>
              <button
                onClick={() => setSelectedBookingForAssign(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg space-y-1">
              <div><strong>Passenger:</strong> {selectedBookingForAssign.passenger_name} ({selectedBookingForAssign.passenger_count} pax, {selectedBookingForAssign.luggage_count} bags)</div>
              <div><strong>Vehicle Type:</strong> {selectedBookingForAssign.vehicle_type}</div>
              {selectedBookingForAssign.flight_number && (
                <div><strong>Flight:</strong> {selectedBookingForAssign.flight_number}</div>
              )}
            </div>

            {assignConflictWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{assignConflictWarning}</div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Chauffeur / Driver *
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverSelectChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.availability === 'on_duty' ? 'On Duty' : d.availability}) · {d.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assign Vehicle from Fleet (Optional)
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleSelectChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="">-- Auto-derive or None --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_no} - {v.make_model} ({v.vehicle_type}, {v.passenger_capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedBookingForAssign(null)}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              {assignConflictWarning ? (
                <button
                  type="button"
                  onClick={() => handleConfirmAssignment(true)}
                  disabled={assignLoading}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition"
                >
                  {assignLoading ? 'Assigning...' : 'Override & Force Assign'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmAssignment(false)}
                  disabled={!selectedDriverId || assignLoading}
                  className="px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 rounded-lg transition"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusModalBooking && targetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0d2137] border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Update Trip Status</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transition trip <span className="font-mono text-teal-300 font-semibold">{statusModalBooking.booking_ref}</span> from{' '}
              <span className="text-slate-400 font-medium">{statusModalBooking.status}</span> to{' '}
              <span className="text-white font-bold">{targetStatus}</span>?
            </p>

            {targetStatus === 'Cancelled' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Cancellation (Required)
                </label>
                <input
                  type="text"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Passenger flight cancelled, requested by customer..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setStatusModalBooking(null); setTargetStatus(null); }}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={statusChangeLoading || (targetStatus === 'Cancelled' && !cancellationReason.trim())}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 transition"
              >
                {statusChangeLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
