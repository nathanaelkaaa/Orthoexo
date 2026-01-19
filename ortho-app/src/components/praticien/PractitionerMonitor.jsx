import React, { useState, useEffect } from 'react';
import { Check, X, Clock, RefreshCw, Brain } from 'lucide-react';
import { observeSessionById, deleteSession } from '../../services/firestoreService';
import GAME_TYPE from '../../constants/GAME_TYPE';
import GAME_LABELS from '../../constants/GAME_LABELS';

const PractitionerMonitor = ({ sessionData, onFinish, saveExerciseToHistory }) => {
  const [liveData, setLiveData] = useState(sessionData);
  const answers = liveData.patientAnswers || [];
  const gameType = liveData.type; // 'anagram' ou 'memory'
  console.log("liveData, ",liveData.type)

  //TODO Chelou ça un peu
  // Logique de fin différente selon le jeu
  const isFinished = gameType === 'anagram'
    ? answers.length >= (liveData.words?.length || 0)
    : answers.some(a => a.completed === true); // Pour le Memory, on cherche l'objet de fin

  // Observation temps réel Firestore
  useEffect(() => {
    const unsubscribe = observeSessionById(sessionData.id, (data) => {
      if (data) setLiveData(data);
    });
    return () => unsubscribe();
  }, [sessionData.id]);

  // Suppression Automatique
  useEffect(() => {
    console.log("État session:", { isFinished, id: sessionData?.id });
    
    const autoDelete = async () => {
      if (isFinished && sessionData?.id) {
        try {
          console.log("Suppression automatique de la session...");
          await deleteSession(sessionData.id);
        } catch (error) {
          console.error("Erreur lors de la suppression auto:", error);
        }
      }
    };

    if (isFinished) {
      // Délai de 10 secondes avant suppression pour laisser le temps de voir les résultats
      const timer = setTimeout(() => {
        autoDelete();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFinished, sessionData.id]);

  const handleFinishAndSave = () => {
    // On sauvegarde les résultats dans l'historique local du praticien
    saveExerciseToHistory(gameType, liveData.words, answers);
    onFinish();
  };

  const renderGameContent = () => {
  switch (gameType) {
    case GAME_TYPE.anagram:
      return renderAnagramView();
    case GAME_TYPE.memory:
      return renderMemoryView();
    default:
      return <div>Sélectionnez un jeu</div>;
  }
};

  // --- RENDU : VUE ANAGRAMME ---
  const renderAnagramView = () => (
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          Mots et Réponses
        </h3>
        <ul className="space-y-2 max-h-[400px] overflow-y-auto">
          {liveData.words.map((word, idx) => {
            // On cherche la réponse correspondant à ce mot (ou par index si séquentiel)
            // Ici on assume que l'ordre est conservé ou on match par mot
            const answer = answers.find(a => a.word === word) || answers[idx];
            
            const statusColor = answer 
              ? (answer.correct ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200") 
              : "bg-gray-50 text-gray-400 border-gray-200";

            return (
              <li 
                key={idx} 
                className={`flex items-center justify-between p-3 rounded border ${statusColor}`}
              >
                <span className="font-medium">{word}</span>
                <span className="flex items-center gap-2">
                  {answer ? (
                    <>
                      <span className="font-bold">{answer.userAnswer}</span>
                      {answer.correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </>
                  ) : (
                    <span className="text-sm italic">En attente...</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl flex flex-col justify-center text-center h-fit">
        <h3 className="text-xl font-bold mb-2">Note actuelle</h3>
        <div className="text-6xl font-black text-blue-600 mb-2">
          {answers.filter(a => a.correct).length} <span className="text-3xl text-gray-400 font-normal">/ {liveData.words.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${(answers.length / liveData.words.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Progression</p>
      </div>
    </div>
  );

  // --- RENDU : VUE MEMORY ---
  const renderMemoryView = () => {
    // Dans le cas du memory, la réponse est souvent un objet unique à la fin
    const result = answers.find(a => a.completed === true);

    return (
      <div className="flex flex-col items-center justify-center py-8">
        {!result ? (
          <div className="text-center p-12 bg-gray-50 rounded-xl w-full border-2 border-dashed border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-700">Le patient est en train de jouer...</h3>
            <p className="text-gray-500 mt-2">Attente des résultats finaux</p>
            <p className="text-sm text-gray-400 mt-4">Grille de {liveData.words.length * 2} cartes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="bg-purple-50 p-8 rounded-xl text-center border border-purple-100">
              <RefreshCw className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-gray-600 font-medium uppercase tracking-wider text-sm">Coups joués</h3>
              <p className="text-5xl font-black text-purple-700 mt-2">{result.moves}</p>
            </div>

            <div className="bg-blue-50 p-8 rounded-xl text-center border border-blue-100">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-gray-600 font-medium uppercase tracking-wider text-sm">Temps</h3>
              <p className="text-5xl font-black text-blue-700 mt-2">{result.duration}s</p>
            </div>
            
            <div className="col-span-2 bg-green-50 p-6 rounded-xl text-center border border-green-100 mt-4">
               <h3 className="text-green-800 font-bold text-lg mb-1">Exercice Terminé !</h3>
               <p className="text-green-600">Toutes les paires ont été trouvées.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-5xl mx-auto border border-gray-100">
      {/* En-tête Commun */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFinished ? 'bg-gray-400' : 'bg-green-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isFinished ? 'bg-gray-500' : 'bg-green-500'}`}></span>
            </span>
            Suivi Patient en Direct
          </h2>
          <p className="text-gray-500 text-sm mt-1 ml-6">
            Exercice : <span className="font-semibold capitalize">{GAME_LABELS[gameType]}</span>
          </p>
        </div>
        
        <div className="text-right">
          {isFinished && (
            <button 
              onClick={handleFinishAndSave} 
              className="py-2.5 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md transition transform hover:scale-105 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Terminer & Sauvegarder
            </button>
          )}
        </div>
      </div>

      {renderGameContent()}

    </div>
  );
};

export default PractitionerMonitor;