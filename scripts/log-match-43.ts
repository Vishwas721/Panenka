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
  minutesPlayed: number;
}

const matchPlayers: PlayerData[] = [
  // 11 Starters
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Luis Suárez",
    displayName: "Suárez",
    position: "ST",
    team: "Inter Miami",
    nationality: "Uruguay",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Micky van de Ven",
    displayName: "van de Ven",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Dani Olmo",
    displayName: "Dani Olmo",
    position: "CAM",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Etrit Berisha",
    displayName: "Berisha",
    position: "GK",
    team: "Empoli",
    nationality: "Albania",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Dayot Upamecano",
    displayName: "Upamecano",
    position: "CB",
    team: "FC Bayern München",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Joe Gomez",
    displayName: "Gomez",
    position: "CB",
    team: "Liverpool",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Rodri",
    displayName: "Rodri",
    position: "CDM",
    team: "Manchester City",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Matteo Guendouzi",
    displayName: "Guendouzi",
    position: "CM",
    team: "Lazio",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Antoine Griezmann",
    displayName: "Griezmann",
    position: "ST",
    team: "Atlético Madrid",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Reece James",
    displayName: "James",
    position: "RB",
    team: "Chelsea",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },

  // 3 Substitutes
  {
    fullName: "Andriy Shevchenko",
    displayName: "Shevchenko",
    position: "ST",
    team: "AC Milan",
    nationality: "Ukraine",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
  {
    fullName: "Luis Henrique",
    displayName: "Luis Henrique",
    position: "RB",
    team: "Inter Milan",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
  {
    fullName: "Julio Enciso",
    displayName: "Enciso",
    position: "ST",
    team: "Brighton",
    nationality: "Paraguay",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 43...");

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

  console.log("\nLogging Match 43 with 14 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.minutesPlayed,
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
    venue: "HOME",
    scoreHome: 2,
    scoreAway: 2,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (2-2 Draw)",
    performances,
  });

  console.log(`\nMatch 43 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 43:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
