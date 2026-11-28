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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at GK; played full 90 minutes",
  },
  {
    fullName: "Arnau Martínez",
    displayName: "Arnau Martínez",
    position: "RB",
    team: "Girona",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Lewis Dunk",
    displayName: "Dunk",
    position: "CB",
    team: "Brighton & Hove Albion",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at CB; played full 90 minutes",
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
    notes: "Started in defense; played full 90 minutes",
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
    notes: "Started at LB; played full 90 minutes",
  },
  {
    fullName: "Manuel Locatelli",
    displayName: "Locatelli",
    position: "CDM",
    team: "Juventus",
    nationality: "Italy",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF; played full 90 minutes",
  },
  {
    fullName: "Pablo Fornals",
    displayName: "Fornals",
    position: "CAM",
    team: "Real Betis",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; played full 90 minutes",
  },
  {
    fullName: "David Neres",
    displayName: "Neres",
    position: "RW",
    team: "Napoli",
    nationality: "Brazil",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RWF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Luis Díaz",
    displayName: "Luis Díaz",
    position: "LW",
    team: "Liverpool",
    nationality: "Colombia",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in attack; scored 2 Goals (Brace); MOTM; played full 90 minutes",
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
    minutesPlayed: 90,
    notes: "Started at CF; provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Fiorentina",
    nationality: "Argentina",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal; played full 90 minutes",
  },

  // 1 Substitute (on at 70')
  {
    fullName: "Sadio Mané",
    displayName: "Mané",
    position: "LW",
    team: "Al-Nassr",
    nationality: "Senegal",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for David Neres",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 143...");

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

  console.log("\nLogging Match 143 with 12 player performances...");

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
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 143 logged from player ratings screenshots (1-3 Away Win, Luis Díaz 2G MOTM, Gabriel Batistuta 1G, David Neres 1A, Diego Forlán 1A; Sub: Sadio Mané on at 70' for David Neres; Debuts: Lewis Dunk, Sadio Mané)",
    performances,
  });

  console.log(`\nMatch 143 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 143:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
