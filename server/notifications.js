import { ACTIONS, PRODUCTS } from "../shared/catalog.js";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatMoney = (amount, currency = "eur") => new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: String(currency || "eur").toUpperCase(),
}).format(Number(amount || 0) / 100);

const sanitizeSubject = (value, fallback) => String(value || fallback)
  .replace(/[\r\n]+/g, " ")
  .trim()
  .slice(0, 100);

const reference = (payload) => String(payload.orderToken || "non disponible");

const displayValue = (value, fallback = "Non renseigné") => (
  String(value || "").trim() ? escapeHtml(value) : fallback
);

const isPersonalizedItem = (item) => PRODUCTS[item.productId]?.personalization !== "ready";

function lineTotal(item) {
  return Number(item.unitAmount || 0) * Number(item.quantity || 0);
}

function renderComposition(composition) {
  if (!composition || typeof composition !== "object") return "";
  const parts = [];
  if (composition.comptoir) parts.push(`${composition.comptoir} chevalet${composition.comptoir > 1 ? "s" : ""}`);
  if (composition.carte) parts.push(`${composition.carte} carte${composition.carte > 1 ? "s" : ""}`);
  // Conservé uniquement pour les e-mails d'anciennes commandes.
  if (composition.plaque) parts.push(`${composition.plaque} Tapote Plaque${composition.plaque > 1 ? "s" : ""}`);
  return parts.join(" + ");
}

function renderWorkshopItem(item, index, currency) {
  const product = PRODUCTS[item.productId];
  const action = ACTIONS[item.actionId];
  const customization = item.customization || {};
  const colors = [
    customization.primaryColor && `principale ${customization.primaryColor}`,
    customization.secondaryColor && `secondaire ${customization.secondaryColor}`,
    customization.textColor && `texte ${customization.textColor}`,
  ].filter(Boolean).join(" · ") || "Palette Tapote par défaut";
  const composition = renderComposition(customization.supportComposition);
  const destination = customization.destinationUrl || "";

  return `<section style="margin:0 0 20px;padding:20px;border:1px solid #dedbd5;border-radius:14px;background:#fff">
    <p style="margin:0 0 6px;color:#2458ff;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Ligne ${index + 1}</p>
    <h3 style="margin:0 0 14px;font-size:19px">${escapeHtml(product?.name || item.productId)} × ${escapeHtml(item.quantity)}</h3>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5">
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Usage</td><td style="padding:4px 0;font-weight:700">${escapeHtml(action?.name || item.actionId)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Montant</td><td style="padding:4px 0;font-weight:700">${escapeHtml(formatMoney(lineTotal(item), currency))}</td></tr>
      ${composition ? `<tr><td style="padding:4px 12px 4px 0;color:#6c6860">Composition</td><td style="padding:4px 0;font-weight:700">${escapeHtml(composition)}</td></tr>` : ""}
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Marque</td><td style="padding:4px 0">${displayValue(customization.brandName)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Couleurs</td><td style="padding:4px 0">${escapeHtml(colors)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Style / secteur</td><td style="padding:4px 0">${displayValue(customization.designStyle)} · ${displayValue(customization.targetId)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Message principal</td><td style="padding:4px 0">${displayValue(customization.customHeadline)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Phrase secondaire</td><td style="padding:4px 0">${displayValue(customization.customSubline)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Appel à l’action</td><td style="padding:4px 0">${displayValue(customization.customTapLabel)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Logo</td><td style="padding:4px 0">${customization.brandLogoId ? `ID ${escapeHtml(customization.brandLogoId)}${customization.logoFileName ? ` · ${escapeHtml(customization.logoFileName)}` : ""}` : "Aucun logo importé"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6c6860">Destination</td><td style="padding:4px 0;word-break:break-all">${destination ? escapeHtml(destination) : "Non renseignée"}</td></tr>
    </table>
  </section>`;
}

function renderCustomerItem(item, currency) {
  const product = PRODUCTS[item.productId];
  const action = ACTIONS[item.actionId];
  return `<tr>
    <td style="padding:13px 10px;border-bottom:1px solid #e7e4df"><strong>${escapeHtml(product?.name || item.productId)}</strong><br><span style="color:#6c6860">${escapeHtml(action?.name || item.actionId)}</span></td>
    <td style="padding:13px 10px;border-bottom:1px solid #e7e4df;text-align:center">${escapeHtml(item.quantity)}</td>
    <td style="padding:13px 10px;border-bottom:1px solid #e7e4df;text-align:right;white-space:nowrap">${escapeHtml(formatMoney(lineTotal(item), currency))}</td>
  </tr>`;
}

