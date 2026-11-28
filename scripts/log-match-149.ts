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
    fullName: "Anatolii Trubin",
    displayName: "Trubin",
    position: "GK",
    team: "SL Benfica",
    nationality: "Ukraine",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at GK; played full 90 minutes",
  },
  {
    fullName: "Javier Zanetti",
    displayName: "Zanetti",
    position: "RB",
    team: "Inter Milan",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB/RB; played full 90 minutes",
  },
  {
    fullName: "Rúben Dias",
    displayName: "Dias",
    position: "CB",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Dayot Upamecano",
    displayName: "Upamecano",
    position: "CB",
    team: "FC Bayern München",
    nationality: "France",
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
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },
  {
    fullName: "Franck Ribéry",
    displayName: "Ribéry",
    position: "CAM",
    team: "Fiorentina",
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
    fullName: "Scott McTominay",
    displayName: "McTominay",
    position: "ST",
    team: "Manchester United",
    nationality: "Scotland",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; subbed off at 70'",
  },
  {
    fullName: "Vinícius Júnior",
    displayName: "Vinícius Jr.",
    position: "LW",
    team: "Real Madrid",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF/LW; subbed off at 70'",
  },
  {
    fullName: "Francisco Conceição",
    displayName: "Conceição",
    position: "RW",
    team: "Juventus",
    nationality: "Portugal",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka Debut; started at RWF; scored 2 Goals (G 2); Man of the Match (MOTM); played full 90 minutes",
  },
  {
    fullName: "Soufiane Rahimi",
    displayName: "Rahimi",
    position: "LW",
    team: "Al-Ain",
    nationality: "Morocco",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal and provided 1 Assist (G 1 A 1); played full 90 minutes",
  },
  {
    fullName: "Kai Havertz",
    displayName: "Havertz",
    position: "LW",
    team: "Arsenal",
    nationality: "Germany",
    matchRating: 6.5,
    goals: 0,
    assists: 2,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; provided 2 Assists (A 2); played full 90 minutes",
  },

  // 3 Substitutes (all on at 70')
  {
    fullName: "Lautaro Martínez",
    displayName: "Lautaro Martínez",
    position: "ST",
    team: "Inter Milan",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Scott McTominay",
  },
  {
    fullName: "Dimitri Payet",
    displayName: "Payet",
    position: "CAM",
    team: "Vasco da Gama",
    nationality: "France",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Franck Ribéry",
  },
  {
    fullName: "Sávio",
    displayName: "Sávio",
    position: "RW",
    team: "Manchester City",
    nationality: "Brazil",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka Debut; subbed on at 70' for Vinícius Júnior",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 149...");

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

  console.log("\nLogging Match 149 with 14 player performances...");

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
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 149 logged from player ratings screenshots (2-3 Away Win; Francisco Conceição 2G MOTM on debut, Soufiane Rahimi 1G 1A, Kai Havertz 2A; Debuts: Francisco Conceição, Sávio; Subs: Lautaro Martínez, Dimitri Payet, Sávio on at 70' for Scott McTominay, Franck Ribéry, Vinícius Júnior)",
    performances,
  });

  console.log(`\nMatch 149 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 149:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
