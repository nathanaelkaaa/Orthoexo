import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { parseManulexFile, transformManulexData, importWordsToFirestore } from '../../services/manulexService';

const ManulexImporter = ({ onComplete }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setError('');
    setProgress('Lecture du fichier...');

    try {
      // Parser le fichier Excel
      const rawData = await parseManulexFile(file);
      setProgress(`${rawData.length} entrées trouvées. Transformation...`);

      // Transformer les données
      const transformedData = transformManulexData(rawData);
      setProgress(`${transformedData.length} mots valides. Import dans Firebase...`);

      // Importer dans Firestore
      const result = await importWordsToFirestore(transformedData);
      
      setProgress('');
      setSuccess(true);
      setImporting(false);
      
      if (onComplete) onComplete(result);
    } catch (err) {
      console.error('Erreur import:', err);
      setError('Erreur lors de l\'import : ' + err.message);
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4">Importer la base Manulex</h2>
      <p className="text-gray-600 mb-6">
        Téléchargez d'abord le fichier Excel depuis{' '}
        <a 
          href="http://www.manulex.org/docs/fr/Manulex.xls" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          manulex.org
        </a>
        , puis importez-le ici.
      </p>

      {!success && !importing && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-gray-600">Cliquez pour sélectionner le fichier Manulex.xls</span>
          <input 
            type="file" 
            accept=".xls,.xlsx" 
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      )}

      {importing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{progress}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Import réussi !</p>
            <p className="text-green-700 text-sm mt-1">La base de données Manulex a été importée avec succès.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManulexImporter;