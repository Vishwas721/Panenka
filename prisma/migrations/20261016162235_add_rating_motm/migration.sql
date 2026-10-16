-- AlterTable
ALTER TABLE "PlayerMatchPerformance" ADD COLUMN     "isMotm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_isMotm_idx" ON "PlayerMatchPerformance"("isMotm");
