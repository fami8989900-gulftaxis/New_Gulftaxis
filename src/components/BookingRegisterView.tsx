import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, User } from '../types';
import { 
  Search, Download, Plus, Filter, Printer, 
  Eye, Edit3, Trash2, ArrowUpDown, Calendar 
} from 'lucide-react';

interface BookingRegisterViewProps {
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  user: User;
  onOpenNewBooking: () => void;
  onEditBooking: (booking: Booking) => void;
  onPrintVoucher: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

export const BookingRegisterView: React.FC<BookingRegisterViewProps> = ({
  bookings,
  drivers,
  vehicles,
  user,
  onOpenNewBooking,
  onEditBooking,
  onPrintVoucher,
  onCancelBooking
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (vehicleFilter !== 'ALL' && b.vehicle_type !== vehicleFilter) return false;
      if (startDate && b.pickup_date < startDate) return false;
      if (endDate && b.pickup_date > endDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const refMatch = b.booking_ref.toLowerCase().includes(q);
        const nameMatch = b.passenger_name.toLowerCase().includes(q);
        const phoneMatch = b.passenger_phone.toLowerCase().includes(q);
        const flightMatch = b.flight_number?.toLowerCase().includes(q);
        const locMatch = b.pickup_location.toLowerCase().includes(q) || b.dropoff_location.toLowerCase().includes(q);
        if (!refMatch && !nameMatch && !phoneMatch && !flightMatch && !locMatch) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, vehicleFilter, startDate, endDate, search]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Booking Reference',
      'Pickup Date',
      'Pickup Time',
      'Passenger Name',
      'Passenger Mobile',
      'WhatsApp',
      'Email',
      'Flight Number',
      'Terminal',
      'Pickup Location',
      'Drop-off Location',
      'Passengers',
      'Luggage',
      'Vehicle Type',
      'Assigned Driver',
      'Driver Phone',
      'Vehicle Registration',
      'Status',
      'Booking Source',
      'Customer Notes',
      'Driver Instructions',
      'Created At'
    ];

    const rows = filtered.map(b => [
      `"${b.booking_ref}"`,
      `"${b.pickup_date}"`,
      `"${b.pickup_time}"`,
      `"${b.passenger_name.replace(/"/g, '""')}"`,
      `"${b.passenger_phone}"`,
      `"${b.passenger_whatsapp || ''}"`,
      `"${b.passenger_email || ''}"`,
      `"${b.flight_number || ''}"`,
      `"${(b.airline_terminal || '').replace(/"/g, '""')}"`,
      `"${b.pickup_location.replace(/"/g, '""')}"`,
      `"${b.dropoff_location.replace(/"/g, '""')}"`,
      b.passenger_count,
      b.luggage_count,
      `"${b.vehicle_type}"`,
      `"${b.driver_name || 'Unassigned'}"`,
      `"${b.driver_phone || ''}"`,
      `"${b.vehicle_registration || ''}"`,
      `"${b.status}"`,
      `"${b.booking_source}"`,
      `"${(b.customer_notes || '').replace(/"/g, '""')}"`,
      `"${(b.driver_instructions || '').replace(/"/g, '""')}"`,
      `"${b.created_at}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gulftaxis_bookings_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Booking Register</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive audit record of all reservations and transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, passenger, phone, flight..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400"
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

          {/* Vehicle Type */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="Sedan">Sedan</option>
            <option value="Business Sedan">Business Sedan</option>
            <option value="SUV">SUV</option>
            <option value="GMC">GMC</option>
            <option value="Minivan">Minivan</option>
            <option value="Van">Van</option>
            <option value="Coaster">Coaster</option>
            <option value="Bus">Bus</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Passenger</th>
                <th className="py-3 px-3">Flight</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Driver</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No bookings found matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-teal-300">
                      {b.booking_ref}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums">
                      <div className="text-white font-semibold">{b.pickup_time}</div>
                      <div className="text-[10px] text-slate-400">{b.pickup_date}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{b.passenger_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{b.passenger_phone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {b.flight_number ? (
                        <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 font-semibold text-[11px]">
                          {b.flight_number}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-teal-300 font-medium">
                      {b.vehicle_type}
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate text-slate-300">
                      <div><strong className="text-slate-400">P:</strong> {b.pickup_location}</div>
                      <div><strong className="text-slate-400">D:</strong> {b.dropoff_location}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {b.driver_name || <span className="text-rose-400 text-xs">Unassigned</span>}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPrintVoucher(b)}
                          title="Print Voucher"
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditBooking(b)}
                          title="Edit Booking"
                          className="p-1 text-slate-400 hover:text-teal-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {b.status !== 'Cancelled' && (
                          <button
                            onClick={() => onCancelBooking(b)}
                            title="Cancel Booking"
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
