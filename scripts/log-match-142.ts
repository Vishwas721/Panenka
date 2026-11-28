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
    fullName: "Jan Oblak",
    displayName: "Oblak",
    position: "GK",
    team: "Atlético Madrid",
    nationality: "Slovenia",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at GK; kept Clean Sheet; played full 90 minutes",
  },
  {
    fullName: "Arnau Martínez",
    displayName: "Arnau Martínez",
    position: "RB",
    team: "Girona",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Daley Blind",
    displayName: "Blind",
    position: "CB",
    team: "Girona",
    nationality: "Netherlands",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Gerard Martín",
    displayName: "Gerard Martín",
    position: "LB",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started in defense; played full 90 minutes",
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
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },
  {
    fullName: "Manuel Locatelli",
    displayName: "Locatelli",
    position: "CDM",
    team: "Juventus",
    nationality: "Italy",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at DMF; played full 90 minutes",
  },
  {
    fullName: "Pablo Fornals",
    displayName: "Fornals",
    position: "CAM",
    team: "Real Betis",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at AMF; played full 90 minutes",
  },
  {
    fullName: "Luis Díaz",
    displayName: "Luis Díaz",
    position: "LW",
    team: "Liverpool",
    nationality: "Colombia",
    matchRating: 6.5,
    goals: 0,
    assists: 2,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started in attack; provided 2 Assists; played full 90 minutes",
  },
  {
    fullName: "David Neres",
    displayName: "Neres",
    position: "RW",
    team: "Napoli",
    nationality: "Brazil",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at RWF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Diego Forlán",
    displayName: "Forlán",
    position: "ST",
    team: "Atlético Madrid",
    nationality: "Uruguay",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at CF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Fiorentina",
    nationality: "Argentina",
    matchRating: 8.5,
    goals: 3,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 3 Goals (Hat-trick); MOTM; played full 90 minutes",
  },

  // 2 Substitutes (both on at 70')
  {
    fullName: "Serge Gnabry",
    displayName: "Gnabry",
    position: "RW",
    team: "Bayern Munich",
    nationality: "Germany",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for David Neres; scored 1 Goal",
  },
  {
    fullName: "William Gomes",
    displayName: "William Gomes",
    position: "CAM",
    team: "São Paulo",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for Diego Forlán",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 142...");

  const playerIds: { [name: string]: string } = {};

  for (const p of matchPlayers) {
    const existing = await prisma.player.findFirst({
      where: {
        OR: [
          { fullName: { equals: p.fullName, mode: "insensitive" } },
          { displayName: { equals: p.displayName, mode: "insensitive" } },
        ],
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

  console.log("\nLogging Match 142 with 13 player performances...");

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
    scoreHome: 0,
    scoreAway: 4,
    status: "COMPLETED",
    notes:
      "eFootball Match 142 logged from player ratings screenshots (0-4 Away Win & Clean Sheet, Gabriel Batistuta 3G Hat-trick MOTM, Serge Gnabry 1G off bench, Luis Díaz 2A, Diego Forlán 1A, David Neres 1A; Subs: Serge Gnabry, William Gomes on at 70' for David Neres, Diego Forlán; Debuts: Jan Oblak, Gerard Martín, Manuel Locatelli, Pablo Fornals, Luis Díaz, David Neres, Diego Forlán, Serge Gnabry, William Gomes)",
    performances,
  });

  console.log(`\nMatch 142 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN & CLEAN SHEET)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 142:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
