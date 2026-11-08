-- CreateTable
CREATE TABLE "WthGuide" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "opponentDeckName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WthGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WthEntry" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "targetCardId" INTEGER NOT NULL,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WthEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WthResponse" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WthResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WthGuide_ownerId_opponentDeckName_key" ON "WthGuide"("ownerId", "opponentDeckName");

-- CreateIndex
CREATE UNIQUE INDEX "WthEntry_guideId_targetCardId_key" ON "WthEntry"("guideId", "targetCardId");

-- CreateIndex
CREATE UNIQUE INDEX "WthResponse_entryId_cardId_key" ON "WthResponse"("entryId", "cardId");

-- AddForeignKey
ALTER TABLE "WthGuide" ADD CONSTRAINT "WthGuide_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WthEntry" ADD CONSTRAINT "WthEntry_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "WthGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WthEntry" ADD CONSTRAINT "WthEntry_targetCardId_fkey" FOREIGN KEY ("targetCardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WthResponse" ADD CONSTRAINT "WthResponse_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "WthEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WthResponse" ADD CONSTRAINT "WthResponse_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
