import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { observeSessionById, deleteSession } from '../../services/firestoreService';

const PractitionerMonitor = ({ sessionData, onFinish, saveExerciseToHistory }) => {
  const [liveData, setLiveData] = useState(sessionData);
  const answers = liveData.patientAnswers || [];
  const isFinished = answers.length >= liveData.words.length;

  useEffect(() => {
    const unsubscribe = observeSessionById(sessionData.id, (data) => setLiveData(data));
    return () => unsubscribe();
  }, [sessionData.id]);

  useEffect(() => {
    console.log("IsFinished : ", isFinished, " session?.id : ", sessionData?.id);
    //Suppimer la session
    const autoDelete = async () => {
        if (isFinished == true){
          if (sessionData?.id) {
            try {
              console.log("Suppression automatique de la session...");
              await deleteSession(sessionData.id);
            } catch (error) {
              console.error("Erreur lors de la suppression auto:", error);
            }
          }
            
        }
    };
    if (isFinished) {
        setTimeout(() => {
            autoDelete();
        }, 10000);
    }
    }, [isFinished,sessionData.id]);

  const handleFinishAndSave = async () => {
    saveExerciseToHistory(liveData.type, liveData.words, answers);
    onFinish();
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          Suivi Patient en Direct
        </h2>
        <div className="text-gray-500">
          Progression : {answers.length} / {liveData.words.length}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold mb-4">Mots et Réponses</h3>
          <ul className="space-y-2">
            {liveData.words.map((word, idx) => {
              const answer = answers[idx];
              const statusColor = answer 
                ? (answer.correct ? "text-green-600 font-bold" : "text-red-600 font-bold") 
                : "text-gray-400";
              return (
                <li 
                  key={idx} 
                  className={`flex items-center justify-between p-3 bg-gray-50 rounded ${statusColor}`}
                >
                  <span>{word}</span>
                  <span className="flex items-center gap-2">
                    {answer ? answer.userAnswer : "..."} 
                    {answer && (answer.correct 
                      ? <Check className="w-4 h-4" /> 
                      : <X className="w-4 h-4" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl flex flex-col justify-center text-center">
          <h3 className="text-xl font-bold mb-2">Note actuelle</h3>
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {answers.filter(a => a.correct).length} / {answers.length}
          </div>
          {isFinished ? (
            <button 
              onClick={handleFinishAndSave} 
              className="mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
            >
              Terminer & Sauvegarder
            </button>
          ) : (
            <p className="text-gray-500 mt-4">Le patient est en train de répondre...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PractitionerMonitor;