function emailFrame(content, preheader = "") {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f3f1ed;color:#141414;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
    <div style="max-width:680px;margin:0 auto;padding:24px 14px 42px">
      <div style="padding:19px 24px;background:#111;color:#fff;border-radius:16px 16px 0 0;font-size:22px;font-weight:900">tapote<span style="color:#5f7cff">.</span></div>
      <main style="padding:30px 24px;background:#fff;border-radius:0 0 16px 16px">${content}</main>
      <p style="margin:18px 0 0;text-align:center;color:#77736c;font-size:12px">Tapote · Un geste suffit</p>
    </div>
  </body></html>`;
}

function renderWorkshopNotification(payload) {
  const statusContent = {
    paid: ["Commande Tapote payée", "Nouvelle commande à préparer"],
    refunded: ["Remboursement Tapote enregistré", "Commande remboursée"],
    disputed: ["Litige Stripe ouvert — action requise", "Litige de paiement à traiter"],
    payment_failed: ["Paiement Tapote échoué", "Paiement non confirmé"],
  }[payload.status] || ["Mise à jour d’une commande Tapote", "Commande Tapote mise à jour"];
  const items = Array.isArray(payload.items) ? payload.items : [];
  const fallbackDestination = payload.destinationUrl || "";
  const detailedItems = items.map((item, index) => renderWorkshopItem({
    ...item,
    customization: {
      ...(item.customization || {}),
      destinationUrl: item.customization?.destinationUrl || fallbackDestination,
    },
  }, index, payload.currency)).join("");

  return {
    channel: "atelier",
    subject: `${statusContent[0]} — ${sanitizeSubject(payload.businessName, "client")}`,
    html: emailFrame(`
      <p style="margin:0 0 10px;color:#2458ff;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Atelier Tapote</p>
      <h1 style="margin:0 0 8px;font-size:30px;line-height:1.08">${statusContent[1]}</h1>
      <p style="margin:0 0 24px;color:#6c6860">Référence <strong style="color:#141414">${escapeHtml(reference(payload))}</strong></p>
      <table role="presentation" style="width:100%;margin:0 0 24px;border-collapse:collapse;font-size:15px;line-height:1.55">
        <tr><td style="padding:5px 12px 5px 0;color:#6c6860">Statut</td><td style="padding:5px 0;font-weight:700">${escapeHtml(payload.status || "mis à jour")}</td></tr>
        <tr><td style="padding:5px 12px 5px 0;color:#6c6860">Entreprise</td><td style="padding:5px 0;font-weight:700">${displayValue(payload.businessName)}</td></tr>
        <tr><td style="padding:5px 12px 5px 0;color:#6c6860">Client</td><td style="padding:5px 0">${displayValue(payload.customerName)} · ${displayValue(payload.customerEmail)}</td></tr>
        <tr><td style="padding:5px 12px 5px 0;color:#6c6860">Total payé</td><td style="padding:5px 0;font-weight:700">${escapeHtml(formatMoney(payload.amountTotal, payload.currency))}</td></tr>
        <tr><td style="padding:5px 12px 5px 0;color:#6c6860">Destination générale</td><td style="padding:5px 0;word-break:break-all">${fallbackDestination ? escapeHtml(fallbackDestination) : "Non renseignée"}</td></tr>
      </table>
      ${detailedItems || '<p style="padding:16px;background:#fff4df;border-radius:12px">Le détail des lignes n’a pas été retrouvé. Vérifier la commande dans Supabase et Stripe.</p>'}
      <p style="margin:24px 0 0;padding:16px;background:#eef2ff;border-radius:12px;line-height:1.55"><strong>Contrôle atelier :</strong> pour une commande personnalisée, attendre le brief client puis préparer le BAT. Ne lancer aucune impression avant sa validation. Vérifier ensuite chaque destination, le NFC et le QR avant expédition.</p>
    `, `${statusContent[1]} · ${reference(payload)}`),
  };
}

function renderCustomerConfirmation(payload, config) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const personalized = items.some(isPersonalizedItem);
  const supportEmail = config.customerSupportEmail || config.orderNotificationEmail;
  const readyLeadTime = config.readyOrderLeadTime || "le délai exact vous sera confirmé dès la prise en charge par notre atelier.";
  const steps = personalized
    ? [
      ["Envoyez votre identité", "Répondez à cet e-mail avec votre logo, vos couleurs, vos textes et la destination à ouvrir. Si vous avez déjà utilisé le Studio, joignez simplement votre création."],
      ["Validez votre BAT", "Nous préparons le rendu sur le support choisi. Aucune impression ne démarre avant votre accord."],
      ["Production et expédition", "Après validation, votre support est imprimé puis le NFC et le QR sont testés avant l’envoi."],
    ]
    : [
      ["Commande confirmée", "Votre design Tapote et votre destination sont transmis à l’atelier."],
      ["Configuration et test", "Chaque NFC et QR code est contrôlé avant l’envoi."],
      ["Expédition", readyLeadTime],
    ];
  const rows = items.map((item) => renderCustomerItem(item, payload.currency)).join("");

  return {
    channel: "client",
    to: payload.customerEmail,
    subject: `Commande Tapote confirmée — ${sanitizeSubject(reference(payload), "votre référence")}`,
    html: emailFrame(`
      <p style="margin:0 0 10px;color:#2458ff;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Paiement confirmé</p>
      <h1 style="margin:0 0 12px;font-size:30px;line-height:1.08">Merci ${displayValue(payload.businessName, "")}</h1>
      <p style="margin:0 0 24px;color:#56524c;line-height:1.65">Votre commande Tapote est bien enregistrée sous la référence <strong style="color:#141414">${escapeHtml(reference(payload))}</strong>.</p>
      <table role="presentation" style="width:100%;margin:0 0 24px;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#f4f2ee"><th style="padding:11px 10px;text-align:left">Produit</th><th style="padding:11px 10px;text-align:center">Qté</th><th style="padding:11px 10px;text-align:right">Montant</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" style="padding:15px 10px;text-align:right;font-weight:800">Total payé</td><td style="padding:15px 10px;text-align:right;font-weight:800;white-space:nowrap">${escapeHtml(formatMoney(payload.amountTotal, payload.currency))}</td></tr></tfoot>
      </table>
      <h2 style="margin:30px 0 16px;font-size:22px">Et maintenant ?</h2>
      ${steps.map(([title, description], index) => `<div style="display:flex;gap:14px;margin:0 0 16px"><div style="flex:0 0 30px;height:30px;border-radius:50%;background:#2458ff;color:#fff;text-align:center;line-height:30px;font-weight:800">${index + 1}</div><div><strong>${escapeHtml(title)}</strong><p style="margin:4px 0 0;color:#6c6860;line-height:1.5">${escapeHtml(description)}</p></div></div>`).join("")}
      <p style="margin:26px 0 0;padding:17px;background:#f4f2ee;border-radius:12px;line-height:1.6"><strong>Délai :</strong> ${personalized ? "le délai de production commence après la validation du BAT ; notre atelier vous confirme ensuite la date d’expédition." : escapeHtml(readyLeadTime)}<br><strong>Une question ?</strong> Répondez à cet e-mail${supportEmail ? ` ou écrivez à <a style="color:#2458ff" href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>` : ""}.</p>
    `, `Commande ${reference(payload)} confirmée`),
  };
}

export function renderJob(job, config = {}) {
  if (job.kind === "order_notification") {
    const workshop = renderWorkshopNotification(job.payload);
    const messages = [{ ...workshop, to: config.orderNotificationEmail }];
    if (job.payload.status === "paid" && job.payload.customerEmail) {
      messages.push(renderCustomerConfirmation(job.payload, config));
    }
    return messages;
  }

  const payload = job.payload;
  const subjectName = sanitizeSubject(payload.company || payload.name, "contact");
  return [{
    channel: "lead",
    to: config.orderNotificationEmail,
    subject: `Nouveau devis Tapote — ${subjectName}`,
    html: emailFrame(`<h1 style="margin:0 0 18px">Demande de devis</h1>
      <p><strong>Contact :</strong> ${escapeHtml(payload.name)} — ${escapeHtml(payload.email)}</p>
      <p><strong>Entreprise :</strong> ${escapeHtml(payload.company || "non renseignée")}</p>
      <p><strong>Besoin :</strong></p><p style="line-height:1.6">${escapeHtml(payload.need).replaceAll("\n", "<br>")}</p>`),
  }];
}

async function sendWithResend(config, message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      ...(config.customerSupportEmail ? { reply_to: config.customerSupportEmail } : {}),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Resend a refusé la notification (${response.status}).`);
}

