-- CreateTable
CREATE TABLE "OwletOnlineUser" (
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
CREATE TABLE "OwletOnlineWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalFunded" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "totalRefunded" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OwletOnlineWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "OwletOnlineUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OwletOnlineOrder" (
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
    CONSTRAINT "OwletOnlineOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "OwletOnlineUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OwletOnlineTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OwletOnlineTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "OwletOnlineUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OwletOnlineApiToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OwletOnlineApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "OwletOnlineUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OwletOnlineUser_email_key" ON "OwletOnlineUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OwletOnlineUser_googleId_key" ON "OwletOnlineUser"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "OwletOnlineUser_referralCode_key" ON "OwletOnlineUser"("referralCode");

-- CreateIndex
CREATE INDEX "OwletOnlineUser_email_idx" ON "OwletOnlineUser"("email");

-- CreateIndex
CREATE INDEX "OwletOnlineUser_status_idx" ON "OwletOnlineUser"("status");

-- CreateIndex
CREATE INDEX "OwletOnlineUser_referralCode_idx" ON "OwletOnlineUser"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "OwletOnlineWallet_userId_key" ON "OwletOnlineWallet"("userId");

-- CreateIndex
CREATE INDEX "OwletOnlineOrder_userId_idx" ON "OwletOnlineOrder"("userId");

-- CreateIndex
CREATE INDEX "OwletOnlineOrder_status_idx" ON "OwletOnlineOrder"("status");

-- CreateIndex
CREATE INDEX "OwletOnlineOrder_gamesz360CampaignId_idx" ON "OwletOnlineOrder"("gamesz360CampaignId");

-- CreateIndex
CREATE INDEX "OwletOnlineOrder_serviceType_idx" ON "OwletOnlineOrder"("serviceType");

-- CreateIndex
CREATE INDEX "OwletOnlineOrder_createdAt_idx" ON "OwletOnlineOrder"("createdAt");

-- CreateIndex
CREATE INDEX "OwletOnlineTransaction_userId_idx" ON "OwletOnlineTransaction"("userId");

-- CreateIndex
CREATE INDEX "OwletOnlineTransaction_type_idx" ON "OwletOnlineTransaction"("type");

-- CreateIndex
CREATE INDEX "OwletOnlineTransaction_createdAt_idx" ON "OwletOnlineTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "OwletOnlineApiToken_userId_idx" ON "OwletOnlineApiToken"("userId");
