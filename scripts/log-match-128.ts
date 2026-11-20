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
    fullName: "Soufiane Rahimi",
    displayName: "Rahimi",
    position: "ST",
    team: "Al Ain",
    nationality: "Morocco",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal, provided 1 Assist; Man of the Match (★)",
  },
  {
    fullName: "Samuel Mbangula",
    displayName: "Mbangula",
    position: "LW",
    team: "Juventus",
    nationality: "Belgium",
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LMF/LW; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.0,
    goals: 2,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; scored 2 Goals, provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Daley Blind",
    displayName: "Blind",
    position: "CB",
    team: "Girona",
    nationality: "Netherlands",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Joey Veerman",
    displayName: "Veerman",
    position: "CM",
    team: "PSV Eindhoven",
    nationality: "Netherlands",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; provided 1 Assist; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
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
    fullName: "Renato Veiga",
    displayName: "Renato Veiga",
    position: "CB",
    team: "Juventus",
    nationality: "Portugal",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Calvin Bassey",
    displayName: "Bassey",
    position: "CB",
    team: "Fulham",
    nationality: "Nigeria",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Pedro Porro",
    displayName: "Pedro Porro",
    position: "RB",
    team: "Tottenham Hotspur",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes; clean sheet",
  },
  {
    fullName: "Olivier Kemen",
    displayName: "Kemen",
    position: "CM",
    team: "Basaksehir",
    nationality: "Cameroon",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF/CMF; played full 90 minutes; clean sheet",
  },

  // 2 Substitutes (both subbed on at 70')
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Samuel Mbangula",
  },
  {
    fullName: "Riccardo Sottil",
    displayName: "Sottil",
    position: "LW",
    team: "Fiorentina",
    nationality: "Italy",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Cole Palmer",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 128...");

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

  console.log("\nLogging Match 128 with 13 player performances...");

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
      "eFootball Match 128 logged from player ratings screenshots (0-4 Away Win & Clean Sheet, Soufiane Rahimi 1G 1A MOTM, Mason Mount 2G 1A, Samuel Mbangula 1G, Joey Veerman 1A; Subs: Neymar Jr, Riccardo Sottil on at 70' for Samuel Mbangula, Cole Palmer)",
    performances,
  });

  console.log(`\nMatch 128 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN & CLEAN SHEET)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 128:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
