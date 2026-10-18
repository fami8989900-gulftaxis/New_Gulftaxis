import React, { useState, useEffect } from 'react';
import { Booking, Driver, Vehicle, VehicleType, BookingStatus, User } from '../types';
import { 
  X, Calendar, Clock, User as UserIcon, Phone, 
  Mail, Plane, MapPin, Users, Briefcase, Car, 
  FileText, Check, AlertTriangle, Copy, ShieldAlert 
} from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingToEdit?: Booking | null;
  drivers: Driver[];
  vehicles: Vehicle[];
  currentUser: User;
  onSave: (bookingData: Partial<Booking>) => Promise<void>;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  bookingToEdit,
  drivers,
  vehicles,
  currentUser,
  onSave
}) => {
  const isEditing = Boolean(bookingToEdit && bookingToEdit.id);

  // Form Fields
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [passengerName, setPassengerName] = useState<string>('');
  const [passengerPhone, setPassengerPhone] = useState<string>('');
  const [passengerWhatsapp, setPassengerWhatsapp] = useState<string>('');
  const [passengerEmail, setPassengerEmail] = useState<string>('');
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [airlineTerminal, setAirlineTerminal] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropoffLocation, setDropoffLocation] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [luggageCount, setLuggageCount] = useState<number>(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('Sedan');
  const [assignedDriverId, setAssignedDriverId] = useState<number | ''>('');
  const [assignedVehicleId, setAssignedVehicleId] = useState<number | ''>('');
  const [bookingSource, setBookingSource] = useState<string>('Direct Call');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [driverInstructions, setDriverInstructions] = useState<string>('');
  const [status, setStatus] = useState<BookingStatus>('Pending');
  const [internalRemarks, setInternalRemarks] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  useEffect(() => {
    if (bookingToEdit) {
      setPickupDate(bookingToEdit.pickup_date || '');
      setPickupTime(bookingToEdit.pickup_time || '');
      setPassengerName(bookingToEdit.passenger_name || '');
      setPassengerPhone(bookingToEdit.passenger_phone || '');
      setPassengerWhatsapp(bookingToEdit.passenger_whatsapp || '');
      setPassengerEmail(bookingToEdit.passenger_email || '');
      setFlightNumber(bookingToEdit.flight_number || '');
      setAirlineTerminal(bookingToEdit.airline_terminal || '');
      setPickupLocation(bookingToEdit.pickup_location || '');
      setDropoffLocation(bookingToEdit.dropoff_location || '');
      setPassengerCount(bookingToEdit.passenger_count || 1);
      setLuggageCount(bookingToEdit.luggage_count || 0);
      setVehicleType(bookingToEdit.vehicle_type || 'Sedan');
      setAssignedDriverId(bookingToEdit.assigned_driver_id || '');
      setAssignedVehicleId(bookingToEdit.assigned_vehicle_id || '');
      setBookingSource(bookingToEdit.booking_source || 'Direct Call');
      setCustomerNotes(bookingToEdit.customer_notes || '');
      setDriverInstructions(bookingToEdit.driver_instructions || '');
      setStatus(bookingToEdit.status || 'Pending');
      setInternalRemarks(bookingToEdit.internal_remarks || '');
    } else {
      // Default to today + 2 hours from now
      const now = new Date();
      now.setHours(now.getHours() + 2);
      setPickupDate(now.toISOString().split('T')[0]);
      setPickupTime(`${String(now.getHours()).padStart(2, '0')}:00`);
      setPassengerName('');
      setPassengerPhone('+971 ');
      setPassengerWhatsapp('');
      setPassengerEmail('');
      setFlightNumber('');
      setAirlineTerminal('');
      setPickupLocation('');
      setDropoffLocation('');
      setPassengerCount(1);
      setLuggageCount(1);
      setVehicleType('Sedan');
      setAssignedDriverId('');
      setAssignedVehicleId('');
      setBookingSource('Direct Call');
      setCustomerNotes('');
      setDriverInstructions('');
      setStatus('Pending');
      setInternalRemarks('');
    }
    setError(null);
    setCapacityWarning(null);
  }, [bookingToEdit, isOpen]);

  // Check vehicle capacity when pax count or vehicle type changes
  useEffect(() => {
    let maxPax = 4;
    let maxLug = 3;
    switch (vehicleType) {
      case 'Sedan':
      case 'Business Sedan':
        maxPax = 4; maxLug = 3; break;
      case 'SUV':
        maxPax = 6; maxLug = 5; break;
      case 'GMC':
      case 'Van':
        maxPax = 7; maxLug = 7; break;
      case 'Minivan':
        maxPax = 10; maxLug = 8; break;
      case 'Coaster':
        maxPax = 22; maxLug = 18; break;
      case 'Bus':
        maxPax = 50; maxLug = 45; break;
    }

    if (passengerCount > maxPax) {
      setCapacityWarning(
        `Warning: Passenger count (${passengerCount}) exceeds standard capacity for a ${vehicleType} (${maxPax} seats). Recommend selecting a larger vehicle class.`
      );
    } else if (luggageCount > maxLug) {
      setCapacityWarning(
        `Warning: Luggage count (${luggageCount}) exceeds typical boot volume for a ${vehicleType} (${maxLug} bags).`
      );
    } else {
      setCapacityWarning(null);
    }
  }, [passengerCount, luggageCount, vehicleType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate || !pickupTime) {
      setError('Pickup Date and Time in 24-hour format are required.');
      return;
    }
    if (!passengerName.trim()) {
      setError('Passenger Name is required.');
      return;
    }
    if (!passengerPhone.trim() || passengerPhone.trim() === '+971') {
      setError('Passenger Mobile Number with country code is required.');
      return;
    }
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      setError('Both Pickup Location and Drop-off Destination are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Booking> = {
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        passenger_name: passengerName.trim(),
        passenger_phone: passengerPhone.trim(),
        passenger_whatsapp: passengerWhatsapp.trim() || passengerPhone.trim(),
        passenger_email: passengerEmail.trim() || undefined,
        flight_number: flightNumber.trim() ? flightNumber.trim().toUpperCase() : undefined,
        airline_terminal: airlineTerminal.trim() || undefined,
        pickup_location: pickupLocation.trim(),
        dropoff_location: dropoffLocation.trim(),
        passenger_count: Number(passengerCount),
        luggage_count: Number(luggageCount),
        vehicle_type: vehicleType,
        assigned_driver_id: assignedDriverId ? Number(assignedDriverId) : null,
        assigned_vehicle_id: assignedVehicleId ? Number(assignedVehicleId) : null,
        booking_source: bookingSource,
        customer_notes: customerNotes.trim() || undefined,
        driver_instructions: driverInstructions.trim() || undefined,
        status: assignedDriverId && status === 'Pending' ? 'Assigned' : status,
        internal_remarks: internalRemarks.trim() || undefined,
        version: bookingToEdit ? bookingToEdit.version : 1
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save booking. Please review your input.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = () => {
    if (!bookingToEdit) return;
    // Keep all fields but unset ID/version
    const dup: Partial<Booking> = {
      ...bookingToEdit,
      id: undefined as any,
      booking_ref: undefined as any,
      status: 'Pending',
      internal_remarks: `[DUPLICATE of ${bookingToEdit.booking_ref}] ${bookingToEdit.internal_remarks || ''}`,
      version: 1
    };
    onSave(dup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#0d2137] border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {isEditing ? `Edit Booking #${bookingToEdit?.booking_ref}` : 'Create New Transport Booking'}
              </span>
              {isEditing && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                  v{bookingToEdit?.version}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Airport transfers, VIP charters, hotel dispatches, and intercity trips
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                title="Duplicate this booking"
              >
                <Copy className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Duplicate</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {capacityWarning && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{capacityWarning}</div>
            </div>
          )}

          {/* 1. Schedule & Timings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Schedule & 24-Hour Timing</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pickup Time (24-Hour Format: HH:MM) *
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* 2. Passenger Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              <span>2. Passenger Contact & Identity</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Passenger Name *
                </label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Lord Arthur Wellesley"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Number (with Country Code) *
                </label>
                <input
                  type="tel"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp Number (if different)
                </label>
                <input
                  type="tel"
                  value={passengerWhatsapp}
                  onChange={(e) => setPassengerWhatsapp(e.target.value)}
                  placeholder="Same as mobile or +44 7700..."
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional Email Address
                </label>
                <input
                  type="email"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  placeholder="passenger@domain.com"
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Flight & Airport Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              <span>3. Flight Details (Airport Transfers)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Flight Number (e.g. EK002, BA105, QR1004)
                </label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="EK002"
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Airline & Terminal
                </label>
                <input
                  type="text"
                  value={airlineTerminal}
                  onChange={(e) => setAirlineTerminal(e.target.value)}
                  placeholder="Emirates / DXB Terminal 3 Arrivals"
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* 4. Journey Locations & Capacity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>4. Routing & Vehicle Class</span>
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Dubai International Airport (DXB) Terminal 3 Arrivals Gate 2"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Drop-off Location *
                </label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="e.g. Burj Al Arab Jumeirah, Suite 1204"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Passenger Count *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Luggage Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={luggageCount}
                  onChange={(e) => setLuggageCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="Sedan">Sedan (4 pax, 3 lug)</option>
                  <option value="Business Sedan">Business Sedan (VIP Lexus)</option>
                  <option value="SUV">SUV (Land Cruiser / 6 pax)</option>
                  <option value="GMC">GMC (Yukon XL VIP / 7 pax)</option>
                  <option value="Minivan">Minivan (Toyota HiAce / 10 pax)</option>
                  <option value="Van">Van (Mercedes V-Class / 7 pax)</option>
                  <option value="Coaster">Coaster (Group Coach / 22 pax)</option>
                  <option value="Bus">Bus (Tour Coach / 50 pax)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Dispatch Allocation & Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              <span>5. Dispatch Allocation & Status</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Driver
                </label>
                <select
                  value={assignedDriverId}
                  onChange={(e) => {
                    const did = e.target.value ? Number(e.target.value) : '';
                    setAssignedDriverId(did);
                    if (did && !assignedVehicleId) {
                      const v = vehicles.find(veh => veh.assigned_driver_id === did);
                      if (v) setAssignedVehicleId(v.id);
                    }
                  }}
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="">-- Leave Unassigned --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.availability === 'on_duty' ? 'On Duty' : d.availability})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Fleet Vehicle
                </label>
                <select
                  value={assignedVehicleId}
                  onChange={(e) => setAssignedVehicleId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="">-- Auto-selected --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_no} - {v.make_model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trip Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
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
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Booking Source
              </label>
              <select
                value={bookingSource}
                onChange={(e) => setBookingSource(e.target.value)}
                className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
              >
                <option value="Direct Call">Direct Phone Call</option>
                <option value="Hotel Concierge">Hotel Concierge</option>
                <option value="Airport VIP Kiosk">Airport VIP Kiosk</option>
                <option value="Corporate Contract">Corporate Contract</option>
                <option value="Online Portal">Online Booking Portal</option>
                <option value="Partner Agency">Partner Travel Agency</option>
              </select>
            </div>
          </div>

          {/* 6. Special Instructions & Internal Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>6. Instructions & Internal Remarks</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer Notes (Voucher Visible)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Child seat requested, chilled water..."
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Driver Instructions (Internal)
                </label>
                <textarea
                  rows={2}
                  value={driverInstructions}
                  onChange={(e) => setDriverInstructions(e.target.value)}
                  placeholder="e.g. Meet at exit 3 with digital tablet nameboard..."
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Internal Remarks (Audit Trail)
              </label>
              <input
                type="text"
                value={internalRemarks}
                onChange={(e) => setInternalRemarks(e.target.value)}
                placeholder="Staff notes, verification reference..."
                className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-[11px] text-slate-500">
              {isEditing ? (
                <span>Last updated by {bookingToEdit?.last_updated_by_name || 'System'}</span>
              ) : (
                <span>Creating as {currentUser.full_name} ({currentUser.role})</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isEditing ? 'Save Changes' : 'Confirm & Create Booking'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
