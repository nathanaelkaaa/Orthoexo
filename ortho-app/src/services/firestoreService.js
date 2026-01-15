import { 
  getFirestore,
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  query, 
  where,
  onSnapshot,
  orderBy,
  limit,
  arrayUnion,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Assurez-vous que le chemin est correct

// --- GESTION UTILISATEURS ---

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

// --- GESTION DES SESSIONS LIVE (TEMPS RÉEL) ---

// 1. Créer une session liée à l'ID du praticien (uid)
export const createSession = async (uid, type, words) => {
  try {
    // On crée une session active
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      practitionerId: uid, // C'est ce qui lie le patient au praticien (même compte)
      type: type,
      words: words,
      status: 'waiting', // waiting -> active -> finished
      createdAt: new Date().toISOString(),
      patientAnswers: [], // Liste des réponses
      score: 0
    });
    return sessionRef.id;
  } catch (error) {
    console.error("Erreur création session:", error);
    throw error;
  }
};

// 2. Le Patient écoute s'il y a un exercice actif pour son compte
export const listenForActiveSession = (uid, callback) => {
  const q = query(
    collection(db, 'sessions'),
    where('practitionerId', '==', uid)
  );

  return onSnapshot(q, (snapshot) => {
    // 1. On récupère toutes les sessions de l'utilisateur
    const allSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // 2. IMPORTANT : On ne garde que celles qui sont Active ou Finie
    // (On ignore les vieilles sessions 'waiting' ou buggées qui bloqueraient la vue)
  
    const validSessions = allSessions.filter(s => s.status === 'active' || s.status === 'finished' || s.status === 'waiting');

    // 3. On trie par date (la plus récente en premier)
    validSessions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    // 4. On prend la première de la liste filtrée
    const currentSession = validSessions[0];

    console.log("Sessions actives trouvées :", validSessions.length, "Session affichée :", currentSession, " All sessions", allSessions );

    if (currentSession) {
      callback(currentSession);
    } else {
      callback(null);
    }
  });
};

// 3. Le Praticien écoute une session spécifique (pour le monitoring)
export const observeSessionById = (sessionId, callback) => {
  return onSnapshot(doc(db, 'sessions', sessionId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() });
    }
  });
};

// 4. Mettre à jour le statut (ex: passer de 'waiting' à 'active' ou 'finished')
export const updateSessionStatus = async (sessionId, status) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, { status: status });
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

// 5. Le Patient envoie une réponse
export const sendAnswer = async (sessionId, answerData) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, {
    patientAnswers: arrayUnion(answerData)
  });
};

// 6. Debug supprime toutes les sessions en court
export const clearUserSessions = async (uid) => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('practitionerId', '==', uid)
    );
    const snapshot = await getDocs(q);
    
    // On supprime toutes les sessions trouvées une par une
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