-- AlterTable: Rename zipCode to postalCode in customers table
ALTER TABLE "customers" RENAME COLUMN "zipCode" TO "postalCode";

-- AlterTable: Rename zipCode to postalCode in properties table
ALTER TABLE "properties" RENAME COLUMN "zipCode" TO "postalCode";






