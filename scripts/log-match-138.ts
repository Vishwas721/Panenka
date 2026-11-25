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
    fullName: "Gerónimo Rulli",
    displayName: "Rulli",
    position: "GK",
    team: "Marseille",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at GK; played full 90 minutes",
  },
  {
    fullName: "Nathan Tjoe-A-On",
    displayName: "Tjoe-A-On",
    position: "LB",
    team: "Swansea City",
    nationality: "Indonesia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB/CB; played full 90 minutes",
  },
  {
    fullName: "Dean Huijsen",
    displayName: "Huijsen",
    position: "CB",
    team: "Bournemouth",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Eren Elmalı",
    displayName: "Elmalı",
    position: "LB",
    team: "Trabzonspor",
    nationality: "Turkey",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LB; subbed off at 70'",
  },
  {
    fullName: "Trent Alexander-Arnold",
    displayName: "Alexander-Arnold",
    position: "RB",
    team: "Liverpool",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Vitinha",
    displayName: "Vitinha",
    position: "CM",
    team: "Paris Saint-Germain",
    nationality: "Portugal",
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; scored 1 Goal; played full 90 minutes",
  },
  {
    fullName: "Dominik Szoboszlai",
    displayName: "Szoboszlai",
    position: "CM",
    team: "Liverpool",
    nationality: "Hungary",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
  },
  {
    fullName: "Martin Ødegaard",
    displayName: "Ødegaard",
    position: "CAM",
    team: "Arsenal",
    nationality: "Norway",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; played full 90 minutes",
  },
  {
    fullName: "Dimitri Payet",
    displayName: "Payet",
    position: "CAM",
    team: "Vasco da Gama",
    nationality: "France",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Jacob Murphy",
    displayName: "Murphy",
    position: "RW",
    team: "Newcastle United",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at RWF; subbed off at 70'",
  },
  {
    fullName: "Marco van Basten",
    displayName: "Van Basten",
    position: "ST",
    team: "AC Milan",
    nationality: "Netherlands",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal & provided 1 Assist; MOTM; played full 90 minutes",
  },

  // 3 Substitutes (all on at 70')
  {
    fullName: "Pedro",
    displayName: "Pedro",
    position: "CAM",
    team: "Lazio",
    nationality: "Spain",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Dimitri Payet; provided 1 Assist",
  },
  {
    fullName: "Ferreira",
    displayName: "Ferreira",
    position: "LW",
    team: "São Paulo",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Eren Elmalı",
  },
  {
    fullName: "Ademola Lookman",
    displayName: "Lookman",
    position: "CAM",
    team: "Atalanta",
    nationality: "Nigeria",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Jacob Murphy",
  },
];

async function main() {
  console.log("Checking for previous Match 138 record to update...");

  // Remove previous match 138 if already created
  const existingMatches = await prisma.match.findMany({
    where: {
      notes: { contains: "Match 138" },
    },
    include: { performances: true },
  });

  for (const m of existingMatches) {
    console.log(`Deleting previous Match 138 instance: ${m.id}`);
    await prisma.match.delete({
      where: { id: m.id },
    });
  }

  console.log("Checking/verifying players in Panenka for Match 138...");

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

  console.log("\nLogging Match 138 with 14 player performances...");

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
    venue: "HOME",
    scoreHome: 3,
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 138 logged from player ratings screenshots (3-3 Home Draw, Vitinha 1G, Marco van Basten 1G 1A MOTM, Dimitri Payet 1G, Pedro 1A off bench; Subs: Pedro, Ferreira, Ademola Lookman on at 70' for Dimitri Payet, Eren Elmalı, Jacob Murphy; Debut: Jacob Murphy)",
    performances,
  });

  console.log(`\nMatch 138 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 138:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
