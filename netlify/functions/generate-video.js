// netlify/functions/generate-video.js
//
// Recibe un prompt desde el frontend y llama a la API de Veo 3.1 (Gemini API).
// Requiere la variable de entorno GEMINI_API_KEY configurada en Netlify
// (Site settings > Environment variables). NUNCA pongas la key en el frontend.
//
// Veo 3.1 genera video de forma asíncrona: se lanza una "operación" y se
// consulta su estado hasta que termine. Aquí devolvemos el nombre de la
// operación al frontend para que la vaya consultando (ver check-video-status.js),
// en vez de bloquear la función esperando (Netlify tiene límite de tiempo de ejecución).

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'veo-3.1-generate-preview'; // nombre correcto para la Gemini API (no Vertex AI)
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY no configurada en Netlify. Ve a Site settings > Environment variables.' })
    };
  }

  try {
    const { prompt, negativePrompt, duration, aspect, resolution, referenceImages } = JSON.parse(event.body || '{}');

    if (!prompt || !prompt.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta el prompt.' }) };
    }

    // El frontend manda las imágenes como dataURL (data:image/png;base64,....).
    // La API espera bytesBase64Encoded + mimeType por separado.
    function parseDataUrl(dataUrl){
      const match = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(dataUrl);
      if(!match) return null;
      return { bytesBase64Encoded: match[2], mimeType: match[1] };
    }

    const parsedRefs = (referenceImages || [])
      .slice(0, 3)
      .map(parseDataUrl)
      .filter(Boolean);

    const requestBody = {
      instances: [
        {
          prompt: prompt,
          ...(negativePrompt ? { negativePrompt } : {}),
          ...(parsedRefs.length ? { referenceImages: parsedRefs.map(img => ({ image: img })) } : {})
        }
      ],
      parameters: {
        aspectRatio: aspect || '16:9',
        durationSeconds: parseInt(duration || '8', 10),
        resolution: resolution || '720p' // '720p' | '1080p' | '4k' — 1080p suele requerir duración de 8s
      }
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Error llamando a Veo 3.1', raw: data })
      };
    }

    // data.name es el identificador de la operación de larga duración
    return {
      statusCode: 200,
      body: JSON.stringify({ operationName: data.name, status: 'processing' })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
