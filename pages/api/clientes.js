import axios from 'axios';

const API_BASE_URL = 'https://api.capsulecrm.com/api/v2';
const API_TOKEN = 'kz0UbngnUcxFRsRfDACGkegzFeL32+7808n+Kmc5cE9NO5NBGMk0gMf82BwBh8bS';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Debes proporcionar un término de búsqueda.' });
    }

    const normalizedQuery = query.trim().toLowerCase();

    try {
      const response = await axios.get(`${API_BASE_URL}/parties/search`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        params: { q: normalizedQuery, perPage: 50 },
      });

      const parties = response.data.parties || [];
      const filteredParties = parties.filter((party) =>
        party.name?.toLowerCase().includes(normalizedQuery)
      );

      return res.status(200).json(filteredParties);
    } catch (error) {
      console.error('Error buscando clientes:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Error buscando clientes.' });
    }
  } else if (req.method === 'POST') {
    const { clientId, projectName, noteContent } = req.body;

    if (!clientId || !projectName.trim() || !noteContent.trim()) {
      return res.status(400).json({ error: 'Faltan datos necesarios para crear el proyecto.' });
    }

    try {
      // Paso 1: Crear el proyecto
      const projectResponse = await axios.post(
        `${API_BASE_URL}/kases`,
        {
          kase: {
            party: { id: clientId },
            name: projectName,
            description: '', // Sin descripción inicial
            status: 'OPEN',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const projectId = projectResponse.data.kase.id;

      // Pausa adicional para asegurar que el proyecto esté disponible
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Paso 2: Crear la actividad de tipo "Reunión" en el proyecto
      const activityResponse = await axios.post(
        `${API_BASE_URL}/kases/${projectId}/history`,
        {
          historyItem: {
            type: 'MEETING',
            subject: `Reunión para el proyecto: ${projectName}`,
            note: noteContent, // El contenido de la nota de voz
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return res.status(201).json({
        project: projectResponse.data, // Proyecto creado
        activity: activityResponse.data, // Actividad registrada
      });
    } catch (error) {
      console.error('Error creando proyecto o actividad:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Error creando el proyecto o la actividad.' });
    }
  } else {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
}
