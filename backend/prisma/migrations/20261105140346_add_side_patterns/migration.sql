-- CreateEnum
CREATE TYPE "SwapDirection" AS ENUM ('OUT', 'IN');

-- CreateTable
CREATE TABLE "SidePattern" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "opponentDeckName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SidePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidePatternCard" (
    "id" TEXT NOT NULL,
    "sidePatternId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "direction" "SwapDirection" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SidePatternCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SidePattern_deckId_idx" ON "SidePattern"("deckId");

-- CreateIndex
CREATE UNIQUE INDEX "SidePattern_deckId_opponentDeckName_key" ON "SidePattern"("deckId", "opponentDeckName");

-- CreateIndex
CREATE INDEX "SidePatternCard_sidePatternId_idx" ON "SidePatternCard"("sidePatternId");

-- CreateIndex
CREATE UNIQUE INDEX "SidePatternCard_sidePatternId_cardId_direction_key" ON "SidePatternCard"("sidePatternId", "cardId", "direction");

-- AddForeignKey
ALTER TABLE "SidePattern" ADD CONSTRAINT "SidePattern_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidePatternCard" ADD CONSTRAINT "SidePatternCard_sidePatternId_fkey" FOREIGN KEY ("sidePatternId") REFERENCES "SidePattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidePatternCard" ADD CONSTRAINT "SidePatternCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Each row moves 1 to 3 copies
ALTER TABLE "SidePatternCard" ADD CONSTRAINT "SidePatternCard_quantity_range" CHECK ("quantity" BETWEEN 1 AND 3);