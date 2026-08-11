-- ADR-053: "I picked the wrong account type at signup" support ticket — a user submits a
-- request, an admin reviews and approves/rejects it; accountType itself is never self-service.

-- CreateEnum
CREATE TYPE "AccountTypeChangeRequestStatus" AS ENUM ('PENDING', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_TYPE_CHANGE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_TYPE_CHANGE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_TYPE_CHANGE_INFO_REQUESTED';

-- CreateTable
CREATE TABLE "account_type_change_request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentType" "AccountType" NOT NULL,
    "requestedType" "AccountType" NOT NULL,
    "reason" TEXT NOT NULL,
    "supportingInfo" TEXT,
    "status" "AccountTypeChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_type_change_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_type_change_request_userId_idx" ON "account_type_change_request"("userId");

-- CreateIndex
CREATE INDEX "account_type_change_request_status_idx" ON "account_type_change_request"("status");

-- AddForeignKey
ALTER TABLE "account_type_change_request" ADD CONSTRAINT "account_type_change_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_type_change_request" ADD CONSTRAINT "account_type_change_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
