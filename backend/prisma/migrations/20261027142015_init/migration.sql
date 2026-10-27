-- CreateTable
CREATE TABLE "Card" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frameType" TEXT,
    "desc" TEXT NOT NULL,
    "atk" INTEGER,
    "def" INTEGER,
    "level" INTEGER,
    "race" TEXT,
    "attribute" TEXT,
    "archetype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_name_idx" ON "Card"("name");
