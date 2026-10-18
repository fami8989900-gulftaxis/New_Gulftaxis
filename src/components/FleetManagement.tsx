import React, { useState } from 'react';
import { Driver, Vehicle, VehicleType, DriverAvailability, VehicleAvailability, User } from '../types';
import { 
  Users, Car, Plus, Phone, MessageSquare, 
  ShieldCheck, AlertTriangle, Check, Edit3, Wrench 
} from 'lucide-react';

interface FleetManagementProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  user: User;
  onUpdateDriver: (id: number, updates: Partial<Driver>) => Promise<void>;
  onAddDriver: (driver: Partial<Driver>) => Promise<void>;
  onUpdateVehicle: (id: number, updates: Partial<Vehicle>) => Promise<void>;
  onAddVehicle: (vehicle: Partial<Vehicle>) => Promise<void>;
}

export const FleetManagement: React.FC<FleetManagementProps> = ({
  drivers,
  vehicles,
  user,
  onUpdateDriver,
  onAddDriver,
  onUpdateVehicle,
  onAddVehicle
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'drivers' | 'vehicles'>('drivers');

  // Driver Modal State
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverWhatsapp, setDriverWhatsapp] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [driverAvailability, setDriverAvailability] = useState<DriverAvailability>('on_duty');
  const [driverNotes, setDriverNotes] = useState('');

  // Vehicle Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehReg, setVehReg] = useState('');
  const [vehMakeModel, setVehMakeModel] = useState('');
  const [vehType, setVehType] = useState<VehicleType>('Sedan');
  const [vehPaxCap, setVehPaxCap] = useState(4);
  const [vehLugCap, setVehLugCap] = useState(3);
  const [vehAvailability, setVehAvailability] = useState<VehicleAvailability>('available');
  const [vehDriverId, setVehDriverId] = useState<number | ''>('');
  const [vehNotes, setVehNotes] = useState('');

  const [loading, setLoading] = useState(false);

  // Driver modal handlers
  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDriverName('');
    setDriverPhone('+971 ');
    setDriverWhatsapp('');
    setDriverLicense('');
    setDriverAvailability('on_duty');
    setDriverNotes('');
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (d: Driver) => {
    setEditingDriver(d);
    setDriverName(d.name);
    setDriverPhone(d.phone);
    setDriverWhatsapp(d.whatsapp || '');
    setDriverLicense(d.license_no || '');
    setDriverAvailability(d.availability);
    setDriverNotes(d.notes || '');
    setShowDriverModal(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverPhone.trim()) return;
    setLoading(true);
    try {
      const payload: Partial<Driver> = {
        name: driverName.trim(),
        phone: driverPhone.trim(),
        whatsapp: driverWhatsapp.trim() || driverPhone.trim(),
        license_no: driverLicense.trim() || undefined,
        availability: driverAvailability,
        notes: driverNotes.trim() || undefined
      };

      if (editingDriver) {
        await onUpdateDriver(editingDriver.id, payload);
      } else {
        await onAddDriver(payload);
      }
      setShowDriverModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Vehicle modal handlers
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehReg('');
    setVehMakeModel('');
    setVehType('Sedan');
    setVehPaxCap(4);
    setVehLugCap(3);
    setVehAvailability('available');
    setVehDriverId('');
    setVehNotes('');
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehReg(v.registration_no);
    setVehMakeModel(v.make_model);
    setVehType(v.vehicle_type);
    setVehPaxCap(v.passenger_capacity);
    setVehLugCap(v.luggage_capacity);
    setVehAvailability(v.availability);
    setVehDriverId(v.assigned_driver_id || '');
    setVehNotes(v.maintenance_notes || '');
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehReg.trim() || !vehMakeModel.trim()) return;
    setLoading(true);
    try {
      const payload: Partial<Vehicle> = {
        registration_no: vehReg.trim().toUpperCase(),
        make_model: vehMakeModel.trim(),
        vehicle_type: vehType,
        passenger_capacity: Number(vehPaxCap),
        luggage_capacity: Number(vehLugCap),
        availability: vehAvailability,
        assigned_driver_id: vehDriverId ? Number(vehDriverId) : null,
        maintenance_notes: vehNotes.trim() || undefined
      };

      if (editingVehicle) {
        await onUpdateVehicle(editingVehicle.id, payload);
      } else {
        await onAddVehicle(payload);
      }
      setShowVehicleModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('drivers')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeSubTab === 'drivers'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Chauffeurs & Drivers ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vehicles')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeSubTab === 'vehicles'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Fleet Vehicles ({vehicles.length})</span>
          </button>
        </div>

        <div>
          {activeSubTab === 'drivers' ? (
            <button
              onClick={handleOpenAddDriver}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chauffeur</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddVehicle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Fleet Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* DRIVERS SUB-TAB */}
      {activeSubTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="bg-[#0d2137]/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{d.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    License: {d.license_no || 'UAE Commercial'}
                  </div>
                </div>

                {/* Duty Toggle Button */}
                <button
                  onClick={() => onUpdateDriver(d.id, {
                    availability: d.availability === 'on_duty' ? 'off_duty' : 'on_duty'
                  })}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition ${
                    d.availability === 'on_duty'
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20'
                      : d.availability === 'on_trip'
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {d.availability === 'on_duty' ? 'On Duty' : d.availability === 'on_trip' ? 'On Trip' : 'Off Duty'}
                </button>
              </div>

              {/* Contact Links */}
              <div className="space-y-1 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <a href={`tel:${d.phone.replace(/\s+/g, '')}`} className="font-mono text-teal-400 hover:underline">
                    {d.phone}
                  </a>
                </div>
                {d.whatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">WhatsApp:</span>
                    <a href={`https://wa.me/${d.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="font-mono text-emerald-400 hover:underline">
                      {d.whatsapp}
                    </a>
                  </div>
                )}
                {d.assigned_vehicle_reg && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-mono text-slate-200">{d.assigned_vehicle_reg} ({d.assigned_vehicle_model})</span>
                  </div>
                )}
              </div>

              {d.notes && (
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                  "{d.notes}"
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-[11px] text-amber-400 font-semibold font-mono">
                  ★ {d.rating} Rating
                </span>
                <button
                  onClick={() => handleOpenEditDriver(d)}
                  className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VEHICLES SUB-TAB */}
      {activeSubTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-[#0d2137]/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300">
                      {v.registration_no}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {v.vehicle_type}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-1">
                    {v.make_model}
                  </h3>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  v.availability === 'available'
                    ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                    : v.availability === 'in_use'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {v.availability === 'available' ? 'Available' : v.availability === 'in_use' ? 'In Use' : 'Maintenance'}
                </span>
              </div>

              {/* Capacities */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[11px] block">Seats Capacity</span>
                  <span className="text-white font-bold">{v.passenger_capacity} Passengers</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Luggage Trunk</span>
                  <span className="text-white font-bold">{v.luggage_capacity} Suitcases</span>
                </div>
              </div>

              {v.assigned_driver_name && (
                <div className="text-xs text-slate-400">
                  <span>Assigned Driver: </span>
                  <strong className="text-slate-200">{v.assigned_driver_name}</strong>
                </div>
              )}

              {v.maintenance_notes && (
                <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                  Note: {v.maintenance_notes}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => onUpdateVehicle(v.id, {
                    availability: v.availability === 'available' ? 'maintenance' : 'available'
                  })}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Toggle Maintenance
                </button>
                <button
                  onClick={() => handleOpenEditVehicle(v)}
                  className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Vehicle</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Driver Add/Edit Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0d2137] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingDriver ? 'Edit Chauffeur Details' : 'Register New Driver'}
            </h3>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Tariq Mansoor"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mobile Phone (with country code) *</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={driverWhatsapp}
                  onChange={(e) => setDriverWhatsapp(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Commercial License Number</label>
                <input
                  type="text"
                  value={driverLicense}
                  onChange={(e) => setDriverLicense(e.target.value)}
                  placeholder="UAE-COMM-89102"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Availability</label>
                <select
                  value={driverAvailability}
                  onChange={(e) => setDriverAvailability(e.target.value as DriverAvailability)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="on_duty">On Duty</option>
                  <option value="off_duty">Off Duty</option>
                  <option value="on_trip">On Active Trip</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  placeholder="Languages, VIP protocol certified, airport badge..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
                >
                  {loading ? 'Saving...' : 'Save Chauffeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Add/Edit Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0d2137] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingVehicle ? 'Edit Vehicle Details' : 'Add Vehicle to Fleet'}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Plate Number *</label>
                  <input
                    type="text"
                    value={vehReg}
                    onChange={(e) => setVehReg(e.target.value)}
                    placeholder="DXB-K-4921"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Vehicle Type *</label>
                  <select
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value as VehicleType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                  >
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
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Make & Model *</label>
                <input
                  type="text"
                  value={vehMakeModel}
                  onChange={(e) => setVehMakeModel(e.target.value)}
                  placeholder="e.g. Lexus ES 350 Luxury"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Passenger Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={vehPaxCap}
                    onChange={(e) => setVehPaxCap(parseInt(e.target.value, 10) || 4)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Luggage Capacity</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={vehLugCap}
                    onChange={(e) => setVehLugCap(parseInt(e.target.value, 10) || 3)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Availability</label>
                <select
                  value={vehAvailability}
                  onChange={(e) => setVehAvailability(e.target.value as VehicleAvailability)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Maintenance / Service Notes</label>
                <textarea
                  rows={2}
                  value={vehNotes}
                  onChange={(e) => setVehNotes(e.target.value)}
                  placeholder="Next oil service at 60k km, tire check..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
                >
                  {loading ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
