import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { listenForActiveSession, clearUserSessions, updateSessionStatus, deleteSession } from '../services/firestoreService';
import PatientWaiting from '../components/patient/PatientWaiting';
import PatientReady from '../components/patient/PatientReady';
import PatientResult from '../components/patient/PatientResult';
import AnagramExercise from '../components/exercises/AnagramExercise';

const Patient = ({ currentUser, onBack }) => {
  const [status, setStatus] = useState('searching');
  const [session, setSession] = useState(null);

  // Écouter la session
  useEffect(() => {
    const unsubscribe = listenForActiveSession(currentUser.uid, (sessionData) => {
      if (sessionData) {
        setSession(sessionData);
        
        if (sessionData.status === 'finished') {
          setStatus('result');
        } else if (sessionData.status === 'active') {
          setStatus('active');
        } else if (sessionData.status === 'waiting') {
          setStatus('waiting');
        }
      } else {
        setSession(null); 
        setStatus('searching');
      }
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleDebugClear = async () => {
    if (window.confirm("DEBUG: Voulez-vous vraiment supprimer TOUTES les sessions en cours ?")) {
      await clearUserSessions(currentUser.uid);
      setSession(null);
      setStatus('searching');
      alert("Sessions nettoyées !");
    }
  };

  const handleFinished = async () => {
    setStatus('waiting_finish');
  };

  const handleReturnToStart = async () => {
    await deleteSession(session.id);
    setStatus('searching');
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
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Retour
            </button>
          </div>
        </div>
      </nav>

        
        {status === 'searching' && (
          // Vue : Recherche en cours
          <PatientWaiting 
            currentUser={currentUser}
            onDebugClear={handleDebugClear}
          />
        )}

        {(status === 'waiting' && session) && (
          // Vue : Session trouvée - Prêt à démarrer
          <PatientReady 
            session={session}
            onStatusChange={setStatus}
          />
        )}

        {(status === 'active' && session) && (
          // Vue : Exercice actif
          <AnagramExercise 
            session={session}
            isPatientMode={true}
            onFinish={() => setStatus('waiting_finish')}
          />
        )}

        {(status === 'waiting_finish' || status === 'result') && (
          // Vue : Résultat
          <PatientResult 
            session={session}
            onReturnToStart={handleReturnToStart}
          />
        )}
    </div>
  );
};

export default Patient;