import React from 'react';
import { Brain } from 'lucide-react';

const PatientWaiting = ({ currentUser, onDebugClear }) => {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-bounce mb-6">
        <Brain className="w-20 h-20 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold mb-4">En attente du praticien...</h2>
      <p className="text-gray-600 mb-6">Connecté en tant que patient</p>
      <button 
        onClick={onDebugClear}
        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm border border-red-200 hover:bg-red-200 transition"
      >
        🗑️ DEBUG : Réinitialiser les sessions
      </button>
    </div>
  );
};

export default PatientWaiting;