import axios from 'axios';

const API_BASE_URL = 'https://api.capsulecrm.com/api/v2';
const API_TOKEN = 'kz0UbngnUcxFRsRfDACGkegzFeL32+7808n+Kmc5cE9NO5NBGMk0gMf82BwBh8bS';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { clientId, projectName } = req.body;

    if (!clientId || !projectName.trim()) {
      return res.status(400).json({ error: 'Faltan datos necesarios para crear el proyecto.' });
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/kases`,
        {
          kase: {
            party: { id: clientId },
            name: projectName,
            status: 'OPEN', // Estado del proyecto
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const projectId = response.data.kase.id;

      if (!projectId) {
        throw new Error('No se obtuvo projectId al crear el proyecto.');
      }

      return res.status(201).json({ projectId });
    } catch (error) {
      console.error('Error al crear el proyecto:', error.response?.data || error.message);

      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Error al crear el proyecto.',
      });
    }
  } else {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
}
