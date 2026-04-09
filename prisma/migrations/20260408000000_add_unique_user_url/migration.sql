-- Remove duplicate (user_id, url) rows, keeping only the earliest entry
DELETE FROM "applications" a
USING "applications" b
WHERE a."user_id" = b."user_id"
  AND a."url" = b."url"
  AND a."created_at" > b."created_at";

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_url_key" ON "applications"("user_id", "url");
