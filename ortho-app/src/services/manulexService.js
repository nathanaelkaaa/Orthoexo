import * as XLSX from 'xlsx';
import { collection, getDocs, query, where, orderBy, writeBatch, doc, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';

// Liste étendue de mots irréguliers en français
const IRREGULAR_WORDS = [
  'monsieur', 'mer', 'sens', 'ville', 'ours', 'village', 'blanc', 'femme', 'hiver', 'escroc',
  'dix', 'fils', 'six', 'fait', 'corps', 'sept', 'longtemps', 'mille', 'huit', 'hier', 
  'clown', 'fer', 'deuxième', 'gentil', 'compte', 'doigt', 'bonhomme', 'vingt', 'moyen', 'but', 
  'automne', 'fusil', 'cher', 'sang', 'tranquille', 'bonheur', 'étang', 'banc', 'fier', 'client', 
  'cueillir', 'exact', 'cerf-volant', 'tronc', 'compter', 'football', 'parfum', 'tennis', 'aiguille', 'orchestre', 
  'août', 'rang', 'clef', 'sud', 'seconde', 'mars', 'ver', 'estomac', 'poêle', 'goal',
  'aspect', 'galop', 'outil', 'aquarium', 'stop', 'porc', 'ananas', 'plomb', 'square', 'jadis', 
  'examen', 'club', 'camping', 'respect', 'caoutchouc', 'faisan', 'hamster', 'parasol', 'ketchup', 'gadget',
  'franc', 'science', 'parking', 'tabac', 'net', 'écho', 'vingtaine', 'oignon', 'ressembler', 'prompt',
  'impatience', 'week-end', 'baptême', 'patient', 'shampooing', 'oasis', 'igloo', 'cake', 'alcool', 'persil', 
  'sixième', 'sandwich', 'cactus', 'cow-boy', 'paon', 'cercueil', 'short', 'technique', 'chronomètre', 'suspence', 
  'instinct', 'chorale', 'septième', 'pizza', 'million', 'basket', 'dixième', 'hareng', 'sourcil', 'surf', 
  'croc', 'jogging', 'jaguar', 'compteur', 'ranch', 'hall', 'slalom', 'scupter', 'sprint', 'accroc', 
  'totem', 'équateur', 'nerf', 'chut', 'poing', 'rush', 'rhinocéros', 'évidemment', 'accueil', 'puzzle', 
  'prudemment', 'gars', 'cap', 'chœur', 'gentilhomme', 'ping-pong', 'violemmment', 'orgueil', 'rhum', 'revolver', 
  'stand', 'conscience', 'kayak', 'fréquemment', 'jean', 'chrysalide', 'moelleux', 'penalty', 'chewing-gum', 'martien', 
  'agenda', 'crawl', 'tee-shirt', 'chlorophylle', 'bourg', 'gnome', 'aquarelle', 'chronologie', 'cacahuète', 'promp', 
  'yacht'
];

const WORDS_PER_PAGE = 50; // Nombre de mots par page

// Parser le fichier Excel Manulex
export const parseManulexFile = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return jsonData;
  } catch (error) {
    console.error('Erreur parsing Manulex:', error);
    throw error;
  }
};

// Transformer les données Manulex en format standardisé
export const transformManulexData = (rawData) => {
  const irregularWordsSet = new Set(IRREGULAR_WORDS.map(w => w.toLowerCase()));

  return rawData.map(row => {
    const word = row['LEMMES'];
    const syntax = row['SYNT'];
    const numLetters = row['NLET'];
    
    const cpFreq = parseFloat(row['CP F'] || 0);
    const ce1Freq = parseFloat(row['CE1 F'] || 0);
    const ce2cm2Freq = parseFloat(row['CE2-CM2 F'] || 0);
    const globalFreq = parseFloat(row['CP-CM2 F'] || 0);
    
    let level = 'CE2-CM2';
    
    if (cpFreq > 0) {
      level = 'CP';
    } else if (ce1Freq > 0) {
      level = 'CE1';
    } else if (ce2cm2Freq > 0) {
      level = 'CE2-CM2';
    }
    
    const isIrregular = irregularWordsSet.has(word?.toLowerCase());
    
    return {
      word: word,
      level: level,
      isIrregular: isIrregular,
      frequency: globalFreq,
      cpFreq: cpFreq,
      ce1Freq: ce1Freq,
      ce2cm2Freq: ce2cm2Freq,
      syntax: syntax,
      numLetters: numLetters,
      cpDispersion: parseFloat(row['CP D'] || 0),
      ce1Dispersion: parseFloat(row['CE1 D'] || 0),
      ce2cm2Dispersion: parseFloat(row['CE2-CM2 D'] || 0)
    };
  }).filter(item => item.word && item.word.length > 0);
};

// Importer les mots SANS doublons
export const importWordsToFirestore = async (words, progressCallback) => {
  try {
    const existingWordsSnapshot = await getDocs(collection(db, 'words'));
    const existingWords = new Set(
      existingWordsSnapshot.docs.map(doc => doc.data().word.toLowerCase())
    );
    
    console.log(`Mots existants dans la base : ${existingWords.size}`);
    
    const newWords = words.filter(wordData => 
      !existingWords.has(wordData.word.toLowerCase())
    );
    
    console.log(`Nouveaux mots à importer : ${newWords.length}`);
    console.log(`Doublons ignorés : ${words.length - newWords.length}`);
    
    const batchSize = 500;
    let count = 0;
    
    for (let i = 0; i < newWords.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchWords = newWords.slice(i, i + batchSize);
      
      batchWords.forEach(wordData => {
        const docRef = doc(collection(db, 'words'));
        batch.set(docRef, wordData);
      });
      
      await batch.commit();
      count += batchWords.length;
      
      if (progressCallback) {
        progressCallback(count, newWords.length);
      }
      
      console.log(`${count}/${newWords.length} nouveaux mots importés...`);
    }
    
    const totalInDB = existingWords.size + newWords.length;
    
    return { 
      success: true, 
      imported: count,
      duplicates: words.length - newWords.length,
      total: totalInDB
    };
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    throw error;
  }
};

// Supprimer TOUS les mots de la base
export const clearAllWords = async (progressCallback) => {
  try {
    const wordsSnapshot = await getDocs(collection(db, 'words'));
    const batchSize = 500;
    let count = 0;
    
    const allDocs = wordsSnapshot.docs;
    const total = allDocs.length;
    
    for (let i = 0; i < allDocs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = allDocs.slice(i, i + batchSize);
      
      batchDocs.forEach(document => {
        batch.delete(document.ref);
      });
      
      await batch.commit();
      count += batchDocs.length;
      
      if (progressCallback) {
        progressCallback(count, total);
      }
      
      console.log(`${count}/${total} mots supprimés...`);
    }
    
    console.log('Suppression terminée !', count, 'mots supprimés');
    return { success: true, count: count };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
};

// Récupérer les mots par niveau avec pagination
export const getWordsByLevelPaginated = async (level, sortBy = 'frequency', pageNumber = 1, searchTerm = '') => {
  try {
    const wordsCollection = collection(db, 'words');
    const constraints = [where('level', '==', level)];
    
    // Déterminer l'ordre de tri
    let orderByField = 'frequency';
    let orderByDirection = 'desc';
    
    if (sortBy === 'alphabetical') {
      orderByField = 'word';
      orderByDirection = 'asc';
    } else if (sortBy === 'frequency') {
      orderByField = 'frequency';
      orderByDirection = 'desc';
    }
    
    // Si pas de recherche, utiliser la pagination Firestore native
    if (!searchTerm) {
      constraints.push(orderBy(orderByField, orderByDirection));
      constraints.push(limit(WORDS_PER_PAGE));
      
      // Si ce n'est pas la première page, on utilise startAfter
      if (pageNumber > 1) {
        // Pour paginer correctement, il faut récupérer le dernier document de la page précédente
        // Pour simplifier, on va récupérer tous les documents jusqu'à la page actuelle
        const skipCount = (pageNumber - 1) * WORDS_PER_PAGE;
        const previousQuery = query(wordsCollection, ...constraints.slice(0, -1), limit(skipCount));
        const previousSnapshot = await getDocs(previousQuery);
        
        if (previousSnapshot.docs.length > 0) {
          const lastDoc = previousSnapshot.docs[previousSnapshot.docs.length - 1];
          const paginatedQuery = query(
            wordsCollection,
            ...constraints.slice(0, -1),
            startAfter(lastDoc),
            limit(WORDS_PER_PAGE)
          );
          const querySnapshot = await getDocs(paginatedQuery);
          
          return {
            words: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            hasMore: querySnapshot.docs.length === WORDS_PER_PAGE
          };
        }
      }
      
      const q = query(wordsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return {
        words: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        hasMore: querySnapshot.docs.length === WORDS_PER_PAGE
      };
    } else {
      // Si recherche, récupérer tous les mots du niveau et filtrer côté client
      const q = query(wordsCollection, where('level', '==', level));
      const querySnapshot = await getDocs(q);
      
      let allWords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrer par terme de recherche
      allWords = allWords.filter(wordData => 
        wordData.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Trier
      if (sortBy === 'alphabetical') {
        allWords.sort((a, b) => a.word.localeCompare(b.word));
      } else if (sortBy === 'frequency') {
        allWords.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
      } else if (sortBy === 'random') {
        allWords.sort(() => Math.random() - 0.5);
      }
      
      // Supprimer les doublons
      const uniqueWords = allWords.reduce((acc, current) => {
        const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Paginer côté client
      const startIndex = (pageNumber - 1) * WORDS_PER_PAGE;
      const endIndex = startIndex + WORDS_PER_PAGE;
      const paginatedWords = uniqueWords.slice(startIndex, endIndex);
      
      return {
        words: paginatedWords,
        hasMore: endIndex < uniqueWords.length,
        total: uniqueWords.length
      };
    }
  } catch (error) {
    console.error('Erreur récupération mots paginés:', error);
    return { words: [], hasMore: false, total: 0 };
  }
};

// Récupérer les mots irréguliers avec pagination
export const getIrregularWordsPaginated = async (pageNumber = 1, searchTerm = '') => {
  try {
    const wordsCollection = collection(db, 'words');
    
    if (!searchTerm) {
      // Sans recherche, pagination native
      const constraints = [
        where('isIrregular', '==', true),
        orderBy('word', 'asc'),
        limit(WORDS_PER_PAGE)
      ];
      
      if (pageNumber > 1) {
        const skipCount = (pageNumber - 1) * WORDS_PER_PAGE;
        const previousQuery = query(wordsCollection, ...constraints.slice(0, -1), limit(skipCount));
        const previousSnapshot = await getDocs(previousQuery);
        
        if (previousSnapshot.docs.length > 0) {
          const lastDoc = previousSnapshot.docs[previousSnapshot.docs.length - 1];
          const paginatedQuery = query(
            wordsCollection,
            ...constraints.slice(0, -1),
            startAfter(lastDoc),
            limit(WORDS_PER_PAGE)
          );
          const querySnapshot = await getDocs(paginatedQuery);
          
          return {
            words: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            hasMore: querySnapshot.docs.length === WORDS_PER_PAGE
          };
        }
      }
      
      const q = query(wordsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return {
        words: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        hasMore: querySnapshot.docs.length === WORDS_PER_PAGE
      };
    } else {
      // Avec recherche, filtrer côté client
      const q = query(wordsCollection, where('isIrregular', '==', true));
      const querySnapshot = await getDocs(q);
      
      let allWords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrer par recherche
      allWords = allWords.filter(wordData => 
        wordData.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Supprimer doublons
      const uniqueWords = allWords.reduce((acc, current) => {
        const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Trier alphabétiquement
      uniqueWords.sort((a, b) => a.word.localeCompare(b.word));
      
      // Paginer
      const startIndex = (pageNumber - 1) * WORDS_PER_PAGE;
      const endIndex = startIndex + WORDS_PER_PAGE;
      const paginatedWords = uniqueWords.slice(startIndex, endIndex);
      
      return {
        words: paginatedWords,
        hasMore: endIndex < uniqueWords.length,
        total: uniqueWords.length
      };
    }
  } catch (error) {
    console.error('Erreur récupération mots irréguliers paginés:', error);
    return { words: [], hasMore: false, total: 0 };
  }
};

// Anciennes fonctions conservées pour compatibilité (peuvent être supprimées si non utilisées ailleurs)
export const getWordsByLevel = async (level) => {
  try {
    const wordsCollection = collection(db, 'words');
    const q = query(
      wordsCollection, 
      where('level', '==', level),
      orderBy('frequency', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur récupération mots:', error);
    try {
      const wordsCollection = collection(db, 'words');
      const q = query(wordsCollection, where('level', '==', level));
      const querySnapshot = await getDocs(q);
      const words = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return words.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    } catch (fallbackError) {
      console.error('Erreur fallback:', fallbackError);
      return [];
    }
  }
};

export const getIrregularWords = async () => {
  try {
    const wordsCollection = collection(db, 'words');
    const q = query(
      wordsCollection,
      where('isIrregular', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur récupération mots irréguliers:', error);
    return [];
  }
};

export const getAllWords = async () => {
  try {
    const wordsCollection = collection(db, 'words');
    const querySnapshot = await getDocs(wordsCollection);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur récupération tous les mots:', error);
    return [];
  }
};

export const searchWordsInFirestore = async (searchTerm, filters = {}) => {
  try {
    let q = collection(db, 'words');
    const constraints = [];
    
    if (filters.level) {
      constraints.push(where('level', '==', filters.level));
    }
    
    if (filters.isIrregular !== undefined) {
      constraints.push(where('isIrregular', '==', filters.isIrregular));
    }
    
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const allWords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (searchTerm) {
      return allWords.filter(wordData => 
        wordData.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return allWords;
  } catch (error) {
    console.error('Erreur recherche mots:', error);
    return [];
  }
};