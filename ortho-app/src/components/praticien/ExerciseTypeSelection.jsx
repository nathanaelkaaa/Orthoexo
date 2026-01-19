import { useState } from 'react';
import { ArrowRight, MessageSquare, Play } from 'lucide-react';
import GAME_TYPE from '../../constants/GAME_TYPE';

// Exercise Type Selection
const ExerciseTypeSelection = ({ onBack, selectedWords, onSelectType, onLaunchForPatient }) => {
  const maxPossible = selectedWords.length;
  const [exerciseCount, setExerciseCount] = useState(Math.min(10, maxPossible));  

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour à la sélection
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4">Choisissez le type d'exercice</h2>
        
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <p className="text-gray-600 font-medium">Mots disponibles : {selectedWords.length}</p>
            <p className="text-gray-500 text-sm">Combien de questions pour le patient ?</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="1" 
              max={maxPossible}
              value={exerciseCount}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (val > maxPossible) val = maxPossible;
                if (val < 1) val = 1;
                setExerciseCount(val);
              }}
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-gray-400 text-sm">/ {maxPossible}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer group relative">
          <div onClick={() => onSelectType('anagram')}>
            <MessageSquare className="w-16 h-16 text-blue-600 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-bold mb-2">Anagramme</h3>
            <p className="text-gray-600 text-sm mb-4">Retrouvez le mot correct à partir des lettres mélangées</p>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onLaunchForPatient) {
                onLaunchForPatient(exerciseCount,GAME_TYPE.anagram);
              }
            }}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 mt-2 font-bold shadow-md transition hover:scale-[1.02]"
          >
            <Play className="w-4 h-4" /> Lancer ({exerciseCount} questions)
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer group relative">
          <div onClick={() => onSelectType(GAME_TYPE.memory)}>
            <MessageSquare className="w-16 h-16 text-green-600 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-bold mb-2">Memory</h3>
            <p className="text-gray-600 text-sm mb-4">Retrouvez le mot correct à partir des lettres mélangées</p>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onLaunchForPatient) {
                onLaunchForPatient(exerciseCount,GAME_TYPE.memory);
              }
            }}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 mt-2 font-bold shadow-md transition hover:scale-[1.02]"
          >
            <Play className="w-4 h-4" /> Lancer ({exerciseCount} questions)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTypeSelection;