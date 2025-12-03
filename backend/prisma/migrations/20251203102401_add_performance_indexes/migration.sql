-- CreateIndex
CREATE INDEX IF NOT EXISTS "leases_propertyId_idx" ON "leases"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leases_tenantId_idx" ON "leases"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leases_status_idx" ON "leases"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leases_propertyId_status_idx" ON "leases"("propertyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_propertyId_status_idx" ON "payments"("propertyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_ownerId_idx" ON "properties"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_customerId_idx" ON "properties"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "units_propertyId_idx" ON "units"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "units_status_idx" ON "units"("status");

