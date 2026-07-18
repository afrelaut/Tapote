with pricing (product_id, legacy_names, current_name, price_cents, online_override) as (
  values
    ('plaque', array['La Plaque 12 × 12', 'Plaque 12 × 12'], 'La Plaque 12 × 12', 3900, null::boolean),
    ('comptoir', array['Le Comptoir A6', 'Comptoir A6'], 'Le Comptoir A6', 4900, null::boolean),
    ('table6', array['Les Chevalets A6 ×6', 'Chevalets A6 ×6'], 'Les Chevalets A6 ×6', 13900, null::boolean),
    ('carte', array['La Carte', 'Carte NFC'], 'La Carte', 2990, null::boolean),
    ('sticker', array['La Vitrine', 'Vitrine NFC', 'Sticker NFC', 'La Vitrine · packs uniquement'], 'La Vitrine', 2990, true),
    ('mini', array['Le Mini Comptoir', 'Mini Comptoir'], 'Le Mini Comptoir', 3400, null::boolean),
    ('pack_essentiel', array['Pack Essentiel'], 'Pack Essentiel', 5900, null::boolean),
    ('pack_visibilite', array['Pack Visibilité'], 'Pack Visibilité', 8900, null::boolean),
    ('pack_commerce', array['Pack Commerce'], 'Pack Commerce', 14900, null::boolean),
    ('pack_resto', array['Pack Restaurant', 'Pack Restaurant ×6'], 'Pack Restaurant', 19900, null::boolean),
    ('pack_salon', array['Pack Salon'], 'Pack Salon', 8900, null::boolean),
    ('pack_equipe', array['Pack Équipe'], 'Pack Équipe', 16900, null::boolean)
)
update public.management_storefront_products as product
set
  name = pricing.current_name,
  price_cents = pricing.price_cents,
  online = coalesce(pricing.online_override, product.online)
from pricing
where product.external_product_id = pricing.product_id
   or product.name = any(pricing.legacy_names);
