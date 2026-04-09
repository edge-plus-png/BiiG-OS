ALTER TABLE "Referral"
  ALTER COLUMN "toMemberId" DROP NOT NULL,
  ADD COLUMN "toExternalName" TEXT,
  ADD COLUMN "toExternalBusiness" TEXT;

ALTER TABLE "ThankYou"
  ALTER COLUMN "toMemberId" DROP NOT NULL,
  ADD COLUMN "toExternalName" TEXT,
  ADD COLUMN "toExternalBusiness" TEXT;
