import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  query, 
  where,
  onSnapshot,
  arrayUnion,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';


// 1. Gestion utilisateurs

export const addPractitioner = async (practitionerData) => {
  try {
    const docRef = await addDoc(collection(db, 'practitioners'), {
      ...practitionerData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};


// 2. Cycle de vie des sessions (CRUD)

// Créer une session liée à l'ID du praticien
export const createSession = async (uid, type, words) => {
  try {
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      practitionerId: uid, // Lien Praticien <-> Patient
      type: type,
      words: words,
      status: 'waiting', // Cycles : waiting -> active -> completed
      createdAt: new Date().toISOString(),
      patientAnswers: [],
      score: 0
    });
    return sessionRef.id;
  } catch (error) {
    console.error("Erreur création session:", error);
    throw error;
  }
};

// Supprimer une session spécifique
export const deleteSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (error) {
    console.error("Erreur suppression session:", error);
    throw error;
  }
};

// OUTIL DEBUG : Supprimer toutes les sessions d'un praticien
export const clearUserSessions = async (uid) => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('practitionerId', '==', uid)
    );
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(document => 
      deleteDoc(doc(db, 'sessions', document.id))
    );
    
    await Promise.all(deletePromises);
    console.log("Toutes les sessions ont été supprimées.");
  } catch (error) {
    console.error("Erreur lors du nettoyage :", error);
    throw error;
  }
};


// 3. Listeners

// Côté Patient : Écoute la dernière session active ou terminée
export const listenForActiveSession = (uid, callback) => {
  const q = query(
    collection(db, 'sessions'),
    where('practitionerId', '==', uid)
  );

  return onSnapshot(q, (snapshot) => {
    const allSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filtrage : On garde 'completed' pour afficher l'écran de fin même après refresh
    const validSessions = allSessions.filter(s => 
      s.status === 'active' || 
      s.status === 'waiting' || 
      s.status === 'completed' 
    );

    // Tri par date : la plus récente en premier
    validSessions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    const currentSession = validSessions[0];

    if (currentSession) {
      callback(currentSession);
    } else {
      callback(null);
    }
  });
};

// Côté Praticien : Monitoring d'une session spécifique
export const observeSessionById = (sessionId, callback) => {
  return onSnapshot(doc(db, 'sessions', sessionId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() });
    }
  });
};


// 4. Mises à jour de l'état du jeu

// Changer le statut (waiting -> active -> completed)
export const updateSessionStatus = async (sessionId, status) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, { status: status });
};

// Enregistrer une réponse du patient
export const sendAnswer = async (sessionId, answerData) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, {
    patientAnswers: arrayUnion(answerData)
  });
};