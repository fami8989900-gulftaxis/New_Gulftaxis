import React from 'react';
import { Booking } from '../types';
import { Printer, X, Shield, Phone, Plane, MapPin, Calendar, Clock, Car, Users, Briefcase } from 'lucide-react';

interface BookingVoucherModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-full">
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Printer className="w-4 h-4 text-teal-400" />
            <span>Executive Booking Voucher Preview</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER DOCUMENT */}
        <div className="p-8 sm:p-10 space-y-6 bg-white text-slate-900 font-sans print:p-6" id="printable-voucher">
          {/* Header Brand Lockup */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0b192c] flex items-center justify-center text-teal-400 font-bold text-sm">
                  GT
                </div>
                <h1 className="text-xl font-black tracking-tight text-[#0b192c] uppercase">
                  Gulf Taxis Dispatch Cloud
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Luxury Chauffeur & Airport Transport Service · Gulf Region
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Support: +971 4 800 4853 · dispatch@gulftaxis.com
              </p>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Official Travel Voucher
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-teal-700 mt-1">
                {booking.booking_ref}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Status: <strong className="uppercase text-slate-800">{booking.status}</strong>
              </div>
            </div>
          </div>

          {/* Core Transfer Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Pickup Date</span>
              <span className="text-xs font-bold font-mono text-slate-900">{booking.pickup_date}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Pickup Time</span>
              <span className="text-xs font-bold font-mono text-slate-900">{booking.pickup_time} (24h)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Vehicle Class</span>
              <span className="text-xs font-bold text-teal-700">{booking.vehicle_type}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Capacity</span>
              <span className="text-xs font-mono font-medium text-slate-800">{booking.passenger_count} Pax / {booking.luggage_count} Bags</span>
            </div>
          </div>

          {/* Passenger & Flight Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5 p-4 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
                Passenger Information
              </h3>
              <div className="text-sm font-bold text-slate-900">{booking.passenger_name}</div>
              <div className="text-xs text-slate-600 font-mono">Mobile: {booking.passenger_phone}</div>
              {booking.passenger_whatsapp && (
                <div className="text-xs text-slate-600 font-mono">WhatsApp: {booking.passenger_whatsapp}</div>
              )}
              {booking.passenger_email && (
                <div className="text-xs text-slate-600">Email: {booking.passenger_email}</div>
              )}
            </div>

            <div className="space-y-1.5 p-4 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
                Flight & Terminal Details
              </h3>
              {booking.flight_number ? (
                <>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    Flight: {booking.flight_number}
                  </div>
                  <div className="text-xs text-slate-600">
                    Terminal: {booking.airline_terminal || 'International Arrivals'}
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    Chauffeur tracks flight arrival time automatically.
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 pt-2">
                  Direct city / hotel transfer (no incoming flight specified).
                </div>
              )}
            </div>
          </div>

          {/* Routing Details */}
          <div className="p-4 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
              Transfer Routing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <strong className="text-teal-700 block mb-0.5">● Pickup Point:</strong>
                <p className="text-slate-800 leading-relaxed">{booking.pickup_location}</p>
              </div>
              <div>
                <strong className="text-rose-700 block mb-0.5">■ Destination:</strong>
                <p className="text-slate-800 leading-relaxed">{booking.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Chauffeur Box */}
          <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                Assigned Chauffeur & Vehicle
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {booking.driver_name || 'Dispatch Chauffeur Pending Allocation'}
              </div>
              {booking.driver_phone && (
                <div className="text-xs text-slate-700 font-mono mt-0.5">
                  Direct Contact: {booking.driver_phone}
                </div>
              )}
            </div>

            {booking.vehicle_registration && (
              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Plate Registration
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 px-2 py-0.5 bg-white rounded border border-teal-300 inline-block mt-0.5">
                  {booking.vehicle_registration}
                </span>
                {booking.vehicle_model && (
                  <div className="text-[11px] text-slate-600 mt-0.5">{booking.vehicle_model}</div>
                )}
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {booking.customer_notes && (
            <div className="text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-700 block mb-0.5">Customer Instructions:</strong>
              <p className="text-slate-600 italic">"{booking.customer_notes}"</p>
            </div>
          )}

          {/* Footer Terms & Verification Barcode Simulation */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
            <div>
              <p>Please present this digital voucher or booking reference to your chauffeur.</p>
              <p className="mt-0.5">Gulf Taxis Dispatch Cloud · All Rights Reserved · Issued {booking.created_at}</p>
            </div>

            {/* Clean SVG Barcode Stamp */}
            <div className="text-center font-mono">
              <div className="tracking-widest font-bold text-slate-800">||| | |||| | ||||| ||| |||</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{booking.booking_ref}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
