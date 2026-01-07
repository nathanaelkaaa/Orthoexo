import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where 
  } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  // Ajouter un praticien
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
  
  // Ajouter un patient
  export const addPatient = async (patientData) => {
    try {
      const docRef = await addDoc(collection(db, 'patients'), {
        ...patientData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  };
  
  // Ajouter un exercice
  export const addExercise = async (exerciseData) => {
    try {
      const docRef = await addDoc(collection(db, 'exercises'), {
        ...exerciseData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  };
  
  // Récupérer tous les patients d'un praticien
  export const getPractitionerPatients = async (practitionerId) => {
    try {
      const q = query(
        collection(db, 'patients'), 
        where('practitionerId', '==', practitionerId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  };