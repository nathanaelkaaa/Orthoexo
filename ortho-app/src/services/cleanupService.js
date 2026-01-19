import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';


/***
 * Outil de debug:
 * Supprime les doublons dans la bdd
 */
export const removeDuplicateWords = async () => {
  console.log("Démarrage du nettoyage des doublons...");
  
  try {
    const snapshot = await getDocs(collection(db, 'words'));
    console.log(`Analyse de ${snapshot.size} documents...`);

    const seenWords = new Set();
    const duplicatesToDelete = [];
    let keptCount = 0;

    // Identifier les doublons
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // On normalise (: )minuscule et sans espaces inutiles)
      const wordNormalized = data.word ? data.word.toLowerCase().trim() : null;

      if (!wordNormalized) return; // Ignorer les docs sans champ 'word'

      if (seenWords.has(wordNormalized)) {
        // C'est un doublon, on sauvegarde
        duplicatesToDelete.push(docSnapshot.ref);
      } else {
        // C'est la première fois qu'on voit ce mot, on le garde
        seenWords.add(wordNormalized);
        keptCount++;
      }
    });

    console.log(`Résultat analyse : ${keptCount} mots uniques, ${duplicatesToDelete.length} doublons trouvés.`);

    if (duplicatesToDelete.length === 0) {
      alert("Aucun doublon trouvé !");
      return;
    }

    if (!window.confirm(`ATTENTION : Vous allez supprimer ${duplicatesToDelete.length} doublons définitivement. Continuer ?`)) {
      return;
    }

    // Supprimer par lots de 500 (Limite Firestore)
    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(duplicatesToDelete.length / BATCH_SIZE);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = writeBatch(db);
      const start = i * BATCH_SIZE;
      const end = start + BATCH_SIZE;
      const batchChunk = duplicatesToDelete.slice(start, end);

      batchChunk.forEach((docRef) => {
        batch.delete(docRef);
      });

      await batch.commit();
      console.log(`Lot ${i + 1}/${totalBatches} supprimé (${batchChunk.length} docs)`);
    }

    alert(`Nettoyage terminé ! ${duplicatesToDelete.length} doublons supprimés.`);

  } catch (error) {
    console.error("Erreur lors du nettoyage :", error);
    alert("Erreur lors du nettoyage (voir console)");
  }
};
