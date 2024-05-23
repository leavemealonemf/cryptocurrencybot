/*
  Warnings:

  - You are about to alter the column `telegramId` on the `user` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" INTEGER NOT NULL
);
INSERT INTO "new_user" ("id", "telegramId") SELECT "id", "telegramId" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
PRAGMA foreign_key_check("user");
PRAGMA foreign_keys=ON;
