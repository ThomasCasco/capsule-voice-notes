import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Montserrat } from 'next/font/google';
import { FaMicrophone, FaStop, FaPaperPlane, FaTrashAlt } from 'react-icons/fa';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'] });

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [comment, setComment] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
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

  const submitProjectAndActivity = async () => {
    if (!selectedClient || !projectName.trim() || !comment.trim()) {
      alert('Selecciona un cliente, ingresa un nombre para el proyecto y escribe un comentario.');
      return;
    }
  
    try {
      // Paso 1: Crear el proyecto
      const projectResponse = await fetch('/api/crearProyecto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          projectName,
        }),
      });
  
      if (!projectResponse.ok) {
        const errorText = await projectResponse.text();
        console.error('Error al crear el proyecto:', errorText);
        alert(`Error al crear el proyecto: ${projectResponse.status}`);
        return;
      }
  
      const { projectId } = await projectResponse.json();
      console.log('ID del proyecto creado:', projectId);
  
      // Paso 2: Registrar la actividad
      const activityResponse = await fetch('/api/agregarActividad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          noteContent: comment,
          projectName,
        }),
      });

      console.log('Datos enviados a comentarios:', {
        projectId,
        noteContent: comment,
        projectName,
      });
      
  
      if (!activityResponse.ok) {
        const errorText = await activityResponse.text();
        console.error('Error al registrar la actividad:', errorText);
        alert(`Error al registrar la actividad: ${activityResponse.status}`);
        return;
      }
  
      alert('Proyecto y actividad creados con éxito');
      setProjectName('');
      setComment('');
      resetSelection();
    } catch (error) {
      console.error('Error en el flujo de creación:', error);
      alert('Error al crear el proyecto o actividad. Revisa los logs.');
    }
  };
  

  const resetSelection = () => {
    setSelectedClient(null);
    setProjectName('');
    setComment('');
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <div
      className={`${montserrat.className} min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col`}
    >
      <header className="flex flex-col md:flex-row justify-between items-center w-full px-4 py-4 bg-gray-900 shadow-lg">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo de la Empresa" width={100} height={40} />
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">Capsule CRM</h1>
        </div>
      </header>

      <main className="flex-grow p-4 flex flex-col items-center">
        <div className="max-w-xl w-full bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && (
              <div className="absolute right-3 top-3 flex justify-center items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-red-600"></div>
              </div>
            )}
          </div>

          {showDropdown && searchResults.length > 0 && (
            <ul className="bg-gray-700 border border-gray-600 rounded-lg shadow max-h-40 overflow-y-auto mb-4">
              {searchResults.map((client) => (
                <li
                  key={client.id}
                  className="p-3 hover:bg-red-600 hover:cursor-pointer transition-colors duration-300"
                  onClick={() => handleSelectClient(client)}
                >
                  {client.name}
                </li>
              ))}
            </ul>
          )}

          {selectedClient && (
            <div className="mt-4">
              <div className="mb-4 p-3 bg-gray-900 text-white rounded-lg">
                <strong>Cliente seleccionado:</strong> {selectedClient.name}
              </div>
              <input
                type="text"
                placeholder="Nombre del proyecto"
                className="w-full mb-4 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe la descripción del proyecto aquí..."
                className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              ></textarea>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={startListening}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg font-bold transition-colors duration-300 ${
                    listening ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <FaMicrophone />
                  {listening ? 'Escuchando...' : 'Hablar'}
                </button>
                <button
                  onClick={stopListening}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600"
                >
                  <FaStop />
                  Detener
                </button>
                <button
                  onClick={submitProjectAndActivity}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  <FaPaperPlane />
                  Crear Proyecto y Actividad
                </button>
                <button
                  onClick={resetSelection}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
                >
                  <FaTrashAlt />
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full text-center p-4 bg-gray-900 text-white">
        <div className="flex flex-col items-center md:flex-row md:justify-center gap-2">
          <span>&copy; 2024 </span>
          <Image src="/logo.png" alt="Logo de la Empresa" width={80} height={30} />
        </div>
      </footer>
    </div>
  );
}
