-- AlterTable
ALTER TABLE "user" ADD COLUMN "phoneNumber" TEXT,
ADD COLUMN "phoneNumberVerified" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "user_phoneNumber_key" ON "user"("phoneNumber");
