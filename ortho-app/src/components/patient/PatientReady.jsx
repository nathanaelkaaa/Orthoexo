import React from 'react';
import { Play } from 'lucide-react';
import { updateSessionStatus } from '../../services/firestoreService';

const PatientReady = ({ session, onStatusChange }) => {
  const handleStartExercise = async () => {
    if (!session) return;
    try {
      await updateSessionStatus(session.id, 'active');
    } catch (error) {
      console.error("Erreur lancement:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border-2 border-blue-50">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Play className="w-10 h-10 text-blue-600 ml-1" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Séance Prête !</h2>
        <p className="text-gray-500 mb-8">Le praticien a préparé un exercice pour toi.</p>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 font-medium">Type d'exercice :</span>
            <span className="font-bold text-blue-600 capitalize">{session.type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Nombre de questions :</span>
            <span className="font-bold text-blue-600">{session.words.length}</span>
          </div>
        </div>

        <button 
          onClick={handleStartExercise}
          className="w-full py-4 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
        >
          Commencer l'exercice
        </button>
      </div>
    </div>
  );
};

export default PatientReady;