export function createOutboxWorker({ config, repository, logger }) {
  let timer = null;
  let running = false;
  let missingProviderLogged = false;

  const runOnce = async () => {
    if (running) return;
    if (!config.resendApiKey || !config.orderNotificationEmail || !config.fromEmail) {
      if (!missingProviderLogged) {
        logger.warn("Notifications en attente : Resend ou l’adresse atelier n’est pas configuré.");
        missingProviderLogged = true;
      }
      return;
    }
    running = true;
    try {
      const jobs = await repository.claimOutboxJobs(8);
      for (const job of jobs) {
        try {
          const messages = renderJob(job, config);
          for (const message of messages) {
            await sendWithResend(config, {
              ...message,
              idempotencyKey: `${job.dedupeKey || job.dedupe_key}:${message.channel}`,
            });
          }
          await repository.markOutboxDone(job.id);
        } catch (error) {
          logger.error({ err: error, jobId: job.id, kind: job.kind }, "Échec d’une tâche de notification");
          await repository.markOutboxFailed(job.id, error.message);
        }
      }
    } catch (error) {
      logger.error({ err: error }, "Échec du traitement de la file de notifications");
    } finally {
      running = false;
    }
  };

  return {
    runOnce,
    start() {
      if (timer) return;
      timer = setInterval(runOnce, config.outboxIntervalMs);
      timer.unref();
      void runOnce();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
