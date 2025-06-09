/*
  Warnings:

  - You are about to drop the column `parentFolderID` on the `File` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_parentFolderID_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "parentFolderID",
ADD COLUMN     "parentFolderId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
