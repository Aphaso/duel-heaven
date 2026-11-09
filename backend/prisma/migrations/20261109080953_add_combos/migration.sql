-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startingHand" INTEGER[],
    "steps" JSONB NOT NULL DEFAULT '[]',
    "stepCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboCard" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "section" "DeckSection" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ComboCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Combo_ownerId_idx" ON "Combo"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ComboCard_comboId_cardId_section_key" ON "ComboCard"("comboId", "cardId", "section");

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboCard" ADD CONSTRAINT "ComboCard_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboCard" ADD CONSTRAINT "ComboCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quantity Check
ALTER TABLE "ComboCard" ADD CONSTRAINT "ComboCard_quantity_range" CHECK ("quantity" BETWEEN 1 AND 3);