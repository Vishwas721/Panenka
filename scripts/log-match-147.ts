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
    fullName: "Kim Min-Jae",
    displayName: "Kim Min-Jae",
    position: "CB",
    team: "Bayern München",
    nationality: "South Korea",
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
    notes: "Started in defense; played full 90 minutes",
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
    fullName: "Kerem Demirbay",
    displayName: "Demirbay",
    position: "CDM",
    team: "Galatasaray",
    nationality: "Germany",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF/CDM; played full 90 minutes",
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
    notes: "Started at RWF; provided 1 Assist (A 1); subbed off at 70'",
  },
  {
    fullName: "William Gomes",
    displayName: "William Gomes",
    position: "CAM",
    team: "São Paulo",
    nationality: "Brazil",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; provided 1 Assist (A 1); subbed off at 70'",
  },
  {
    fullName: "Luis Díaz",
    displayName: "Luis Díaz",
    position: "LW",
    team: "Liverpool",
    nationality: "Colombia",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF/LW; subbed off at 70'",
  },
  {
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Roma",
    nationality: "Argentina",
    matchRating: 7.0,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal and provided 1 Assist (G 1 A 1); played full 90 minutes",
  },
  {
    fullName: "Diego Forlán",
    displayName: "Forlán",
    position: "ST",
    team: "Atlético Madrid",
    nationality: "Uruguay",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 2 Goals (G 2); played full 90 minutes",
  },

  // 3 Substitutes (all on at 70')
  {
    fullName: "Lautaro Martínez",
    displayName: "Lautaro Martínez",
    position: "ST",
    team: "Inter Milan",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka Debut; subbed on at 70' for Luis Díaz",
  },
  {
    fullName: "Jackson Muleka",
    displayName: "Muleka",
    position: "RW",
    team: "Beşiktaş",
    nationality: "DR Congo",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka Debut; subbed on at 70' for David Neres",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "Napoli",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for William Gomes",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 147...");

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

  console.log("\nLogging Match 147 with 14 player performances...");

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
    scoreHome: 4,
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 147 logged from player ratings screenshots (4-3 Away Loss; Diego Forlán 2G, Gabriel Batistuta 1G 1A, David Neres 1A, William Gomes 1A; Opponent MOTM; Debuts: Lautaro Martínez, Jackson Muleka; Subs: Lautaro Martínez, Jackson Muleka, Diego Maradona on at 70' for Luis Díaz, David Neres, William Gomes)",
    performances,
  });

  console.log(`\nMatch 147 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 147:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
