import React, { useState, useEffect } from 'react';
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

  // Vue : Recherche en cours
  if (status === 'searching') {
    return (
      <PatientWaiting 
        currentUser={currentUser}
        onDebugClear={handleDebugClear}
      />
    );
  }

  // Vue : Session trouvée - Prêt à démarrer
  if (status === 'waiting' && session) {
    return (
      <PatientReady 
        session={session}
        onStatusChange={setStatus}
      />
    );
  }

  // Vue : Exercice actif
  if (status === 'active' && session) {
    return (
      <AnagramExercise 
        session={session}
        isPatientMode={true}
        onFinish={() => setStatus('waiting_finish')}
      />
    );
  }

  // Vue : Résultat
  if (status === 'waiting_finish' || status === 'result') {
    return (
      <PatientResult 
        session={session}
        onReturnToStart={handleReturnToStart}
      />
    );
  }

  return null;
};

export default Patient;