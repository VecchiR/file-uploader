-- AlterTable
ALTER TABLE "File" ADD COLUMN     "mimeType" VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "url" VARCHAR(2048) NOT NULL DEFAULT 'heyheyhey';
