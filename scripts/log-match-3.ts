import { prisma } from "../src/server/db/client";
import { createPlayer, createMatch } from "../src/server/services";
import type { Position, AppearanceStatus } from "@prisma/client";

interface PlayerData {
  fullName: string;
  displayName: string;
  position: Position;
  team: string;
  nationality: string;
  matchRating: number;
  goals: number;
  assists: number;
  isMotm: boolean;
  status: AppearanceStatus;
}

const matchPlayers: PlayerData[] = [
  {
    fullName: "Scott McTominay",
    displayName: "McTominay",
    position: "ST",
    team: "Manchester United",
    nationality: "Scotland",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
  },
  {
    fullName: "Justin Kluivert",
    displayName: "Kluivert",
    position: "CAM",
    team: "AFC Bournemouth",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Emiliano Martínez",
    displayName: "E. Martínez",
    position: "GK",
    team: "Aston Villa",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "N'Golo Kanté",
    displayName: "Kanté",
    position: "CDM",
    team: "Al-Ittihad",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Toni Kroos",
    displayName: "Kroos",
    position: "CM",
    team: "Real Madrid",
    nationality: "Germany",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Kim Min-Jae",
    displayName: "Kim Min-Jae",
    position: "CB",
    team: "FC Bayern München",
    nationality: "South Korea",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Alessandro Bastoni",
    displayName: "Bastoni",
    position: "CB",
    team: "Inter Milan",
    nationality: "Italy",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Achraf Hakimi",
    displayName: "Hakimi",
    position: "RB",
    team: "Paris Saint-Germain",
    nationality: "Morocco",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Moussa Diaby",
    displayName: "Diaby",
    position: "RW",
    team: "Aston Villa",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Federico Dimarco",
    displayName: "Dimarco",
    position: "LB",
    team: "Inter Milan",
    nationality: "Italy",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
];

async function main() {
  console.log("Checking/creating players in Panenka...");

  const playerIds: { [name: string]: string } = {};

  for (const p of matchPlayers) {
    const existing = await prisma.player.findFirst({
      where: {
        fullName: { equals: p.fullName, mode: "insensitive" },
      },
    });

    if (existing) {
      console.log(`Player found: ${existing.fullName} (${existing.id})`);
      playerIds[p.fullName] = existing.id;
    } else {
      const created = await createPlayer({
        fullName: p.fullName,
        displayName: p.displayName,
        position: p.position,
        team: p.team,
        nationality: p.nationality,
      });
      console.log(`Created new player: ${created.fullName} (${created.id})`);
      playerIds[p.fullName] = created.id;
    }
  }

  console.log("\nLogging Match 3 with 11 starting players...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: 90,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.isMotm
      ? "Man of the Match with 2 Goals (Brace)"
      : p.assists > 0
        ? "Provided 1 Assist"
        : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "HOME",
    scoreHome: 2,
    scoreAway: 1,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (Brace for McTominay)",
    performances,
  });

  console.log(`\nMatch successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
  console.log(`MOTM: ${match.performances.find((p) => p.isMotm)?.player.fullName}`);
}

main()
  .catch((e) => {
    console.error("Error logging match:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
