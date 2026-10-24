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
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Giuliano Simeone",
    displayName: "G. Simeone",
    position: "RW",
    team: "Atlético Madrid",
    nationality: "Argentina",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
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
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Gavi",
    displayName: "Gavi",
    position: "CM",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.5,
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
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Clément Lenglet",
    displayName: "Lenglet",
    position: "CB",
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
    fullName: "Antonee Robinson",
    displayName: "Robinson",
    position: "LB",
    team: "Fulham",
    nationality: "United States",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Sacha Boey",
    displayName: "Boey",
    position: "RB",
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
    fullName: "Jérémy Doku",
    displayName: "Doku",
    position: "LW",
    team: "Manchester City",
    nationality: "Belgium",
    matchRating: 6.0,
    goals: 0,
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
    matchRating: 6.0,
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
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },

  // 3 Substitutes
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
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 30,
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 37...");

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

  console.log("\nLogging Match 37 with 14 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.minutesPlayed,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.isMotm
      ? "Debut MOTM display with 1 Goal"
      : p.assists > 0
        ? "Assisted 1 Goal"
        : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "AWAY",
    scoreHome: 1,
    scoreAway: 1,
    status: "COMPLETED",
    notes: "eFootball Away match logged from player ratings screenshot (1-1 Draw)",
    performances,
  });

  console.log(`\nMatch 37 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 37:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
