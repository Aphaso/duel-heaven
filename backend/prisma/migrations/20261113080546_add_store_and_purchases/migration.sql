-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isForSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceCents" INTEGER,
ADD COLUMN     "snapshot" JSONB;

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stripeSessionId_key" ON "Purchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Purchase_playlistId_idx" ON "Purchase"("playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_buyerId_playlistId_key" ON "Purchase"("buyerId", "playlistId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
