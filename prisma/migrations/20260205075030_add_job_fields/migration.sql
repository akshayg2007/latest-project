-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "maxBudget" INTEGER,
ADD COLUMN     "maxProposals" INTEGER,
ADD COLUMN     "minBudget" INTEGER,
ADD COLUMN     "timeline" TEXT,
ALTER COLUMN "budget" SET DEFAULT 0;
