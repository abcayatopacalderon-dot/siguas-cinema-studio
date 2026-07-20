# Cauce — Estudio Siguas

Interfaz personal para generar las escenas cinematográficas de *Siguas, el Gigante
del Marañón* usando Veo 3.1, con Claude como capa de enriquecimiento de prompts.

## Qué incluye

- `public/index.html` — interfaz de trabajo (lista de escenas, editor de prompt, galería de tomas)
- `netlify/functions/generate-video.js` — lanza una generación en Veo 3.1
- `netlify/functions/check-video-status.js` — consulta si la generación terminó
- `netlify/functions/enhance-prompt.js` — usa Claude para enriquecer el prompt antes de generar
- `supabase-schema.sql` — tablas para guardar escenas, tomas y tu registro de autoría IA

Ahora mismo el frontend simula la generación (para que puedas ver y probar el
flujo sin gastar créditos). Los pasos abajo conectan todo a servicios reales.

## Paso 1 — Consigue tus API keys

1. **Gemini/Veo 3.1**: sigue la guía que te di — API key en https://aistudio.google.com,
   con facturación activada en https://console.cloud.google.com/billing
2. **Anthropic (opcional, para enriquecer prompts)**: consíguela en
   https://console.anthropic.com — es una key distinta a la de Google, y se
   paga por separado (uso de texto, muy barato comparado con video).

## Paso 2 — Crea el proyecto en Supabase

1. En tu proyecto de Supabase (o uno nuevo), ve a **SQL Editor**.
2. Pega y ejecuta el contenido de `supabase-schema.sql`.
3. Copia tu **Project URL** y **anon key** desde Project Settings > API — los
   necesitarás para conectar el frontend a Supabase (actualmente el frontend
   usa almacenamiento temporal en vez de Supabase; ver "Próximo paso" abajo).

## Paso 3 — Despliega en Netlify

1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify: **Add new site > Import an existing project**, conecta el repo.
3. Netlify detecta `netlify.toml` automáticamente (publish = `public`, functions = `netlify/functions`).
4. Ve a **Site settings > Environment variables** y agrega:
   - `GEMINI_API_KEY` = tu key de Google AI Studio
   - `ANTHROPIC_API_KEY` = tu key de Anthropic (si usarás el enriquecimiento de prompts)
   - `SUPABASE_URL` y `SUPABASE_ANON_KEY` (cuando conectes Supabase)
5. Deploy.

## Paso 4 — Prueba antes de generar en volumen

Antes de generar todas las escenas de la novela, prueba con **una sola escena
corta (4 segundos)** para confirmar que:
- Tu cuenta de Google tiene acceso aprobado a Veo 3.1 (a veces requiere 1-5 días de revisión)
- El costo por segundo que estás viendo en la consola de Google coincide con lo esperado
- La función `generate-video.js` no está devolviendo errores de permisos (403)

## Próximo paso (pendiente de conectar)

El frontend actual guarda las escenas en almacenamiento temporal para que
puedas probar el diseño y flujo ahora mismo. Cuando quieras, conectamos:

1. El frontend a Supabase (reemplazar el objeto `persist` en `index.html`
   por llamadas a la API de Supabase, usando `SUPABASE_URL`/`SUPABASE_ANON_KEY`).
2. El botón "Generar toma" a las funciones reales (`generate-video.js` +
   polling con `check-video-status.js`) en vez de la simulación con `setTimeout`.
3. Subida de imágenes de referencia (hasta 3 por escena) a Supabase Storage,
   para pasarlas como `referenceImages` a Veo y mantener consistencia visual
   de los personajes de Siguas entre escenas.

Dime cuando tengas las keys listas y conectamos estas tres piezas.
