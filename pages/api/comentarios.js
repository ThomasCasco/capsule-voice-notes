import axios from 'axios';

// Configuración de tu API de Capsule
const API_BASE_URL = 'https://api.capsulecrm.com/api/v2';
const API_TOKEN = 'kz0UbngnUcxFRsRfDACGkegzFeL32+7808n+Kmc5cE9NO5NBGMk0gMf82BwBh8bS';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    // Parsear los datos del cuerpo
    const { clientId, comment } = req.body;

    if (!clientId || !comment) {
      return res.status(400).json({ error: 'Faltan datos (clientId o comment)' });
    }

    console.log('Datos recibidos:', { clientId, comment });

    // Crear un Entry (tipo "note") asociado al Party
    const fechaHoy = new Date().toLocaleString();
    const entryBody = {
      entry: {
        type: 'note',
        content: `Comentario con fecha: ${fechaHoy} - ${comment}`,
        party: { id: parseInt(clientId) },
      },
    };

    const entryResponse = await axios.post(
      `${API_BASE_URL}/entries`,
      entryBody,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Entry creada:', entryResponse.data.entry);

    return res.status(200).json({
      message: 'Entry (tipo note) creada exitosamente.',
      entry: entryResponse.data.entry,
    });
  } catch (error) {
    console.error('Error al crear la Entry:', error.response?.data || error.message);
    return res.status(500).json({ error: 'No se pudo crear la entrada.' });
  }
}
