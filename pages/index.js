import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Montserrat } from 'next/font/google'; // Importación correcta

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'] }); // Configura peso y subset

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [comment, setComment] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Configuración de SpeechRecognition
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setComment((prev) => prev + ' ' + transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Error en SpeechRecognition:', event.error);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      alert('El reconocimiento de voz no está soportado en este navegador.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const fetchClients = async (term) => {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clientes?query=${encodeURIComponent(normalizedTerm)}`);
      if (!response.ok) throw new Error('Error al buscar clientes');
      const data = await response.json();

      setSearchResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al buscar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchClients(searchTerm);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const submitComment = async () => {
    if (!selectedClient || !comment.trim()) {
      alert('Selecciona un cliente y escribe un comentario.');
      return;
    }

    try {
      const response = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id, comment }),
      });

      const responseText = await response.text();

      if (response.ok) {
        alert('Comentario enviado con éxito');
        setComment('');
      } else {
        console.error('Error en la respuesta del servidor:', responseText);
        alert(`Error al enviar el comentario: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      console.error('Error al enviar el comentario:', error);
      alert('Error al enviar el comentario. Verifica tu conexión a internet o revisa los logs del servidor.');
    }
  };

  const resetSelection = () => {
    setSelectedClient(null);
    setComment('');
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <div className={`${montserrat.className} min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white`}>      
      <header className="flex flex-col md:flex-row justify-between items-center w-full px-4 py-4 bg-gray-900 shadow-lg">
        <Image src="/logo.png" alt="Logo de la Empresa" width={100} height={40} />
        <h1 className="text-lg md:text-xl font-bold mt-2 md:mt-0">Capsule CRM</h1>
      </header>

      <main className="p-4 flex flex-col items-center">
        <div className="max-w-lg w-full bg-gray-800 rounded-xl shadow-lg p-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full mb-4 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-red-600"></div>
            </div>
          )}
          {showDropdown && searchResults.length > 0 && (
            <ul className="bg-gray-700 border border-gray-600 rounded-lg shadow max-h-40 overflow-y-auto">
              {searchResults.map((client) => (
                <li
                  key={client.id}
                  className="p-3 hover:bg-red-600 text-white cursor-pointer"
                  onClick={() => handleSelectClient(client)}
                >
                  {client.name}
                </li>
              ))}
            </ul>
          )}
          {selectedClient && (
            <div className="mt-6">
              <div className="mb-4 p-3 bg-gray-900 text-white rounded-lg">
                <strong>Cliente seleccionado:</strong> {selectedClient.name}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu comentario aquí..."
                className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              ></textarea>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={startListening}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white font-bold ${listening ? 'bg-red-600' : 'bg-blue-600 hover:bg-red-600'}`}
                >
                  {listening ? 'Escuchando...' : 'Hablar'}
                </button>
                <button
                  onClick={stopListening}
                  className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600"
                >
                  Detener
                </button>
                <button
                  onClick={submitComment}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  Enviar
                </button>
                <button
                  onClick={resetSelection}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-gray-700"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="w-full text-center p-4 bg-gray-900 text-white">
        &copy; 2024 - <img src="/logo.png" alt="Logo de la Empresa" className="inline h-10" />
      </footer>
    </div>
  );
}
