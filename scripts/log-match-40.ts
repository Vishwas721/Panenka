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
    fullName: "Eric Cantona",
    displayName: "Cantona",
    position: "ST",
    team: "Manchester United",
    nationality: "France",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Victor Osimhen",
    displayName: "Osimhen",
    position: "ST",
    team: "Galatasaray",
    nationality: "Nigeria",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
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
    fullName: "Harry Wilson",
    displayName: "Wilson",
    position: "RW",
    team: "Fulham",
    nationality: "Wales",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Jakub Kiwior",
    displayName: "Kiwior",
    position: "CB",
    team: "Arsenal",
    nationality: "Poland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
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
    minutesPlayed: 90,
  },
  {
    fullName: "Jude Bellingham",
    displayName: "Bellingham",
    position: "CAM",
    team: "Real Madrid",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
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
    minutesPlayed: 90,
  },
  {
    fullName: "Daniel Svensson",
    displayName: "Svensson",
    position: "LB",
    team: "FC Nordsjælland",
    nationality: "Sweden",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Matthijs de Ligt",
    displayName: "de Ligt",
    position: "CB",
    team: "Manchester United",
    nationality: "Netherlands",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Manuel Akanji",
    displayName: "Akanji",
    position: "CB",
    team: "Manchester City",
    nationality: "Switzerland",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },

  // 3 Substitutes
  {
    fullName: "Kauã Elias",
    displayName: "Kauã Elias",
    position: "ST",
    team: "Fluminense",
    nationality: "Brazil",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
  {
    fullName: "Cristiano Ronaldo",
    displayName: "Ronaldo",
    position: "ST",
    team: "Al-Nassr",
    nationality: "Portugal",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
  {
    fullName: "Eden Hazard",
    displayName: "Hazard",
    position: "LW",
    team: "Real Madrid",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 40...");

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

  console.log("\nLogging Match 40 with 14 player performances...");

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
    scoreAway: 3,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (2-3 Loss)",
    performances,
  });

  console.log(`\nMatch 40 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 40:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
