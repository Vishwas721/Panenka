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
    fullName: "Giuliano Simeone",
    displayName: "Simeone",
    position: "RW",
    team: "Atlético Madrid",
    nationality: "Argentina",
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
  },
  {
    fullName: "Jude Bellingham",
    displayName: "Bellingham",
    position: "CAM",
    team: "Real Madrid",
    nationality: "England",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Iñigo Martínez",
    displayName: "Iñigo Martínez",
    position: "CB",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.5,
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
    fullName: "Manuel Akanji",
    displayName: "Akanji",
    position: "CB",
    team: "Manchester City",
    nationality: "Switzerland",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Serginho",
    displayName: "Serginho",
    position: "LB",
    team: "AC Milan",
    nationality: "Brazil",
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
  },
  {
    fullName: "Marquinhos",
    displayName: "Marquinhos",
    position: "CB",
    team: "Paris Saint-Germain",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
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
    status: "STARTED",
  },
  {
    fullName: "Marcus Rashford",
    displayName: "Rashford",
    position: "LW",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
  {
    fullName: "Archie Gray",
    displayName: "Gray",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "England",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 13...");

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

  console.log("\nLogging Match 13 with 13 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.status === "STARTED" ? 90 : 30,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.isMotm
      ? "Match winner with 1 Goal"
      : p.assists > 0
        ? "Assisted the winning goal"
        : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "HOME",
    scoreHome: 1,
    scoreAway: 0,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (1-0 Clean Sheet Win)",
    performances,
  });

  console.log(`\nMatch 13 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
  console.log(`MOTM: ${match.performances.find((p) => p.isMotm)?.player.fullName}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 13:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
