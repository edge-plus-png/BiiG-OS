-- CreateTable
CREATE TABLE "Introduction" (
    "id" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactCompany" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MADE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Introduction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
