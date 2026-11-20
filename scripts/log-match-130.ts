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
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 2 Goals; Man of the Match (★); played full 90 minutes",
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
    minutesPlayed: 90,
    notes: "Started at AMF; provided 1 Assist; played full 90 minutes",
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
    notes: "Started at CB; played full 90 minutes",
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
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Antonee Robinson",
    displayName: "Robinson",
    position: "LB",
    team: "Fulham",
    nationality: "United States",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
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
    minutesPlayed: 70,
    notes: "Started at CMF; subbed off at 70'",
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
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LMF/LW; subbed off at 70'",
  },
  {
    fullName: "Denis Zakaria",
    displayName: "Zakaria",
    position: "CDM",
    team: "Monaco",
    nationality: "Switzerland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
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
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
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
    notes: "Subbed on at 70' for Riccardo Sottil",
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
    fullName: "Olivier Kemen",
    displayName: "Kemen",
    position: "CM",
    team: "Basaksehir",
    nationality: "Cameroon",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Joey Veerman",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 130...");

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

  console.log("\nLogging Match 130 with 14 player performances...");

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
    scoreAway: 1,
    status: "COMPLETED",
    notes:
      "eFootball Match 130 logged from player ratings screenshots (3-1 Home Win, Neymar Jr 2G MOTM, Mason Mount 1A + 1 Opponent Own Goal; Subs: Soufiane Rahimi, Amad Diallo, Olivier Kemen on at 70' for Riccardo Sottil, Cole Palmer, Joey Veerman)",
    performances,
  });

  console.log(`\nMatch 130 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 130:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
