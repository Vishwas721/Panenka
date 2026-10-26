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
  // 11 Starters
  {
    fullName: "Andriy Shevchenko",
    displayName: "Shevchenko",
    position: "ST",
    team: "AC Milan",
    nationality: "Ukraine",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 2 Goals (MOTM)",
  },
  {
    fullName: "Rodri",
    displayName: "Rodri",
    position: "CDM",
    team: "Manchester City",
    nationality: "Spain",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 1 Goal",
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
    notes: "Assisted 1 Goal",
  },
  {
    fullName: "Giorgi Mamardashvili",
    displayName: "Mamardashvili",
    position: "GK",
    team: "Valencia",
    nationality: "Georgia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Matteo Darmian",
    displayName: "Darmian",
    position: "RB",
    team: "Inter Milan",
    nationality: "Italy",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Luis Henrique",
    displayName: "Luis Henrique",
    position: "RB",
    team: "Inter Milan",
    nationality: "Brazil",
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
    matchRating: 5.5,
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
    matchRating: 5.5,
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
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  {
    fullName: "Julio Enciso",
    displayName: "Enciso",
    position: "ST",
    team: "Brighton",
    nationality: "Paraguay",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  {
    fullName: "Casemiro",
    displayName: "Casemiro",
    position: "CDM",
    team: "Manchester United",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  // 3 Substitutes Used
  {
    fullName: "Darwin Núñez",
    displayName: "Núñez",
    position: "ST",
    team: "Liverpool",
    nationality: "Uruguay",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Club debut, Subbed on at HT",
  },
  {
    fullName: "Ángel Di María",
    displayName: "Di María",
    position: "RW",
    team: "SL Benfica",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
  {
    fullName: "Brian Rodríguez",
    displayName: "B. Rodríguez",
    position: "LW",
    team: "Club América",
    nationality: "Uruguay",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 50...");

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

  console.log("\nLogging Match 50 with 14 player performances...");

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
    scoreHome: 1,
    scoreAway: 2,
    status: "COMPLETED",
    notes: "eFootball Away match logged from player ratings screenshot (1-2 Away Win, Milestone 50th Match)",
    performances,
  });

  console.log(`\nMatch 50 successfully created! ID: ${match.id}`);
  console.log(`Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 50:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
