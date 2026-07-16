import { useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { sendManagerPasswordReset, signInManager } from "./repository.js";

function authMessage(error) {
  const message = String(error?.message || "");
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Ouvre d’abord l’invitation reçue par e-mail.";
  if (/rate limit/i.test(message)) return "Trop de tentatives. Réessaie dans quelques minutes.";
  return message || "Connexion impossible pour le moment.";
}

export default function ManagementAuth({ unauthorized = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(unauthorized ? "Ce compte n’est pas autorisé à accéder à TAPOTE Gestion." : "");
  const [resetSent, setResetSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await signInManager(email.trim().toLowerCase(), password);
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setMessage("Saisis d’abord ton adresse e-mail.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await sendManagerPasswordReset(email.trim().toLowerCase());
      setResetSent(true);
      setMessage("Lien de réinitialisation envoyé si ce compte existe.");
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="management-auth-shell">
      <section className="management-auth-card">
        <div className="management-auth-brand"><span>tAPOTE.</span><small>GESTION PRIVÉE</small></div>
        <div className="management-auth-icon"><LockKeyhole size={28} /></div>
        <div className="management-auth-copy">
          <span>ESPACE GÉRANTS</span>
          <h1>Connexion sécurisée</h1>
          <p>Accès réservé aux comptes TAPOTE invités. Aucun compte public ne peut s’inscrire ici.</p>
        </div>
        <form onSubmit={submit} className="management-auth-form">
          <label htmlFor="management-email"><span>Adresse e-mail</span><div><Mail size={18} /><input id="management-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom@tapote.fr" required /></div></label>
          <label htmlFor="management-password"><span>Mot de passe</span><div><KeyRound size={18} /><input id="management-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" minLength="8" required /></div></label>
          {message && <div className={`management-auth-message ${resetSent ? "is-success" : ""}`} role="status">{message}</div>}
          <button className="pilot-primary management-auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="is-spinning" size={18} /> : <ShieldCheck size={18} />}{loading ? "Vérification…" : "Ouvrir la gestion"}<ArrowRight size={17} /></button>
          <button className="management-auth-reset" type="button" onClick={resetPassword} disabled={loading}>Mot de passe oublié ?</button>
        </form>
        <footer><ShieldCheck size={15} /><span>Sessions chiffrées · accès contrôlé par rôles · journal d’audit actif</span></footer>
      </section>
    </main>
  );
}
