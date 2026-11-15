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
    fullName: "Sergio Agüero",
    displayName: "Agüero",
    position: "ST",
    team: "Manchester City",
    nationality: "Argentina",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 80,
    notes: "Started at CF; scored 2 Goals (MOTM); subbed off at 80'",
  },
  {
    fullName: "Bart Verbruggen",
    displayName: "Verbruggen",
    position: "GK",
    team: "Brighton & Hove Albion",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in goal; played full 90 minutes",
  },
  {
    fullName: "Diogo Jota",
    displayName: "Jota",
    position: "ST",
    team: "Liverpool",
    nationality: "Portugal",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal; played full 90 minutes",
  },
  {
    fullName: "Eric Cantona",
    displayName: "Cantona",
    position: "ST",
    team: "Manchester United",
    nationality: "France",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; provided 1 Assist; played full 90 minutes",
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
    fullName: "Declan Rice",
    displayName: "Rice",
    position: "CDM",
    team: "Arsenal",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
  },
  {
    fullName: "Cristian Romero",
    displayName: "Romero",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Tony Adams",
    displayName: "Adams",
    position: "CB",
    team: "Arsenal",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Joško Gvardiol",
    displayName: "Gvardiol",
    position: "CB",
    team: "Manchester City",
    nationality: "Croatia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CB/LB; subbed off at 70'",
  },
  {
    fullName: "Kevin De Bruyne",
    displayName: "De Bruyne",
    position: "CAM",
    team: "Manchester City",
    nationality: "Belgium",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; played full 90 minutes",
  },

  // 3 Substitutes
  {
    fullName: "Bukayo Saka",
    displayName: "Saka",
    position: "RW",
    team: "Arsenal",
    nationality: "England",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Diogo Jota; provided 1 Assist",
  },
  {
    fullName: "Noussair Mazraoui",
    displayName: "Mazraoui",
    position: "LB",
    team: "Manchester United",
    nationality: "Morocco",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Joško Gvardiol at LB",
  },
  {
    fullName: "Didier Drogba",
    displayName: "Drogba",
    position: "ST",
    team: "Chelsea",
    nationality: "Ivory Coast",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 10,
    notes: "Subbed on at 80' for Sergio Agüero; scored 1 Goal",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 121...");

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

  console.log("\nLogging Match 121 with 14 player performances...");

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
    scoreHome: 1,
    scoreAway: 4,
    status: "COMPLETED",
    notes:
      "eFootball Match 121 logged from player ratings screenshots (1-4 Away Win, Sergio Agüero 2G MOTM, Wayne Rooney 1G, Didier Drogba 1G off bench; Diogo Jota 1A, Eric Cantona 1A, Bukayo Saka 1A off bench; Subs: Saka, Mazraoui on at 70' for Jota, Gvardiol; Drogba on at 80' for Agüero)",
    performances,
  });

  console.log(`\nMatch 121 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 121:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
