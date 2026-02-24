import React, { useState } from 'react';
import { Calendar, Save, Trash2, AlertTriangle } from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'available' | 'busy' | 'appointment';
  title?: string;
}

const AvailabilitySettingView: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([
    {
      id: '1',
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      type: 'available'
    },
    {
      id: '2',
      day: 'Tuesday',
      startTime: '10:00',
      endTime: '15:00',
      type: 'available'
    },
    {
      id: '3',
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '17:00',
      type: 'available'
    },
    {
      id: '4',
      day: 'Thursday',
      startTime: '14:00',
      endTime: '18:00',
      type: 'available'
    },
    {
      id: '5',
      day: 'Friday',
      startTime: '09:00',
      endTime: '13:00',
      type: 'available'
    }
  ]);

  const [newSlot, setNewSlot] = useState<Omit<AvailabilitySlot, 'id'>>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
    type: 'available'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleAddSlot = () => {
    if (newSlot.startTime >= newSlot.endTime) {
      alert('End time must be after start time');
      return;
    }

    const newSlotWithId: AvailabilitySlot = {
      ...newSlot,
      id: Date.now().toString()
    };

    setSlots([...slots, newSlotWithId]);
    setNewSlot({
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      type: 'available'
    });
  };

  const handleRemoveSlot = (id: string) => {
    setSlots(slots.filter(slot => slot.id !== id));
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    alert('Availability settings saved successfully!');
  };

  const getSlotColor = (type: string) => {
    switch (type) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-red-100 text-red-800 border-red-200';
      case 'appointment': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Set Availability
          </h1>
          <p className="text-stone-600">
            Configure your available times for consultations
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2"
        >
          <Save size={18} /> Save Settings
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-bold text-blue-800">Important Information</h3>
          <p className="text-blue-700 text-sm mt-1">
            Your availability settings control when clients can book consultations with you. 
            Time slots marked as "Available" will be shown to clients for booking.
          </p>
        </div>
      </div>

      {/* Current Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900">Your Schedule</h2>
          <span className="text-stone-600">{slots.length} time slots</span>
        </div>
        
        <div className="space-y-3">
          {slots.map((slot) => (
            <div 
              key={slot.id} 
              className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <Calendar size={18} className="text-stone-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{slot.day}</h3>
                  <p className="text-stone-600 text-sm">
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSlotColor(slot.type)}`}>
                  {slot.type.charAt(0).toUpperCase() + slot.type.slice(1)}
                </span>
                <button 
                  onClick={() => handleRemoveSlot(slot.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {slots.length === 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <Calendar size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">No time slots configured</h3>
              <p className="text-stone-600">
                Add your available time slots to allow clients to book consultations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Slot */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Add New Time Slot</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Day</label>
            <select
              value={newSlot.day}
              onChange={(e) => setNewSlot({...newSlot, day: e.target.value})}
              className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Start Time</label>
            <select
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
              className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">End Time</label>
            <select
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
              className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
            <select
              value={newSlot.type}
              onChange={(e) => setNewSlot({...newSlot, type: e.target.value as any})}
              className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="appointment">Appointment Only</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleAddSlot}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar size={18} /> Add Time Slot
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xl font-bold text-stone-900 mb-4">How to Set Up Your Availability</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="mt-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">1</div>
            <div>
              <h3 className="font-bold text-stone-900">Select Your Available Days</h3>
              <p className="text-stone-600 mt-1">
                Choose the days of the week when you are available for consultations. 
                You can select multiple days and set different hours for each day.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">2</div>
            <div>
              <h3 className="font-bold text-stone-900">Set Time Ranges</h3>
              <p className="text-stone-600 mt-1">
                Define the start and end times for your available consultation periods. 
                Be sure to account for breaks between sessions.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">3</div>
            <div>
              <h3 className="font-bold text-stone-900">Choose Time Slot Types</h3>
              <p className="text-stone-600 mt-1">
                <span className="font-medium">Available:</span> Clients can book during these times<br />
                <span className="font-medium">Busy:</span> Times when you're unavailable<br />
                <span className="font-medium">Appointment Only:</span> Specialized times requiring advance booking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettingView;