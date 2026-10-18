import React, { useState, useMemo } from 'react';
import { Booking, Driver, Vehicle, User, DailyReportSummary } from '../types';
import { 
  FileText, Download, Calendar, Users, 
  Car, CheckCircle, XCircle, ArrowUpRight, Printer 
} from 'lucide-react';

interface ReportsViewProps {
  bookings: Booking[];
  drivers: Driver[];
  vehicles: Vehicle[];
  user: User;
  onPrintVoucher: (booking: Booking) => void;
}

type ReportType = 'daily' | 'drivers' | 'vehicles' | 'unassigned' | 'completed_cancelled';

export const ReportsView: React.FC<ReportsViewProps> = ({
  bookings,
  drivers,
  vehicles,
  user,
  onPrintVoucher
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('daily');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Daily Dispatch Metrics
  const dailyBookings = useMemo(() => {
    return bookings.filter(b => b.pickup_date === reportDate);
  }, [bookings, reportDate]);

  // Driver Performance stats
  const driverStats = useMemo(() => {
    return drivers.map(d => {
      const assigned = bookings.filter(b => b.assigned_driver_id === d.id);
      const completed = assigned.filter(b => b.status === 'Completed').length;
      const cancelled = assigned.filter(b => b.status === 'Cancelled').length;
      const active = assigned.filter(b => !['Completed', 'Cancelled'].includes(b.status)).length;
      return {
        driver: d,
        total: assigned.length,
        completed,
        cancelled,
        active
      };
    }).sort((a, b) => b.total - a.total);
  }, [drivers, bookings]);

  // Vehicle Utilization stats
  const vehicleStats = useMemo(() => {
    return vehicles.map(v => {
      const trips = bookings.filter(b => b.assigned_vehicle_id === v.id);
      const completed = trips.filter(b => b.status === 'Completed').length;
      return {
        vehicle: v,
        totalTrips: trips.length,
        completedTrips: completed
      };
    }).sort((a, b) => b.totalTrips - a.totalTrips);
  }, [vehicles, bookings]);

  // Unassigned Bookings
  const unassignedList = useMemo(() => {
    return bookings.filter(b => !b.assigned_driver_id && b.status !== 'Completed' && b.status !== 'Cancelled');
  }, [bookings]);

  // Completed & Cancelled Bookings
  const completedCancelledList = useMemo(() => {
    return bookings.filter(b => ['Completed', 'Cancelled', 'No Show'].includes(b.status));
  }, [bookings]);

  // Download Current Report as CSV
  const handleDownloadCSV = () => {
    let filename = `gulftaxis_${selectedReport}_report_${reportDate}.csv`;
    let csvData = '';

    if (selectedReport === 'daily') {
      csvData = 'Booking Ref,Time,Flight,Vehicle Type,Passenger,Phone,Pickup,Dropoff,Driver,Status\n';
      dailyBookings.forEach(b => {
        csvData += `"${b.booking_ref}","${b.pickup_time}","${b.flight_number || ''}","${b.vehicle_type}","${b.passenger_name}","${b.passenger_phone}","${b.pickup_location.replace(/"/g, '""')}","${b.dropoff_location.replace(/"/g, '""')}","${b.driver_name || 'Unassigned'}","${b.status}"\n`;
      });
    } else if (selectedReport === 'drivers') {
      csvData = 'Driver Name,Phone,License,Status,Total Trips,Active Trips,Completed Trips,Cancelled Trips\n';
      driverStats.forEach(s => {
        csvData += `"${s.driver.name}","${s.driver.phone}","${s.driver.license_no || ''}","${s.driver.availability}",${s.total},${s.active},${s.completed},${s.cancelled}\n`;
      });
    } else if (selectedReport === 'vehicles') {
      csvData = 'Registration,Make & Model,Type,Seat Capacity,Luggage Capacity,Availability,Total Trips\n';
      vehicleStats.forEach(v => {
        csvData += `"${v.vehicle.registration_no}","${v.vehicle.make_model}","${v.vehicle.vehicle_type}",${v.vehicle.passenger_capacity},${v.vehicle.luggage_capacity},"${v.vehicle.availability}",${v.totalTrips}\n`;
      });
    } else if (selectedReport === 'unassigned') {
      csvData = 'Booking Ref,Pickup Date,Time,Flight,Vehicle Type,Passenger,Phone,Pickup,Dropoff\n';
      unassignedList.forEach(b => {
        csvData += `"${b.booking_ref}","${b.pickup_date}","${b.pickup_time}","${b.flight_number || ''}","${b.vehicle_type}","${b.passenger_name}","${b.passenger_phone}","${b.pickup_location.replace(/"/g, '""')}","${b.dropoff_location.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvData = 'Booking Ref,Date,Time,Passenger,Status,Cancellation Reason,Driver,Created At\n';
      completedCancelledList.forEach(b => {
        csvData += `"${b.booking_ref}","${b.pickup_date}","${b.pickup_time}","${b.passenger_name}","${b.status}","${(b.cancellation_reason || '').replace(/"/g, '""')}","${b.driver_name || ''}","${b.created_at}"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Report Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Dispatch Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational summaries, fleet capacity audits, and trip histories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            title="Operational Report Date"
          />

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Categories Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setSelectedReport('daily')}
          className={`px-3 py-1.5 font-medium rounded-lg transition ${
            selectedReport === 'daily'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Daily Dispatch ({dailyBookings.length})
        </button>

        <button
          onClick={() => setSelectedReport('drivers')}
          className={`px-3 py-1.5 font-medium rounded-lg transition ${
            selectedReport === 'drivers'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Driver Performance
        </button>

        <button
          onClick={() => setSelectedReport('vehicles')}
          className={`px-3 py-1.5 font-medium rounded-lg transition ${
            selectedReport === 'vehicles'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Vehicle Utilization
        </button>

        <button
          onClick={() => setSelectedReport('unassigned')}
          className={`px-3 py-1.5 font-medium rounded-lg transition ${
            selectedReport === 'unassigned'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Unassigned Trips ({unassignedList.length})
        </button>

        <button
          onClick={() => setSelectedReport('completed_cancelled')}
          className={`px-3 py-1.5 font-medium rounded-lg transition ${
            selectedReport === 'completed_cancelled'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Completed & Cancelled
        </button>
      </div>

      {/* REPORT CONTENT: DAILY DISPATCH */}
      {selectedReport === 'daily' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Dispatch Log: {reportDate}</h3>
              <p className="text-xs text-slate-400">Total {dailyBookings.length} scheduled transfers</p>
            </div>
            <button
              onClick={() => window.print()}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Daily Sheet</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Flight</th>
                  <th className="py-3 px-3 text-teal-400">Vehicle Type</th>
                  <th className="py-3 px-3">Passenger & Phone</th>
                  <th className="py-3 px-3">Pickup Location</th>
                  <th className="py-3 px-3">Drop-off Destination</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {dailyBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">
                      No transfers recorded for {reportDate}.
                    </td>
                  </tr>
                ) : (
                  dailyBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-white tabular-nums">
                        {b.pickup_time}
                      </td>
                      <td className="py-3 px-3 font-mono text-teal-300 font-semibold">
                        {b.booking_ref}
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-400">
                        {b.flight_number || '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-teal-300">
                        {b.vehicle_type}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{b.passenger_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.passenger_phone}</div>
                      </td>
                      <td className="py-3 px-3 max-w-[180px] truncate text-slate-300">{b.pickup_location}</td>
                      <td className="py-3 px-3 max-w-[180px] truncate text-slate-300">{b.dropoff_location}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {b.driver_name || <span className="text-rose-400">Unassigned</span>}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onPrintVoucher(b)}
                          className="text-xs text-teal-400 hover:text-teal-300 underline"
                        >
                          Voucher
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: DRIVER PERFORMANCE */}
      {selectedReport === 'drivers' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Chauffeur Performance & Duty Audit</h3>
            <p className="text-xs text-slate-400">Total assignments across all recorded dispatches</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">License No.</th>
                  <th className="py-3 px-4">Current Duty</th>
                  <th className="py-3 px-4 text-center">Active Trips</th>
                  <th className="py-3 px-4 text-center">Completed Trips</th>
                  <th className="py-3 px-4 text-center">Total Trips</th>
                  <th className="py-3 px-4 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {driverStats.map((s) => (
                  <tr key={s.driver.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{s.driver.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{s.driver.phone}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{s.driver.license_no || 'Standard'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        s.driver.availability === 'on_duty'
                          ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {s.driver.availability}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-teal-300">{s.active}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{s.completed}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">{s.total}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">★ {s.driver.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: VEHICLE UTILIZATION */}
      {selectedReport === 'vehicles' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Vehicle Fleet Utilization Report</h3>
            <p className="text-xs text-slate-400">Analysis of trips performed per vehicle class and registration</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Plate No.</th>
                  <th className="py-3 px-4">Vehicle Make & Model</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-center">Completed Trips</th>
                  <th className="py-3 px-4 text-right">Total Dispatches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {vehicleStats.map((v) => (
                  <tr key={v.vehicle.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-300">{v.vehicle.registration_no}</td>
                    <td className="py-3 px-4 font-medium text-white">{v.vehicle.make_model}</td>
                    <td className="py-3 px-4 text-slate-300">{v.vehicle.vehicle_type}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{v.vehicle.passenger_capacity}p / {v.vehicle.luggage_capacity}b</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {v.vehicle.availability}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{v.completedTrips}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">{v.totalTrips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: UNASSIGNED TRIPS */}
      {selectedReport === 'unassigned' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Unassigned Trips Report</h3>
            <p className="text-xs text-rose-400">Bookings pending chauffeur and vehicle allocation</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3 text-teal-400">Vehicle Type</th>
                  <th className="py-3 px-3">Passenger</th>
                  <th className="py-3 px-3">Pickup</th>
                  <th className="py-3 px-3">Drop-off</th>
                  <th className="py-3 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {unassignedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-teal-400">
                      ✓ All upcoming bookings have been successfully assigned to drivers!
                    </td>
                  </tr>
                ) : (
                  unassignedList.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono">{b.pickup_date}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{b.pickup_time}</td>
                      <td className="py-3 px-3 font-mono text-teal-300 font-bold">{b.booking_ref}</td>
                      <td className="py-3 px-3 font-semibold text-teal-400">{b.vehicle_type}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{b.passenger_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.passenger_phone}</div>
                      </td>
                      <td className="py-3 px-3 max-w-[180px] truncate text-slate-300">{b.pickup_location}</td>
                      <td className="py-3 px-3 max-w-[180px] truncate text-slate-300">{b.dropoff_location}</td>
                      <td className="py-3 px-3 text-slate-400">{b.booking_source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: COMPLETED & CANCELLED */}
      {selectedReport === 'completed_cancelled' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Closed Bookings Register</h3>
            <p className="text-xs text-slate-400">Audit of finished transfers, cancellations, and no-shows</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Passenger</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Cancellation Note / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {completedCancelledList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono">{b.pickup_date}</td>
                    <td className="py-3 px-3 font-mono">{b.pickup_time}</td>
                    <td className="py-3 px-3 font-mono text-teal-300 font-semibold">{b.booking_ref}</td>
                    <td className="py-3 px-3 font-medium text-white">{b.passenger_name}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        b.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{b.driver_name || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 italic">
                      {b.cancellation_reason || b.internal_remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
