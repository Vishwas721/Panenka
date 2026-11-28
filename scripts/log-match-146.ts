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
    fullName: "Sergio Ramos",
    displayName: "Ramos",
    position: "CB",
    team: "Sevilla",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Kim Min-Jae",
    displayName: "Kim Min-Jae",
    position: "CB",
    team: "Bayern Munich",
    nationality: "South Korea",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Nuno Santos",
    displayName: "Nuno Santos",
    position: "LB",
    team: "Sporting CP",
    nationality: "Portugal",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },
  {
    fullName: "Kerem Demirbay",
    displayName: "Demirbay",
    position: "CDM",
    team: "Galatasaray",
    nationality: "Turkey",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF; played full 90 minutes",
  },
  {
    fullName: "Serge Gnabry",
    displayName: "Gnabry",
    position: "RW",
    team: "Bayern Munich",
    nationality: "Germany",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LMF; subbed off at 70'",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "Barcelona",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at SS; played full 90 minutes",
  },
  {
    fullName: "Luis Díaz",
    displayName: "Luis Díaz",
    position: "LW",
    team: "Liverpool",
    nationality: "Colombia",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in attack; provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Fiorentina",
    nationality: "Argentina",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal; played full 90 minutes",
  },
  {
    fullName: "Diego Forlán",
    displayName: "Forlán",
    position: "ST",
    team: "Atlético Madrid",
    nationality: "Uruguay",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; subbed off at 70'",
  },

  // 2 Substitutes (both on at 70')
  {
    fullName: "David Neres",
    displayName: "Neres",
    position: "RW",
    team: "Napoli",
    nationality: "Brazil",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Serge Gnabry",
  },
  {
    fullName: "William Gomes",
    displayName: "William Gomes",
    position: "CAM",
    team: "São Paulo",
    nationality: "Brazil",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Diego Forlán",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 146...");

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

  console.log("\nLogging Match 146 with 13 player performances...");

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
    scoreHome: 5,
    scoreAway: 1,
    status: "COMPLETED",
    notes:
      "eFootball Match 146 logged from player ratings screenshots (5-1 Away Loss, Gabriel Batistuta 1G, Luis Díaz 1A; Opponent MOTM; Subs: David Neres, William Gomes on at 70' for Serge Gnabry, Diego Forlán)",
    performances,
  });

  console.log(`\nMatch 146 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 146:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
