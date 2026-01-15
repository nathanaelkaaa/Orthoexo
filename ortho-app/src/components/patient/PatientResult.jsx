import React from 'react';

const PatientResult = ({ session, onReturnToStart }) => {
  const score = session?.patientAnswers?.filter(r => r.correct).length || 0;
  const total = session?.words?.length || 0;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-green-600 mb-4">Exercice Terminé !</h2>
        <p className="text-xl mt-4 mb-8">
          Votre score : <span className="font-bold">{score} / {total}</span>
        </p>
        <div className="flex flex-col gap-3">
          <p className="text-gray-500 text-sm">Le praticien va clore la session...</p>
          <button 
            onClick={onReturnToStart} 
            className="text-blue-600 underline hover:text-blue-800"
          >
            Retourner à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientResult;