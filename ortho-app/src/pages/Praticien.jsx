import { useState } from 'react';
import { Brain, Upload } from 'lucide-react';
import CategoriesView from '../components/praticien/CategoriesView';
import WordSelectionView from '../components/praticien/WordSelectionView';
import HistoryView from '../components/praticien/HistoryView';
import ManulexImporter from '../components/praticien/ManulexImporter';

const Praticien = ({ currentUser, onBack }) => {
  const [praticienView, setPraticienView] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showImporter, setShowImporter] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold">Espace Praticien</span>
          </div>
          <div className="flex items-center gap-4">
            {/*
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Upload className="w-4 h-4" />
              Importer Manulex
            </button>*/}
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

      <div className="container mx-auto px-6 py-8">
        {showImporter && (
          <div className="mb-8">
            <ManulexImporter onComplete={() => setShowImporter(false)} />
          </div>
        )}

        {praticienView === 'categories' && (
          <CategoriesView 
            onSelectCategory={(cat) => {
              if (cat === 'historique') {
                setPraticienView('history');
              } else {
                setSelectedCategory(cat);
                setPraticienView('wordSelection');
              }
            }} 
          />
        )}
        
        {praticienView === 'wordSelection' && (
          <WordSelectionView 
            currentUser={currentUser}
            category={selectedCategory}
            onBack={() => setPraticienView('categories')}
          />
        )}

        {praticienView === 'history' && (
          <HistoryView 
            onBack={() => setPraticienView('categories')}
          />
        )}
      </div>
    </div>
  );
};

export default Praticien;