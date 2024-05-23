/*
  Warnings:

  - Added the required column `symbol` to the `fav_coins` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fav_coins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coin" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "fav_coins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_fav_coins" ("coin", "id", "userId") SELECT "coin", "id", "userId" FROM "fav_coins";
DROP TABLE "fav_coins";
ALTER TABLE "new_fav_coins" RENAME TO "fav_coins";
PRAGMA foreign_key_check("fav_coins");
PRAGMA foreign_keys=ON;
