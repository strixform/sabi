/*
  Warnings:

  - You are about to drop the `OwletOnlineApiToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwletOnlineOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwletOnlineTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwletOnlineUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwletOnlineWallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OwletOnlineApiToken";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OwletOnlineOrder";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OwletOnlineTransaction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OwletOnlineUser";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OwletOnlineWallet";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SabiUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "phone" TEXT,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyCode" TEXT,
    "verifyCodeExpiry" DATETIME,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "referralCode" TEXT,
    "referredByCode" TEXT,
    "sessionToken" TEXT,
    "sessionExpiry" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "apiKeyHash" TEXT,
    "apiKeyCreatedAt" DATETIME,
    "webhookUrl" TEXT,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SabiWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalFunded" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "totalRefunded" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SabiWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SabiOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'flutterwave',
    "transactionRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "gamesz360CampaignId" TEXT,
    "gamesz360AdvertiserId" TEXT,
    "completedQuantity" INTEGER NOT NULL DEFAULT 0,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "estimatedCompletion" DATETIME,
    "orderedVia" TEXT NOT NULL DEFAULT 'web',
    "clientId" TEXT,
    "customRef" TEXT,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "refundReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "SabiOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SabiTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SabiTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SabiApiToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SabiApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SabiUser_email_key" ON "SabiUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SabiUser_googleId_key" ON "SabiUser"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "SabiUser_referralCode_key" ON "SabiUser"("referralCode");

-- CreateIndex
CREATE INDEX "SabiUser_email_idx" ON "SabiUser"("email");

-- CreateIndex
CREATE INDEX "SabiUser_status_idx" ON "SabiUser"("status");

-- CreateIndex
CREATE INDEX "SabiUser_referralCode_idx" ON "SabiUser"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "SabiWallet_userId_key" ON "SabiWallet"("userId");

-- CreateIndex
CREATE INDEX "SabiOrder_userId_idx" ON "SabiOrder"("userId");

-- CreateIndex
CREATE INDEX "SabiOrder_status_idx" ON "SabiOrder"("status");

-- CreateIndex
CREATE INDEX "SabiOrder_gamesz360CampaignId_idx" ON "SabiOrder"("gamesz360CampaignId");

-- CreateIndex
CREATE INDEX "SabiOrder_serviceType_idx" ON "SabiOrder"("serviceType");

-- CreateIndex
CREATE INDEX "SabiOrder_createdAt_idx" ON "SabiOrder"("createdAt");

-- CreateIndex
CREATE INDEX "SabiTransaction_userId_idx" ON "SabiTransaction"("userId");

-- CreateIndex
CREATE INDEX "SabiTransaction_type_idx" ON "SabiTransaction"("type");

-- CreateIndex
CREATE INDEX "SabiTransaction_createdAt_idx" ON "SabiTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "SabiApiToken_userId_idx" ON "SabiApiToken"("userId");
