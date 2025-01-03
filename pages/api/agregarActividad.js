import axios from 'axios';

const API_BASE_URL = 'https://api.capsulecrm.com/api/v2';
const API_TOKEN = 'kz0UbngnUcxFRsRfDACGkegzFeL32+7808n+Kmc5cE9NO5NBGMk0gMf82BwBh8bS';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { projectId, noteContent } = req.body;

    // Log para depuración
    console.log('Datos recibidos en el backend:', { projectId, noteContent });

    // Validación de datos
    if (!projectId || !noteContent?.trim()) {
      return res.status(400).json({ error: 'Faltan datos necesarios (projectId o noteContent).' });
    }

    try {
      // Realizar la solicitud al endpoint de CapsuleCRM
      const response = await axios.post(
        `${API_BASE_URL}/entries`,
        {
          entry: {
            kase: {
              id: projectId, // ID del proyecto asociado
            },
            activityType: -1, // Indicador genérico para notas
            type: 'note', // Tipo de entrada
            content: noteContent, // Contenido de la nota
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Retornar la respuesta exitosa
      console.log('Actividad registrada correctamente:', response.data);
      return res.status(201).json({ activity: response.data });
    } catch (error) {
      console.error('Error al registrar la actividad:', error.response?.data || error.message);
      return res.status(500).json({
        error: error.response?.data || 'Error desconocido al registrar la actividad.',
      });
    }
  } else {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
}
