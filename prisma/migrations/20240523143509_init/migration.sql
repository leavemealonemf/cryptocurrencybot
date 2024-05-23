-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "fav_coins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coin" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "fav_coins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
