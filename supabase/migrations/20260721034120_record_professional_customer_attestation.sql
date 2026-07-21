begin;

alter table public.orders
  add column if not exists professional_customer boolean not null default false,
  add column if not exists professional_customer_attested_at timestamptz;

alter table public.orders
  drop constraint if exists orders_professional_attestation_consistency;

alter table public.orders
  add constraint orders_professional_attestation_consistency check (
    (professional_customer = false and professional_customer_attested_at is null)
    or (professional_customer = true and professional_customer_attested_at is not null)
  );

comment on column public.orders.professional_customer is
  'Attestation explicite que la commande est passée pour une activité professionnelle.';
comment on column public.orders.professional_customer_attested_at is
  'Horodatage serveur de l’attestation professionnelle donnée au checkout.';

commit;
