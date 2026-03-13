-- Add indexes for query optimization

-- Appointment indexes
CREATE INDEX IF NOT EXISTS "Appointment_date_status_idx" ON "Appointment"("date", "status");
CREATE INDEX IF NOT EXISTS "Appointment_createdAt_idx" ON "Appointment"("createdAt");

-- GuidancePlan indexes  
CREATE INDEX IF NOT EXISTS "GuidancePlan_babalawoId_status_idx" ON "GuidancePlan"("babalawoId", "status");
CREATE INDEX IF NOT EXISTS "GuidancePlan_clientId_status_idx" ON "GuidancePlan"("clientId", "status");

-- Product indexes
CREATE INDEX IF NOT EXISTS "Product_vendorId_status_idx" ON "Product"("vendorId", "status");
CREATE INDEX IF NOT EXISTS "Product_category_status_idx" ON "Product"("category", "status");

-- Order indexes
CREATE INDEX IF NOT EXISTS "Order_customerId_status_idx" ON "Order"("customerId", "status");
CREATE INDEX IF NOT EXISTS "Order_vendorId_status_idx" ON "Order"("vendorId", "status");
CREATE INDEX IF NOT EXISTS "Order_paidAt_idx" ON "Order"("paidAt");

-- Transaction indexes
CREATE INDEX IF NOT EXISTS "Transaction_userId_type_idx" ON "Transaction"("userId", "type");
CREATE INDEX IF NOT EXISTS "Transaction_userId_status_idx" ON "Transaction"("userId", "status");
CREATE INDEX IF NOT EXISTS "Transaction_walletId_createdAt_idx" ON "Transaction"("walletId", "createdAt");

-- Dispute indexes
CREATE INDEX IF NOT EXISTS "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Dispute_type_status_idx" ON "Dispute"("type", "status");

-- Escrow indexes
CREATE INDEX IF NOT EXISTS "Escrow_userId_status_idx" ON "Escrow"("userId", "status");
CREATE INDEX IF NOT EXISTS "Escrow_status_autoReleaseAt_idx" ON "Escrow"("status", "autoReleaseAt");

-- WithdrawalRequest indexes
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_userId_status_idx" ON "WithdrawalRequest"("userId", "status");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_createdAt_idx" ON "WithdrawalRequest"("status", "createdAt");