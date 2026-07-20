// netlify/functions/check-video-status.js
//
// El frontend llama a esto cada pocos segundos (polling) pasando el
// operationName que devolvió generate-video.js, hasta que status sea 'done'.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

exports.handler = async (event) => {
  const operationName = event.queryStringParameters?.operationName;

  if (!operationName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta operationName' }) };
  }

  try {
    const response = await fetch(`${BASE_URL}/${operationName}`, {
      headers: { 'x-goog-api-key': GEMINI_API_KEY }
    });
    const data = await response.json();

    if (!data.done) {
      return { statusCode: 200, body: JSON.stringify({ status: 'processing' }) };
    }

    if (data.error) {
      return { statusCode: 200, body: JSON.stringify({ status: 'error', message: data.error.message }) };
    }

    const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'done', videoUri })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
