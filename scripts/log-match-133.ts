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
    fullName: "Daley Blind",
    displayName: "Blind",
    position: "CB",
    team: "Girona",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Denis Zakaria",
    displayName: "Zakaria",
    position: "CDM",
    team: "Monaco",
    nationality: "Switzerland",
    matchRating: 7.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
  },
  {
    fullName: "Renato Veiga",
    displayName: "Renato Veiga",
    position: "CB",
    team: "Juventus",
    nationality: "Portugal",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Joey Veerman",
    displayName: "Veerman",
    position: "CM",
    team: "PSV Eindhoven",
    nationality: "Netherlands",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
  },
  {
    fullName: "Soufiane Rahimi",
    displayName: "Rahimi",
    position: "ST",
    team: "Al Ain",
    nationality: "Morocco",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; played full 90 minutes",
  },
  {
    fullName: "Neymar Jr",
    displayName: "Neymar Jr",
    position: "LW",
    team: "Santos",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; played full 90 minutes",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 80,
    notes: "Started at AMF; subbed off at 80'",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 80,
    notes: "Started at AMF; subbed off at 80'",
  },
  {
    fullName: "Giorgi Mamardashvili",
    displayName: "Mamardashvili",
    position: "GK",
    team: "Valencia",
    nationality: "Georgia",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in goal; played full 90 minutes",
  },
  {
    fullName: "Pedro Porro",
    displayName: "Pedro Porro",
    position: "RB",
    team: "Tottenham Hotspur",
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
    fullName: "Calvin Bassey",
    displayName: "Bassey",
    position: "CB",
    team: "Fulham",
    nationality: "Nigeria",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },

  // 2 Substitutes (both on at 80')
  {
    fullName: "Olivier Kemen",
    displayName: "Kemen",
    position: "CM",
    team: "Basaksehir",
    nationality: "Cameroon",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 10,
    notes: "Subbed on at 80' for Mason Mount; scored 1 Goal",
  },
  {
    fullName: "Amad Diallo",
    displayName: "Amad",
    position: "RW",
    team: "Manchester United",
    nationality: "Ivory Coast",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 10,
    notes: "Subbed on at 80' for Cole Palmer; provided 1 Assist",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 133...");

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

  console.log("\nLogging Match 133 with 13 player performances...");

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
    scoreHome: 1,
    scoreAway: 1,
    status: "COMPLETED",
    notes:
      "eFootball Match 133 logged from player ratings screenshots (1-1 Home Draw, Olivier Kemen 1G off bench, Amad Diallo 1A off bench; Opponent MOTM; Subs: Amad Diallo, Olivier Kemen on at 80' for Cole Palmer, Mason Mount)",
    performances,
  });

  console.log(`\nMatch 133 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 133:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
