import PilotApp from "../pilot/PilotApp.jsx";

export default function AccessApp() {
  // /connexion est désormais un alias strict de l'espace client. L'application
  // Pilot gère elle-même la session, le lien magique et les comptes invités ;
  // aucun code, libellé ou appel Gestion n'entre dans cet écran public.
  return <PilotApp />;
}
