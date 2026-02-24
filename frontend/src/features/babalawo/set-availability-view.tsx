import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SetAvailabilityView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Set Availability
          </h1>
          <p className="text-stone-600 text-lg">
            This feature is not yet implemented.
          </p>
        </div>
        <button 
          onClick={() => navigate('/practitioner/calendar')}
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back to Calendar
        </button>
      </div>
    </div>
  );
};

export default SetAvailabilityView;
