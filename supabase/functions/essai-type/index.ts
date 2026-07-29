import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() => new Response("Probe closed", {
  status: 410,
  headers: {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8",
  },
}));
