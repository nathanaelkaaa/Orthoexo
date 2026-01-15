import React, { useState, useEffect } from 'react';
import { ArrowRight, BarChart3 } from 'lucide-react';

const HistoryView = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('exerciseHistory') || '[]');
    setHistory(savedHistory);
  };

  const deleteExercise = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      const updatedHistory = history.filter(ex => ex.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('exerciseHistory', JSON.stringify(updatedHistory));
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
      }
    }
  };

  const clearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ?')) {
      setHistory([]);
      setSelectedExercise(null);
      localStorage.removeItem('exerciseHistory');
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedExercise) {
    return (
      <div>
        <button 
          onClick={() => setSelectedExercise(null)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Retour à l'historique
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Détails de l'exercice</h2>
              <p className="text-gray-600">{formatDate(selectedExercise.date)}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {selectedExercise.score}/{selectedExercise.total}
              </div>
              <div className="text-gray-600">Score</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">
              Type : <span className="capitalize">{selectedExercise.type}</span>
            </p>
            <p className="text-blue-700 text-sm mt-1">
              Taux de réussite : {Math.round((selectedExercise.score / selectedExercise.total) * 100)}%
            </p>
          </div>

          <h3 className="text-xl font-bold mb-4">Résultats détaillés</h3>
          <div className="space-y-3">
            {selectedExercise.results.map((result, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  result.correct 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">
                      Mot : {result.word}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Réponse : {result.userAnswer || '(vide)'}
                    </p>
                  </div>
                  <div className={`text-2xl ${result.correct ? 'text-green-600' : 'text-red-600'}`}>
                    {result.correct ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour aux catégories
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Historique des exercices</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Tout effacer
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <BarChart3 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            Aucun exercice dans l'historique
          </h3>
          <p className="text-gray-500">Les exercices complétés apparaîtront ici</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((exercise) => (
            <div 
              key={exercise.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer"
              onClick={() => setSelectedExercise(exercise)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 capitalize">{exercise.type}</h3>
                    <p className="text-gray-500 text-sm">{formatDate(exercise.date)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteExercise(exercise.id);
                    }}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-4">
                  <div className="text-3xl font-bold">{exercise.score}/{exercise.total}</div>
                  <div className="text-sm opacity-90">
                    {Math.round((exercise.score / exercise.total) * 100)}% de réussite
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{exercise.words.length} mots utilisés</p>
                  <p className="mt-1">Cliquez pour voir les détails</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;