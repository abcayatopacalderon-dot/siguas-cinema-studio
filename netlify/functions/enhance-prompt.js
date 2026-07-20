// netlify/functions/enhance-prompt.js
//
// Esta es la capa que probablemente explica por qué deal.ai/SuperCool te daba
// mejores resultados que Flow con "el mismo" Veo 3: un modelo de texto expande
// tu prompt básico con vocabulario cinematográfico (encuadre, lente, luz,
// movimiento de cámara, textura sonora) ANTES de mandarlo a Veo.
//
// Requiere la variable de entorno ANTHROPIC_API_KEY en Netlify.
// Esta es una API key distinta a tu key de Gemini/Veo — se consigue en
// console.anthropic.com y se paga por separado (uso de texto, no de video).

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Eres un director de fotografía experto en escribir prompts para Veo 3.1.
Recibes una idea de escena breve, posiblemente en español, para la adaptación
audiovisual de la novela peruana "Siguas, el Gigante del Marañón" (ambientada
en la selva y el río Marañón, Cajamarca/Amazonas, Perú, con elementos del
mito indígena del gigante Siguas).

Expande el prompt del usuario en un solo párrafo denso y concreto, en español,
que incluya: encuadre y tipo de plano, movimiento de cámara, iluminación,
paleta de color, textura atmosférica (niebla, humedad, luz filtrada por dosel),
y una nota breve de sonido ambiente. Mantén la fidelidad a lo que el usuario
pidió — no inventes personajes ni eventos nuevos, solo enriquece la forma
cinematográfica. No agregues comentarios fuera del prompt final.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en Netlify.' })
    };
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}');
    if (!prompt || !prompt.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta el prompt base.' }) };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message || 'Error de la API de Anthropic' }) };
    }

    const enhanced = data.content?.find(b => b.type === 'text')?.text || '';

    return { statusCode: 200, body: JSON.stringify({ enhancedPrompt: enhanced }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
