-- Non-breaking hardening of payment-proofs (frontend still uses public URLs).
update storage.buckets
   set file_size_limit = 8 * 1024 * 1024,
       allowed_mime_types = array['image/png','image/jpeg','image/webp','application/pdf']
 where id = 'payment-proofs';
drop policy if exists "Public can read payment proofs" on storage.objects;
