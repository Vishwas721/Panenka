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
  notes?: string;
}

const matchPlayers: PlayerData[] = [
  // 11 Starters (Full 90 mins)
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal, Assisted 1 Goal",
  },
  {
    fullName: "Thomas Müller",
    displayName: "Müller",
    position: "CAM",
    team: "FC Bayern München",
    nationality: "Germany",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal (100th club goal!)",
  },
  {
    fullName: "Toni Kroos",
    displayName: "Kroos",
    position: "CM",
    team: "Real Madrid",
    nationality: "Germany",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 1 Goal",
  },
  {
    fullName: "Sebastián Cáceres",
    displayName: "Cáceres",
    position: "CB",
    team: "Club América",
    nationality: "Uruguay",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Nicolás Otamendi",
    displayName: "Otamendi",
    position: "CB",
    team: "SL Benfica",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Club debut",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "FC Barcelona",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Cody Gakpo",
    displayName: "Gakpo",
    position: "LW",
    team: "Liverpool",
    nationality: "Netherlands",
    matchRating: 6.0,
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
    matchRating: 5.5,
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
  {
    fullName: "Granit Xhaka",
    displayName: "Xhaka",
    position: "CM",
    team: "Bayer Leverkusen",
    nationality: "Switzerland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Club debut",
  },
  {
    fullName: "Kyle Walker",
    displayName: "Walker",
    position: "RB",
    team: "Manchester City",
    nationality: "England",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 54...");

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

  console.log("\nLogging Match 54 with 11 player performances...");

  const performances = matchPlayers.map((p) => ({
    playerId: playerIds[p.fullName]!,
    appearanceStatus: p.status,
    minutesPlayed: p.minutesPlayed,
    goals: p.goals,
    assists: p.assists,
    rating: p.matchRating,
    isMotm: p.isMotm,
    notes: p.notes,
  }));

  const match = await createMatch({
    date: new Date(),
    opponent: "Division Rival",
    venue: "AWAY",
    scoreHome: 2,
    scoreAway: 2,
    status: "COMPLETED",
    notes: "eFootball Away match logged from player ratings screenshot (2-2 Draw, 100th Goal Milestone!)",
    performances,
  });

  console.log(`\nMatch 54 successfully created! ID: ${match.id}`);
  console.log(`Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY DRAW)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 54:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
