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
    fullName: "Neymar Jr",
    displayName: "Neymar Jr",
    position: "LW",
    team: "Santos",
    nationality: "Brazil",
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal; Man of the Match (★)",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Samuel Mbangula",
    displayName: "Mbangula",
    position: "LW",
    team: "Juventus",
    nationality: "Belgium",
    matchRating: 7.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LMF/LW; provided 1 Assist; subbed off at 70'",
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
    notes: "Started at CB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Antonee Robinson",
    displayName: "Robinson",
    position: "LB",
    team: "Fulham",
    nationality: "United States",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Denis Zakaria",
    displayName: "Zakaria",
    position: "CDM",
    team: "Monaco",
    nationality: "Switzerland",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes; clean sheet",
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
    notes: "Started in goal; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Andreas Christensen",
    displayName: "Christensen",
    position: "CB",
    team: "Barcelona",
    nationality: "Denmark",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Nakano Shuto",
    displayName: "Shuto",
    position: "RB",
    team: "Sanfrecce Hiroshima",
    nationality: "Japan",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at RB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Magnus Mattsson",
    displayName: "Mattsson",
    position: "CAM",
    team: "FC Copenhagen",
    nationality: "Denmark",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at AMF; subbed off at 70'",
  },
  {
    fullName: "Jhon Jhon",
    displayName: "Jhon Jhon",
    position: "CAM",
    team: "Red Bull Bragantino",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at AMF; played full 90 minutes",
  },

  // 3 Substitutes (all on at 70')
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Samuel Mbangula",
  },
  {
    fullName: "Amad Diallo",
    displayName: "Amad",
    position: "RW",
    team: "Manchester United",
    nationality: "Ivory Coast",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Cole Palmer",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Magnus Mattsson",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 126...");

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

  console.log("\nLogging Match 126 with 14 player performances...");

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
    scoreAway: 2,
    status: "COMPLETED",
    notes:
      "eFootball Match 126 logged from player ratings screenshots (0-2 Away Win & Clean Sheet, Neymar Jr 1G MOTM, Cole Palmer 1G, Samuel Mbangula 1A; Subs: Soufiane Rahimi, Amad Diallo, Mason Mount on at 70' for Samuel Mbangula, Cole Palmer, Magnus Mattsson; 3 Debuts: Nakano Shuto, Magnus Mattsson, Jhon Jhon)",
    performances,
  });

  console.log(`\nMatch 126 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN & CLEAN SHEET)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 126:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
