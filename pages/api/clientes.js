import axios from 'axios';

const API_BASE_URL = 'https://api.capsulecrm.com/api/v2';
const API_TOKEN = 'kz0UbngnUcxFRsRfDACGkegzFeL32+7808n+Kmc5cE9NO5NBGMk0gMf82BwBh8bS';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const { query } = req.query;

  // Validar y normalizar el término de búsqueda
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Debes proporcionar un término de búsqueda.' });
  }

  const normalizedQuery = query.trim().toLowerCase(); // Elimina espacios y convierte a minúsculas

  try {
    // Llamar al endpoint de Capsule CRM
    const response = await axios.get(`${API_BASE_URL}/parties/search`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      params: { q: normalizedQuery, perPage: 50 }, // Puedes ajustar el límite de resultados por página
    });

    const parties = response.data.parties || [];

    // Filtrar localmente por si Capsule CRM no aplica bien el filtro
    const filteredParties = parties.filter((party) =>
      party.name?.toLowerCase().includes(normalizedQuery)
    );

    return res.status(200).json(filteredParties);
  } catch (error) {
    console.error('Error buscando clientes:', error.response?.data || error.message);

    // Manejo específico de errores según el tipo
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Error de autenticación. Verifica tu API_TOKEN.' });
    }
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'No se encontraron resultados.' });
    }
    return res.status(500).json({ error: 'Error buscando clientes.' });
  }
}
