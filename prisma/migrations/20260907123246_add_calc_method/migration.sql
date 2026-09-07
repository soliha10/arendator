-- CreateEnum
CREATE TYPE "CalcMethod" AS ENUM ('ANNUITY', 'FLAT', 'FIXED');

-- AlterTable
ALTER TABLE "RentalPlan" ADD COLUMN     "calcMethod" "CalcMethod" NOT NULL DEFAULT 'ANNUITY';
