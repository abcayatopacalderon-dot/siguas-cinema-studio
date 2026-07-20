// netlify/functions/video-proxy.js
//
// El navegador no puede cargar directamente el videoUri que devuelve Google,
// porque esa URL requiere el header x-goog-api-key para descargarse — y no
// queremos exponer la API key en el navegador. Esta función actúa de puente:
// el navegador le pide el video a esta función, y ELLA descarga el video de
// Google (con la key, de forma segura en el servidor) y lo reenvía.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.handler = async (event) => {
  const videoUri = event.queryStringParameters?.uri;

  if (!videoUri) {
    return { statusCode: 400, body: 'Falta el parámetro uri' };
  }

  try {
    const response = await fetch(videoUri, {
      headers: { 'x-goog-api-key': GEMINI_API_KEY }
    });

    if (!response.ok) {
      return { statusCode: response.status, body: 'Error descargando el video desde Google' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=86400'
      },
      body: base64,
      isBase64Encoded: true
    };

  } catch (err) {
    return { statusCode: 500, body: 'Error: ' + err.message };
  }
};
