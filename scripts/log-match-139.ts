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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at GK; played full 90 minutes",
  },
  {
    fullName: "Alejandro Grimaldo",
    displayName: "Grimaldo",
    position: "LB",
    team: "Bayer Leverkusen",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },
  {
    fullName: "Pablo Ortíz",
    displayName: "Ortíz",
    position: "CB",
    team: "Pachuca",
    nationality: "Colombia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at CB; played full 90 minutes",
  },
  {
    fullName: "Antonio Rüdiger",
    displayName: "Rüdiger",
    position: "CB",
    team: "Real Madrid",
    nationality: "Germany",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Vanderson",
    displayName: "Vanderson",
    position: "RB",
    team: "Monaco",
    nationality: "Brazil",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "N'Golo Kanté",
    displayName: "Kanté",
    position: "CDM",
    team: "Al-Ittihad",
    nationality: "France",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF; provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Dominik Szoboszlai",
    displayName: "Szoboszlai",
    position: "CM",
    team: "Liverpool",
    nationality: "Hungary",
    matchRating: 4.5,
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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Dimitri Payet",
    displayName: "Payet",
    position: "CAM",
    team: "Vasco da Gama",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Julián Alvarez",
    displayName: "Alvarez",
    position: "ST",
    team: "Atlético Madrid",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at CF; subbed off at 70'",
  },
  {
    fullName: "Marco van Basten",
    displayName: "Van Basten",
    position: "ST",
    team: "AC Milan",
    nationality: "Netherlands",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 2 Goals (Brace); MOTM; played full 90 minutes",
  },

  // 3 Substitutes (all on at 70')
  {
    fullName: "Ferreira",
    displayName: "Ferreira",
    position: "LW",
    team: "São Paulo",
    nationality: "Brazil",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Julián Alvarez; provided 1 Assist",
  },
  {
    fullName: "Pedro",
    displayName: "Pedro",
    position: "CAM",
    team: "Lazio",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Dimitri Payet",
  },
  {
    fullName: "Jacob Murphy",
    displayName: "Murphy",
    position: "RW",
    team: "Newcastle United",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Martin Ødegaard",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 139...");

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

  console.log("\nLogging Match 139 with 14 player performances...");

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
    notes:
      "eFootball Match 139 logged from player ratings screenshots (2-2 Away Draw, Marco van Basten 2G MOTM, N'Golo Kanté 1A, Ferreira 1A off bench; Subs: Ferreira, Pedro, Jacob Murphy on at 70' for Julián Alvarez, Dimitri Payet, Martin Ødegaard; Debuts: Pablo Ortíz, Julián Alvarez)",
    performances,
  });

  console.log(`\nMatch 139 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 139:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
