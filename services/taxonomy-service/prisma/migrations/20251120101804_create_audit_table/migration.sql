-- CreateTable
CREATE TABLE "Audit" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "observationId" INTEGER,
    "speciesId" INTEGER,
    "userId" INTEGER,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Audit_userId_idx" ON "Audit"("userId");

-- CreateIndex
CREATE INDEX "Audit_speciesId_idx" ON "Audit"("speciesId");

-- CreateIndex
CREATE INDEX "Audit_observationId_idx" ON "Audit"("observationId");
