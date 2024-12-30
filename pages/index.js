import { useState, useEffect, useRef } from 'react';

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
      recognitionRef.current.continuous = false;
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
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Comentarios en Capsule</h1>

      <div className="w-full max-w-md relative">
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading && (
          <div className="absolute right-4 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
          </div>
        )}
        {showDropdown && searchResults.length > 0 && (
          <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-60 overflow-auto z-10">
            {searchResults.map((client) => (
              <li
                key={client.id}
                className="p-3 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleSelectClient(client)}
              >
                {client.name}
              </li>
            ))}
          </ul>
        )}
        {searchTerm && !loading && searchResults.length === 0 && (
          <p className="text-gray-500 mt-2">No se encontraron resultados.</p>
        )}
      </div>

      {selectedClient && (
        <div className="mt-6 w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Cliente seleccionado: {selectedClient.name}
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe tu comentario aquí..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-4 mt-4">
            <button
              onClick={startListening}
              className={`px-4 py-2 text-white rounded-lg ${listening ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {listening ? 'Escuchando...' : 'Hablar'}
            </button>
            <button
              onClick={submitComment}
              className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
            >
              Enviar Comentario
            </button>
            <button
              onClick={resetSelection}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
            >
              Limpiar Selección
            </button>
          </div>
        </div>
      )}

      {!selectedClient && (
        <p className="text-red-500 mt-4">Por favor, selecciona un cliente.</p>
      )}
    </div>
  );
}
