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
    matchRating: 8.5,
    goals: 3,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored Hat-trick (3 Goals) (MOTM); played full 90 minutes",
  },
  {
    fullName: "Diogo Jota",
    displayName: "Jota",
    position: "ST",
    team: "Liverpool",
    nationality: "Portugal",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Bernardo Silva",
    displayName: "Bernardo Silva",
    position: "RW",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RWF; provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; played full 90 minutes",
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
    notes: "Started at CMF/DMF; played full 90 minutes",
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
    fullName: "Trent Alexander-Arnold",
    displayName: "Alexander-Arnold",
    position: "RB",
    team: "Liverpool",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Alisson Becker",
    displayName: "Alisson",
    position: "GK",
    team: "Liverpool",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in goal; played full 90 minutes",
  },
  {
    fullName: "Noussair Mazraoui",
    displayName: "Mazraoui",
    position: "LB",
    team: "Manchester United",
    nationality: "Morocco",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },

  // 1 Substitute
  {
    fullName: "Bukayo Saka",
    displayName: "Saka",
    position: "RW",
    team: "Arsenal",
    nationality: "England",
    matchRating: 7.0,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Diogo Jota; scored 1 Goal and provided 1 Assist",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 117...");

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

  console.log("\nLogging Match 117 with 12 player performances...");

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
    scoreHome: 4,
    scoreAway: 1,
    status: "COMPLETED",
    notes:
      "eFootball Match 117 logged from user notes (4-1 Home Win, Sergio Agüero 3G Hat-trick MOTM, Bukayo Saka 1G 1A off bench, Diogo Jota 1A, Bernardo Silva 1A; Sub: Saka on at 70' for Jota)",
    performances,
  });

  console.log(`\nMatch 117 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 117:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
