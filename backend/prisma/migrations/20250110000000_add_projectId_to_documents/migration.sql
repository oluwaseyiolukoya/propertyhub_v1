-- AlterTable
ALTER TABLE "documents" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "documents_projectId_idx" ON "documents"("projectId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

