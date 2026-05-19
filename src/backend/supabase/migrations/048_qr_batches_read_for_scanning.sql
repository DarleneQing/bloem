-- Migration 048: Allow authenticated users to read qr_batches for QR scanning
--
-- The public QR item page joins qr_codes -> qr_batches -> markets. Migration 030
-- restricted qr_batches SELECT to admins only, so non-admin buyers saw
-- "QR Code Not Found" even when the code exists. Writes remain admin-only.

DROP POLICY IF EXISTS "Authenticated can read qr_batches for scanning" ON qr_batches;

CREATE POLICY "Authenticated can read qr_batches for scanning"
  ON qr_batches
  FOR SELECT
  TO authenticated
  USING (true);
