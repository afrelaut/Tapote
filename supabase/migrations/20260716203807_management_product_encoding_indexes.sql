create index management_product_units_encoded_by_idx
  on public.management_product_units(encoded_by) where encoded_by is not null;
create index management_product_units_tested_by_idx
  on public.management_product_units(tested_by) where tested_by is not null;
