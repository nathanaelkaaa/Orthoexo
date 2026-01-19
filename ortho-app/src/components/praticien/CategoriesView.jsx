import { BookOpen, BarChart3 } from 'lucide-react';

const CategoriesView = ({ onSelectCategory }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Sélectionnez une catégorie</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => onSelectCategory('mots')}
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer group"
        >
          <BookOpen className="w-16 h-16 text-blue-600 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-2xl font-bold mb-2">Mots</h2>
          <p className="text-gray-600">
            Gérez votre banque de mots pour créer des exercices personnalisés
          </p>
        </div>

        <div 
          onClick={() => onSelectCategory('historique')}
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer group"
        >
          <BarChart3 className="w-16 h-16 text-purple-600 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-2xl font-bold mb-2">Historique</h2>
          <p className="text-gray-600">
            Consultez les exercices passés et les résultats des patients
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoriesView;