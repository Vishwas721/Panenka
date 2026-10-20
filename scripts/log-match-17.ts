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
    fullName: "Cristiano Ronaldo",
    displayName: "Ronaldo",
    position: "ST",
    team: "Al-Nassr",
    nationality: "Portugal",
    matchRating: 9.0,
    goals: 6,
    assists: 0,
    isMotm: true,
    status: "STARTED",
  },
  {
    fullName: "Marcus Rashford",
    displayName: "Rashford",
    position: "LW",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.0,
    goals: 1,
    assists: 3,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Fabián Ruiz",
    displayName: "Fabián",
    position: "CM",
    team: "Paris Saint-Germain",
    nationality: "Spain",
    matchRating: 6.5,
    goals: 0,
    assists: 2,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.5,
    goals: 0,
    assists: 2,
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
    fullName: "Gavi",
    displayName: "Gavi",
    position: "CM",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.0,
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
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Iñigo Martínez",
    displayName: "Iñigo Martínez",
    position: "CB",
    team: "Barcelona",
    nationality: "Spain",
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
    fullName: "Serginho",
    displayName: "Serginho",
    position: "LB",
    team: "AC Milan",
    nationality: "Brazil",
    matchRating: 5.0,
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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 17...");

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

  console.log("\nLogging Match 17 with 11 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: 90,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.isMotm
      ? "Legendary double hat-trick performance with 6 Goals (9.0 rating)"
      : p.goals > 0 && p.assists > 0
        ? `1 Goal and ${p.assists} Assists`
        : p.assists > 0
          ? `${p.assists} Assists`
          : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "HOME",
    scoreHome: 7,
    scoreAway: 3,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshot (7-3 Win - Ronaldo 6 Goals)",
    performances,
  });

  console.log(`\nMatch 17 successfully created! ID: ${match.id}`);
  console.log(`Score: Home ${match.scoreHome} - ${match.scoreAway} Away`);
  console.log(`Appearances recorded: ${match.performances.length}`);
  console.log(`MOTM: ${match.performances.find((p) => p.isMotm)?.player.fullName}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 17:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
