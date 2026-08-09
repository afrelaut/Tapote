export async function readUploadPayload(response, unavailableMessage) {
  const rawBody = await response.text();
  let payload = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // Un proxy local arrêté peut renvoyer une réponse vide ou non JSON. Ce
      // détail technique ne doit jamais être présenté comme une erreur du logo.
    }
  }

  if (!response.ok || !payload.uploadId) {
    throw new Error(payload.error || unavailableMessage);
  }

  return payload;
}

export function friendlyUploadError(error, subject) {
  const message = String(error?.message || "");
  if (message && !/unexpected end of json|failed to fetch|load failed|networkerror/i.test(message)) return message;
  return `${subject} est bien visible dans l’aperçu, mais son envoi sécurisé est momentanément indisponible.`;
}
