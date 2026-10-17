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
    matchRating: 7.0,
    goals: 1,
    assists: 1,
    isMotm: true,
    status: "STARTED",
  },
  {
    fullName: "Jamal Musiala",
    displayName: "Musiala",
    position: "CM",
    team: "FC Bayern München",
    nationality: "Germany",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
  },
  {
    fullName: "Ademola Lookman",
    displayName: "Lookman",
    position: "ST",
    team: "Atalanta",
    nationality: "Nigeria",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
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
    fullName: "Iñigo Martínez",
    displayName: "Iñigo Martínez",
    position: "CB",
    team: "FC Barcelona",
    nationality: "Spain",
    matchRating: 6.0,
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
    fullName: "Alessandro Bastoni",
    displayName: "Bastoni",
    position: "CB",
    team: "Inter Milan",
    nationality: "Italy",
    matchRating: 5.0,
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
    matchRating: 5.0,
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
    matchRating: 5.0,
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
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
  {
    fullName: "Justin Kluivert",
    displayName: "Kluivert",
    position: "CAM",
    team: "AFC Bournemouth",
    nationality: "Netherlands",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
  },
];

async function main() {
  console.log("Creating/verifying players in Panenka...");

  const playerIds: { [name: string]: string } = {};

  for (const p of matchPlayers) {
    const existing = await prisma.player.findFirst({
      where: {
        fullName: { equals: p.fullName, mode: "insensitive" },
      },
    });

    if (existing) {
      console.log(`Player already exists: ${existing.fullName} (${existing.id})`);
      playerIds[p.fullName] = existing.id;
    } else {
      const created = await createPlayer({
        fullName: p.fullName,
        displayName: p.displayName,
        position: p.position,
        team: p.team,
        nationality: p.nationality,
      });
      console.log(`Created player: ${created.fullName} (${created.id})`);
      playerIds[p.fullName] = created.id;
    }
  }

  console.log("\nLogging match with all 14 player performances...");

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
        : p.assists > 0
          ? "Provided 1 Assist"
          : undefined,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "eFootball Opponent",
    venue: "HOME",
    scoreHome: 2,
    scoreAway: 1,
    status: "COMPLETED",
    notes: "eFootball match logged from player ratings screenshot",
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
