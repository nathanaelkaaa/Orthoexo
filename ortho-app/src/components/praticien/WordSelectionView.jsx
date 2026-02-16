import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { createSession } from '../../services/firestoreService';
import GAME_TYPE from '../../constants/GAME_TYPE';
import AnagramExercise from '../exercises/AnagramExercise';
import MemoryExercise from '../exercises/MemoryExercise';
import HangmanExercise from '../exercises/HangmanExercise';
import SearchExercise from '../exercises/SearchExercise';
import PractitionerMonitor from './PractitionerMonitor';
import CustomWordList from './wordselection/CustomWordList';
import FrequencyWordList from './wordselection/FrequencyWordList';
import IrregularWordList from './wordselection/IrregularWordList';
import WordSourceSelection from './wordselection/WordSourceSelection';
import ExerciseTypeSelection from './ExerciseTypeSelection';

const WordSelectionView = ({ currentUser, onBack }) => {
  const [wordView, setWordView] = useState('selection');
  const [selectedWords, setSelectedWords] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // Charger les mots sauvegardés
  useEffect(() => {
    const savedWords = localStorage.getItem('selectedWords');
    if (savedWords) {
      try {
        setSelectedWords(JSON.parse(savedWords));
      } catch (error) {
        console.error('Erreur chargement mots sauvegardés:', error);
      }
    }
  }, []);

  // Sauvegarder les mots sélectionnés
  useEffect(() => {
    if (selectedWords.length > 0) {
      localStorage.setItem('selectedWords', JSON.stringify(selectedWords));
    }
  }, [selectedWords]);

  const handleCreateExercise = () => {
    if (selectedWords.length < 3) {
      alert('Veuillez sélectionner au moins 3 mots pour créer un exercice');
      return;
    }
    setWordView('exerciseType');
  };

  const handleLaunchForPatient = async (count = 10, type = "") => {
    if (selectedWords.length < 1) return alert("Sélectionnez des mots.");
    
    try {
      const sessionWords = [...selectedWords]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

      const sessionId = await createSession(currentUser.uid, type, sessionWords);
      setActiveSession({ 
        id: sessionId, 
        type: type, 
        words: sessionWords, 
        length: sessionWords.length,
        patientAnswers: [] 
      });
      setWordView('monitor');
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const handleClearSelection = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les mots sélectionnés ?')) {
      setSelectedWords([]);
      localStorage.removeItem('selectedWords');
    }
  };

  const saveExerciseToHistory = (type, words, results) => {
    const exercise = {
      id: Date.now(),
      type: type,
      words: words,
      results: results,
      date: new Date().toISOString(),
      score: results.filter(r => r.correct).length,
      total: results.length
    };

    const history = JSON.parse(localStorage.getItem('exerciseHistory') || '[]');
    history.unshift(exercise);
    
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('exerciseHistory', JSON.stringify(history));
  };

  if (wordView === 'monitor' && activeSession) {
    return (
      <div>
        <button 
          onClick={() => setWordView('selection')} 
          className="mb-6 flex items-center gap-2 text-gray-600"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Retour
        </button>
        <PractitionerMonitor 
          sessionData={activeSession} 
          onFinish={() => setWordView('selection')}
          saveExerciseToHistory={saveExerciseToHistory}
        />
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

      <h1 className="text-3xl font-bold mb-8">Gestion des Mots</h1>

      {wordView === 'selection' && (
        <WordSourceSelection 
          onSelectSource={(source) => setWordView(source)}
          selectedWords={selectedWords}
          onCreateExercise={handleCreateExercise}
          onClearSelection={handleClearSelection}
        />
      )}

      {wordView === 'frequency' && (
        <FrequencyWordList 
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          setSelectedWords={setSelectedWords}
        />
      )}

      {wordView === 'irregular' && (
        <IrregularWordList 
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          setSelectedWords={setSelectedWords}
        />
      )}

      {wordView === 'custom' && (
        <CustomWordList 
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          setSelectedWords={setSelectedWords}
        />
      )}

      {wordView === 'exerciseType' && (
        <ExerciseTypeSelection
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          onSelectType={(type) => setWordView('exercise-' + type)}
          onLaunchForPatient={handleLaunchForPatient}
        />
      )}

      {/* Vue Anagramme (Test Praticien) */}
      {wordView === 'exercise-anagram' && (
        <AnagramExercise
          selectedWords={selectedWords}
          onBack={() => setWordView('exerciseType')}
          onFinish={(results) => {
            saveExerciseToHistory(GAME_TYPE.anagram, selectedWords, results);
            setWordView('selection');
          }}
        />
      )}

      {/* Vue Memory (Test Praticien) */}
      {wordView === 'exercise-memory' && (
        <MemoryExercise
          selectedWords={selectedWords}
          onBack={() => setWordView('exerciseType')}
          onFinish={(results) => {
            saveExerciseToHistory(GAME_TYPE.memory, selectedWords, results);
            setWordView('selection');
          }}
        />
      )}

      {/* Vue Pendu (Test Praticien) */}
      {wordView === 'exercise-hangman' && (
        <HangmanExercise
          selectedWords={selectedWords}
          onBack={() => setWordView('exerciseType')}
          onFinish={(results) => {
            saveExerciseToHistory(GAME_TYPE.hangman, selectedWords, results);
            setWordView('selection');
          }}
        />
      )}

      {/* Vue Search (Test Praticien) */}
      {wordView === 'exercise-search' && (
        <SearchExercise
          selectedWords={selectedWords}
          onBack={() => setWordView('exerciseType')}
          onFinish={(results) => {
            saveExerciseToHistory('search', selectedWords, results);
            setWordView('selection');
          }}
        />
      )}

    </div>
  );
};

export default WordSelectionView;