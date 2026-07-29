# Supabase Edge Functions

`essai-type` and `codex-bootstrap-test-users` are intentionally neutralized
with `410 Gone` responses. Their sources are kept here so a future deployment
cannot accidentally restore the former test behavior.

The production `contact` function remains deployed separately because existing
physical cards depend on its public URLs. Move it to `tapote.fr` before removing
the hosted function.
