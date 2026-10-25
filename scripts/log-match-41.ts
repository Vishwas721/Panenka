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
    fullName: "Matteo Guendouzi",
    displayName: "Guendouzi",
    position: "CM",
    team: "Lazio",
    nationality: "France",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Brian Rodríguez",
    displayName: "B. Rodríguez",
    position: "LW",
    team: "Club América",
    nationality: "Uruguay",
    matchRating: 6.5,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
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
    fullName: "Micky van de Ven",
    displayName: "van de Ven",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "Netherlands",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Casemiro",
    displayName: "Casemiro",
    position: "CDM",
    team: "Manchester United",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Giorgi Mamardashvili",
    displayName: "Mamardashvili",
    position: "GK",
    team: "Valencia",
    nationality: "Georgia",
    matchRating: 5.0,
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
  {
    fullName: "Mikel Oyarzabal",
    displayName: "Oyarzabal",
    position: "ST",
    team: "Real Sociedad",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Nathan Tjoe-A-On",
    displayName: "Tjoe-A-On",
    position: "LB",
    team: "Swansea City",
    nationality: "Indonesia",
    matchRating: 4.0,
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
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
  {
    fullName: "Matteo Darmian",
    displayName: "Darmian",
    position: "RB",
    team: "Inter Milan",
    nationality: "Italy",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
  {
    fullName: "Dani Olmo",
    displayName: "Dani Olmo",
    position: "CAM",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 41...");

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

  console.log("\nLogging Match 41 with 14 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.minutesPlayed,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes:
      p.goals > 0 && p.assists > 0
        ? "Debut Goal and Assist"
        : p.goals > 0
          ? "Debut Goal"
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

  console.log(`\nMatch 41 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 41:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
