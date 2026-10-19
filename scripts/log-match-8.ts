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
    fullName: "Marcus Rashford",
    displayName: "Rashford",
    position: "LW",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: true,
    status: "STARTED",
  },
  {
    fullName: "Cristiano Ronaldo",
    displayName: "Ronaldo",
    position: "ST",
    team: "Al-Nassr",
    nationality: "Portugal",
    matchRating: 7.0,
    goals: 1,
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
    matchRating: 6.5,
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
    matchRating: 6.0,
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
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Daniel Svensson",
    displayName: "Svensson",
    position: "LB",
    team: "FC Nordsjælland",
    nationality: "Sweden",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Archie Gray",
    displayName: "Gray",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Eduardo Camavinga",
    displayName: "Camavinga",
    position: "CM",
    team: "Real Madrid",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Jude Bellingham",
    displayName: "Bellingham",
    position: "CAM",
    team: "Real Madrid",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Michael Olise",
    displayName: "Olise",
    position: "RW",
    team: "FC Bayern München",
    nationality: "France",
    matchRating: 5.5,
    goals: 0,
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
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Victor Osimhen",
    displayName: "Osimhen",
    position: "ST",
    team: "Galatasaray",
    nationality: "Nigeria",
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

  console.log("\nLogging Match 8 with 12 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.status === "STARTED" ? 90 : 30,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.isMotm
      ? "Man of the Match with 1 Goal and 1 Assist"
      : p.goals > 0
        ? "Scored 1 Goal"
        : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "HOME",
    scoreHome: 2,
    scoreAway: 1,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (2-1 Win)",
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
