-- Demo seed data for local development. Run AFTER schema.sql.
-- Creates one approved store with a few published products (+ images).

with city as (select id from cities where slug = 'aktobe' limit 1),
new_store as (
  insert into stores (name, slug, description, whatsapp, instagram, address, city_id, status, logo_url)
  select 'Aktobe Streetwear', 'aktobe-streetwear',
         'Premium streetwear & sneakers in central Aktobe.',
         '+77001234567', 'https://instagram.com/example',
         'Aktobe, Abilkaiyr Khan Ave 40', city.id, 'approved',
         'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'
  from city
  returning id
),
new_products as (
  insert into products (store_id, title, description, category_id, gender, brand, color, price, sizes, stock_quantity, status)
  select
    ns.id, v.title, v.descr,
    (select id from categories where slug = v.cat),
    v.gender::gender_type, v.brand, v.color, v.price, v.sizes, v.stock, 'published'
  from new_store ns,
  (values
    ('Oversized Hoodie Black', 'Heavyweight cotton, boxy fit.', 'streetwear', 'unisex', 'Kiyim', 'Black', 18990, array['S','M','L','XL'], 12, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'),
    ('Cargo Pants Olive', 'Tactical cargo with adjustable cuffs.', 'men', 'men', 'Kiyim', 'Olive', 24990, array['M','L','XL'], 8, 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800'),
    ('Air Sneakers White', 'Everyday cushioned sneakers.', 'shoes', 'unisex', 'Kiyim', 'White', 32990, array['40','41','42','43','44'], 20, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800')
  ) as v(title, descr, cat, gender, brand, color, price, sizes, stock, img)
  returning id, (select img from (values
    ('Oversized Hoodie Black', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'),
    ('Cargo Pants Olive', 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800'),
    ('Air Sneakers White', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800')
  ) as m(title, img) where m.title = products.title) as img
)
insert into product_images (product_id, url, sort_order, is_primary)
select id, img, 0, true from new_products;
