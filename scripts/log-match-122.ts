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
    fullName: "Désiré Doué",
    displayName: "Doué",
    position: "RW",
    team: "PSG",
    nationality: "France",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RWF; scored 1 Goal (MOTM); played full 90 minutes",
  },
  {
    fullName: "Amad Diallo",
    displayName: "Amad",
    position: "RW",
    team: "Manchester United",
    nationality: "Ivory Coast",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at RWF; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Dominik Szoboszlai",
    displayName: "Szoboszlai",
    position: "CM",
    team: "Liverpool",
    nationality: "Hungary",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; scored 1 Goal; played full 90 minutes",
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
    notes: "Started in goal; played full 90 minutes",
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
    fullName: "Nahuel Molina",
    displayName: "Molina",
    position: "RB",
    team: "Atlético Madrid",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
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
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Weston McKennie",
    displayName: "McKennie",
    position: "CM",
    team: "Juventus",
    nationality: "United States",
    matchRating: 6.0,
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
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Neymar Jr",
    displayName: "Neymar Jr",
    position: "LW",
    team: "Santos",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; played full 90 minutes",
  },

  // 2 Substitutes (subbed on at 70')
  {
    fullName: "Bernardo Silva",
    displayName: "Bernardo Silva",
    position: "RW",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Amad Diallo at RWF",
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Mason Mount at AMF",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 122...");

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

  console.log("\nLogging Match 122 with 13 player performances...");

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
    scoreAway: 2,
    status: "COMPLETED",
    notes:
      "eFootball Match 122 logged from player ratings screenshots (3-2 Home Win, Désiré Doué 1G MOTM, Amad Diallo 1G on debut, Dominik Szoboszlai 1G, Mason Mount 1A; Subs: Bernardo Silva, Cole Palmer on at 70' for Amad Diallo, Mason Mount; Debut: Amad Diallo)",
    performances,
  });

  console.log(`\nMatch 122 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 122:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
