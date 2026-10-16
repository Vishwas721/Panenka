-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('LEFT', 'RIGHT', 'BOTH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MatchVenue" AS ENUM ('HOME', 'AWAY', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "AppearanceStatus" AS ENUM ('STARTED', 'SUBSTITUTE_USED', 'UNUSED_SUBSTITUTE', 'DID_NOT_PLAY');

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT,
    "position" "Position" NOT NULL DEFAULT 'UNKNOWN',
    "preferredFoot" "PreferredFoot" NOT NULL DEFAULT 'UNKNOWN',
    "squadNumber" INTEGER,
    "team" TEXT,
    "nationality" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "opponent" TEXT NOT NULL,
    "team" TEXT,
    "competitionId" TEXT,
    "venue" "MatchVenue",
    "venueName" TEXT,
    "scoreHome" INTEGER,
    "scoreAway" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMatchPerformance" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "appearanceStatus" "AppearanceStatus" NOT NULL,
    "minutesPlayed" INTEGER,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PlayerMatchPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Competition_name_idx" ON "Competition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_name_season_key" ON "Competition"("name", "season");

-- CreateIndex
CREATE INDEX "Player_fullName_idx" ON "Player"("fullName");

-- CreateIndex
CREATE INDEX "Player_team_idx" ON "Player"("team");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_archivedAt_idx" ON "Player"("archivedAt");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_opponent_idx" ON "Match"("opponent");

-- CreateIndex
CREATE INDEX "Match_competitionId_idx" ON "Match"("competitionId");

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_playerId_idx" ON "PlayerMatchPerformance"("playerId");

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_matchId_idx" ON "PlayerMatchPerformance"("matchId");

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_goals_idx" ON "PlayerMatchPerformance"("goals");

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_assists_idx" ON "PlayerMatchPerformance"("assists");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchPerformance_playerId_matchId_key" ON "PlayerMatchPerformance"("playerId", "matchId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchPerformance" ADD CONSTRAINT "PlayerMatchPerformance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchPerformance" ADD CONSTRAINT "PlayerMatchPerformance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
