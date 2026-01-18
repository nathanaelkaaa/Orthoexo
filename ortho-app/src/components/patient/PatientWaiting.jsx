import React from 'react';
import { Brain } from 'lucide-react';

const PatientWaiting = ({ currentUser, onDebugClear }) => {
  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-bounce mb-6">
        <Brain className="w-20 h-20 text-purple-600" />
      </div>
      <h2 className="text-2xl font-bold mb-4">En attente du praticien...</h2>
      <p className="text-gray-600 mb-6">Connecté en tant que patient</p>
    </div>
  );
};

export default PatientWaiting;