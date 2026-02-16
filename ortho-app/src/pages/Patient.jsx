import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { 
  listenForActiveSession,
  updateSessionStatus, 
  deleteSession 
} from '../services/firestoreService';
import PatientWaiting from '../components/patient/PatientWaiting';
import PatientReady from '../components/patient/PatientReady';

import AnagramResult from '../components/exercises/results/AnagramResult';
import MemoryResult from '../components/exercises/results/MemoryResult';
import HangmanResult from '../components/exercises/results/HangmanResult';
import SearchResult from '../components/exercises/results/SearchResult';

import AnagramExercise from '../components/exercises/AnagramExercise';
import MemoryExercise from '../components/exercises/MemoryExercise';
import HangmanExercise from '../components/exercises/HangmanExercise';
import SearchExercise from '../components/exercises/SearchExercise';

import GAME_TYPE from '../constants/GAME_TYPE';

const Patient = ({ currentUser, onBack }) => {
  const [view, setView] = useState('searching');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const unsubscribe = listenForActiveSession(currentUser.uid, (sessionData) => {
      if (sessionData) {
        setSession(sessionData);
        // Router de vues
        switch (sessionData.status) {
          case 'waiting': setView('ready'); break;
          case 'active': setView('active'); break;
          case 'completed': setView('result'); break;
          default: setView('searching');
        }
      } else {
        setSession(null);
        setView('searching');
      }
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleStartGame = async () => {
    if (session?.id) await updateSessionStatus(session.id, 'active');
  };

  const handleFinished = async () => {
    if (session?.id) await updateSessionStatus(session.id, 'completed');
  };

  const handleReturnToStart = async () => {
    if (session?.id) await deleteSession(session.id);
    setView('searching');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold">Espace Patient</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{currentUser?.email}</span>
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800">← Quitter</button>
          </div>
        </div>
      </nav>

      {view === 'searching' && (
        <PatientWaiting/>
      )}

      {view === 'ready' && session && (
        <PatientReady session={session} onStart={handleStartGame} />
      )}

      {/* Zone Exercices */}
      {view === 'active' && session && (
        <>
          {session.type === GAME_TYPE.anagram && (
            <AnagramExercise 
              session={session}
              isPatientMode={true}
              onFinish={handleFinished}
            />
          )}
          {session.type === GAME_TYPE.memory && (
            <MemoryExercise 
              session={session}
              isPatientMode={true}
              onFinish={handleFinished}
            />
          )}
          {session.type === GAME_TYPE.hangman && (
            <HangmanExercise 
              session={session}
              isPatientMode={true}
              onFinish={handleFinished}
            />
          )}
          {session.type === GAME_TYPE.search && (
            <SearchExercise 
              session={session}
              isPatientMode={true}
              onFinish={handleFinished}
            />
          )}
        </>
      )}

      {/* Zone Résultats */}
      {view === 'result' && session && (
        <>
          {session.type === GAME_TYPE.anagram && (
            <AnagramResult 
              session={session}
              onReturnToStart={handleReturnToStart}
            />
          )}
          
          {session.type === GAME_TYPE.memory && (
            <MemoryResult 
              session={session}
              onReturnToStart={handleReturnToStart}
            />
          )}
          {session.type === GAME_TYPE.hangman && (
            <HangmanResult 
              session={session}
              onReturnToStart={handleReturnToStart}
            />
          )}
          {session.type === GAME_TYPE.search && (
            <SearchResult 
              session={session}
              onReturnToStart={handleReturnToStart}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Patient;