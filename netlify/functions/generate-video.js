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
const MODEL = 'veo-3.1-generate-001'; // usa '-preview' si aún no tienes acceso a la versión estable
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
    const { prompt, negativePrompt, duration, aspect, referenceImages } = JSON.parse(event.body || '{}');

    if (!prompt || !prompt.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta el prompt.' }) };
    }

    const requestBody = {
      instances: [
        {
          prompt: prompt,
          ...(negativePrompt ? { negativePrompt } : {}),
          ...(referenceImages && referenceImages.length
            ? { referenceImages: referenceImages.slice(0, 3) } // Veo 3.1 admite hasta 3
            : {})
        }
      ],
      parameters: {
        aspectRatio: aspect || '16:9',
        durationSeconds: parseInt(duration || '8', 10)
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
