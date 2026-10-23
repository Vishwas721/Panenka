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
    fullName: "Jude Bellingham",
    displayName: "Bellingham",
    position: "CAM",
    team: "Real Madrid",
    nationality: "England",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Giuliano Simeone",
    displayName: "Simeone",
    position: "RW",
    team: "Atlético Madrid",
    nationality: "Argentina",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Cristiano Ronaldo",
    displayName: "Ronaldo",
    position: "ST",
    team: "Al-Nassr",
    nationality: "Portugal",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Boubacar Kamara",
    displayName: "Kamara",
    position: "CDM",
    team: "Aston Villa",
    nationality: "France",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Marcus Rashford",
    displayName: "Rashford",
    position: "LW",
    team: "Manchester United",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "David Raya",
    displayName: "Raya",
    position: "GK",
    team: "Arsenal",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Manuel Akanji",
    displayName: "Akanji",
    position: "CB",
    team: "Manchester City",
    nationality: "Switzerland",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Rúben Dias",
    displayName: "Rúben Dias",
    position: "CB",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Kieran Trippier",
    displayName: "Trippier",
    position: "RB",
    team: "Newcastle United",
    nationality: "England",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Noussair Mazraoui",
    displayName: "Mazraoui",
    position: "RB",
    team: "Manchester United",
    nationality: "Morocco",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Alessandro Del Piero",
    displayName: "Del Piero",
    position: "ST",
    team: "Juventus",
    nationality: "Italy",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Gavi",
    displayName: "Gavi",
    position: "CM",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 27...");

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

  console.log("\nLogging Match 27 with 13 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.status === "STARTED" ? 90 : 30,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes:
      p.goals > 0
        ? "Scored 1 Goal"
        : p.assists > 0
          ? "Assisted 1 Goal"
          : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "AWAY",
    scoreHome: 4,
    scoreAway: 2,
    status: "COMPLETED",
    notes: "eFootball Away match logged from player ratings screenshot (4-2 Loss)",
    performances,
  });

  console.log(`\nMatch 27 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 27:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
