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

function renderJob(job) {
  if (job.kind === "order_notification") {
    const payload = job.payload;
    const statusContent = {
      paid: ["Commande Tapote payée", "Nouvelle commande Tapote"],
      refunded: ["Remboursement Tapote enregistré", "Commande remboursée"],
      disputed: ["Litige Stripe ouvert — action requise", "Litige de paiement à traiter"],
      payment_failed: ["Paiement Tapote échoué", "Paiement non confirmé"],
    }[payload.status] || ["Mise à jour d’une commande Tapote", "Commande Tapote mise à jour"];
    const subjectBusiness = String(payload.businessName || "client").replace(/[\r\n]+/g, " ").slice(0, 100);
    return {
      subject: `${statusContent[0]} — ${subjectBusiness}`,
      html: `<h1>${statusContent[1]}</h1>
        <p><strong>Commande :</strong> ${escapeHtml(payload.orderToken)}</p>
        <p><strong>Statut :</strong> ${escapeHtml(payload.status || "mis à jour")}</p>
        <p><strong>Commerce :</strong> ${escapeHtml(payload.businessName || "non renseigné")}</p>
        <p><strong>Client :</strong> ${escapeHtml(payload.customerName || "non renseigné")} — ${escapeHtml(payload.customerEmail || "non renseigné")}</p>
        <p><strong>Total :</strong> ${escapeHtml(formatMoney(payload.amountTotal, payload.currency))}</p>
        <p>Consulte Supabase et Stripe pour préparer puis suivre la commande.</p>`,
    };
  }

  const payload = job.payload;
  const subjectName = String(payload.company || payload.name || "contact").replace(/[\r\n]+/g, " ").slice(0, 100);
  return {
    subject: `Nouveau devis Tapote — ${subjectName}`,
    html: `<h1>Demande de devis</h1>
      <p><strong>Contact :</strong> ${escapeHtml(payload.name)} — ${escapeHtml(payload.email)}</p>
      <p><strong>Entreprise :</strong> ${escapeHtml(payload.company || "non renseignée")}</p>
      <p><strong>Besoin :</strong></p><p>${escapeHtml(payload.need).replaceAll("\n", "<br>")}</p>`,
  };
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
      to: [config.orderNotificationEmail],
      subject: message.subject,
      html: message.html,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Resend a refusé la notification (${response.status}).`);
}

export function createOutboxWorker({ config, repository, logger }) {
  let timer = null;
  let running = false;

  const runOnce = async () => {
    if (running) return;
    running = true;
    try {
      const jobs = await repository.claimOutboxJobs(8);
      for (const job of jobs) {
        try {
          if (config.resendApiKey && config.orderNotificationEmail) {
            const content = renderJob(job);
            await sendWithResend(config, { ...content, idempotencyKey: job.dedupeKey || job.dedupe_key });
          } else if (config.isProduction) {
            throw new Error("Resend n’est pas configuré en production.");
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
