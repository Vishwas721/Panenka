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
    fullName: "Moussa Diaby",
    displayName: "Diaby",
    position: "RW",
    team: "Aston Villa",
    nationality: "France",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
  },
  {
    fullName: "Ángel Di María",
    displayName: "Di María",
    position: "RW",
    team: "SL Benfica",
    nationality: "Argentina",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
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
    fullName: "Micky van de Ven",
    displayName: "Van de Ven",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "Netherlands",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Jamal Musiala",
    displayName: "Musiala",
    position: "CM",
    team: "FC Bayern München",
    nationality: "Germany",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Alexander Sørloth",
    displayName: "Sørloth",
    position: "ST",
    team: "Atlético Madrid",
    nationality: "Norway",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Emiliano Martínez",
    displayName: "E. Martínez",
    position: "GK",
    team: "Aston Villa",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Moisés Caicedo",
    displayName: "Caicedo",
    position: "CDM",
    team: "Chelsea",
    nationality: "Ecuador",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Nuno Mendes",
    displayName: "Nuno Mendes",
    position: "LB",
    team: "Paris Saint-Germain",
    nationality: "Portugal",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Dani Carvajal",
    displayName: "Carvajal",
    position: "RB",
    team: "Real Madrid",
    nationality: "Spain",
    matchRating: 5.0,
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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Brahim Díaz",
    displayName: "Brahim",
    position: "CAM",
    team: "Real Madrid",
    nationality: "Morocco",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
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
    status: "SUBSTITUTE_USED",
  },
  {
    fullName: "Scott McTominay",
    displayName: "McTominay",
    position: "ST",
    team: "Manchester United",
    nationality: "Scotland",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
  {
    fullName: "Mikel Merino",
    displayName: "Merino",
    position: "CM",
    team: "Arsenal",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
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

  console.log("\nLogging Match 4 with 16 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.status === "STARTED" ? 90 : 30,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.isMotm
      ? "Team best rating (6.5) and scored only goal"
      : p.assists > 0
        ? "Assisted only goal"
        : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "HOME",
    scoreHome: 1,
    scoreAway: 4,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (1-4 Loss)",
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
