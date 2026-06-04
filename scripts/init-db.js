#!/usr/bin/env node

const { createClient } = require('@libsql/client');

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

// SQL to create tables for SABI
const createTablesSQL = `
-- SabiUser table
CREATE TABLE IF NOT EXISTS "SabiUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT,
  "name" TEXT NOT NULL,
  "businessName" TEXT,
  "phone" TEXT,
  "country" TEXT NOT NULL DEFAULT 'NG',
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "verifyCode" TEXT,
  "verifyCodeExpiry" DATETIME,
  "googleId" TEXT UNIQUE,
  "avatarUrl" TEXT,
  "referralCode" TEXT UNIQUE,
  "referredByCode" TEXT,
  "sessionToken" TEXT,
  "sessionExpiry" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'active',
  "apiKeyHash" TEXT,
  "apiKeyCreatedAt" DATETIME,
  "webhookUrl" TEXT,
  "notifyEmail" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SabiUser_email_idx" on "SabiUser"("email");
CREATE INDEX IF NOT EXISTS "SabiUser_status_idx" on "SabiUser"("status");
CREATE INDEX IF NOT EXISTS "SabiUser_referralCode_idx" on "SabiUser"("referralCode");

-- SabiWallet table
CREATE TABLE IF NOT EXISTS "SabiWallet" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "totalFunded" INTEGER NOT NULL DEFAULT 0,
  "totalSpent" INTEGER NOT NULL DEFAULT 0,
  "totalRefunded" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SabiWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE
);

-- SabiOrder table
CREATE TABLE IF NOT EXISTS "SabiOrder" (
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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  CONSTRAINT "SabiOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SabiOrder_userId_idx" on "SabiOrder"("userId");
CREATE INDEX IF NOT EXISTS "SabiOrder_status_idx" on "SabiOrder"("status");
CREATE INDEX IF NOT EXISTS "SabiOrder_gamesz360CampaignId_idx" on "SabiOrder"("gamesz360CampaignId");
CREATE INDEX IF NOT EXISTS "SabiOrder_serviceType_idx" on "SabiOrder"("serviceType");
CREATE INDEX IF NOT EXISTS "SabiOrder_createdAt_idx" on "SabiOrder"("createdAt");

-- SabiTransaction table
CREATE TABLE IF NOT EXISTS "SabiTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reference" TEXT,
  "description" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SabiTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SabiTransaction_userId_idx" on "SabiTransaction"("userId");
CREATE INDEX IF NOT EXISTS "SabiTransaction_type_idx" on "SabiTransaction"("type");
CREATE INDEX IF NOT EXISTS "SabiTransaction_createdAt_idx" on "SabiTransaction"("createdAt");

-- SabiApiToken table
CREATE TABLE IF NOT EXISTS "SabiApiToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "lastUsedAt" DATETIME,
  "expiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SabiApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SabiUser" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SabiApiToken_userId_idx" on "SabiApiToken"("userId");
`;

async function initDB() {
  try {
    console.log('Initializing Turso database...');

    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Split SQL by semicolon and execute each statement
    const statements = createTablesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.execute(statement);
    }

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

initDB();
