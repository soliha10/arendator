-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "PromotionTier" AS ENUM ('NONE', 'VIP', 'TOP');

-- CreateEnum
CREATE TYPE "PromotionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_DROP', 'LEAD_NEW', 'LEAD_STATUS', 'LISTING_STATUS', 'SAVED_SEARCH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SearchAlertFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "ArendatorProfile" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "cashCurrency" "Currency" NOT NULL DEFAULT 'UZS',
ADD COLUMN     "cashPrice" DECIMAL(18,2),
ADD COLUMN     "cashPriceUzs" DECIMAL(18,2),
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasCashSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "minDailyRentUzs" DECIMAL(18,2),
ADD COLUMN     "phoneRevealCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previousPriceUzs" DECIMAL(18,2),
ADD COLUMN     "priceChangedAt" TIMESTAMP(3),
ADD COLUMN     "promotedUntil" TIMESTAMP(3),
ADD COLUMN     "promotion" "PromotionTier" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "telegram" TEXT;

-- AlterTable
ALTER TABLE "RentalPlan" ADD COLUMN     "dailyPayment" DECIMAL(18,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "notificationPrefs" JSONB,
ADD COLUMN     "telegram" TEXT;

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "priceUzs" DECIMAL(18,2) NOT NULL,
    "monthlyUzs" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "listingId" TEXT,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "SearchAlertFrequency" NOT NULL DEFAULT 'INSTANT',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "PromotionTier" NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 7,
    "status" "PromotionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_listingId_createdAt_idx" ON "PriceHistory"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_createdAt_idx" ON "SavedSearch"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedSearch_notify_idx" ON "SavedSearch"("notify");

-- CreateIndex
CREATE INDEX "PromotionRequest_status_createdAt_idx" ON "PromotionRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PromotionRequest_listingId_idx" ON "PromotionRequest"("listingId");

-- CreateIndex
CREATE INDEX "Listing_promotion_publishedAt_idx" ON "Listing"("promotion", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Listing_cashPriceUzs_idx" ON "Listing"("cashPriceUzs");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
