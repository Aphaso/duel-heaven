-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

UPDATE "Playlist" p
SET "position" = r.rn
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "ownerId" ORDER BY lower(name), id) - 1 AS rn
    FROM "Playlist"
) r
WHERE p.id = r.id;