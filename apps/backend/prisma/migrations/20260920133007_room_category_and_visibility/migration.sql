-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "rooms_isPublic_category_idx" ON "rooms"("isPublic", "category");
