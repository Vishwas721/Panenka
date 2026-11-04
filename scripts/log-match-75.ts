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
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal, Assisted 1 Goal (8th club goal, 8th assist)",
  },
  {
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Fiorentina",
    nationality: "Argentina",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal (31st club goal)",
  },
  {
    fullName: "Hwang In-Beom",
    displayName: "In-Beom",
    position: "CM",
    team: "Feyenoord",
    nationality: "South Korea",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Club Debut, Assisted 1 Goal",
  },
  {
    fullName: "Ronald Araújo",
    displayName: "Araújo",
    position: "CB",
    team: "FC Barcelona",
    nationality: "Uruguay",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Alphonso Davies",
    displayName: "Davies",
    position: "LB",
    team: "Bayern Munich",
    nationality: "Canada",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Moisés Caicedo",
    displayName: "Caicedo",
    position: "CDM",
    team: "Chelsea",
    nationality: "Ecuador",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Barış Alper Yılmaz",
    displayName: "Yılmaz",
    position: "RW",
    team: "Galatasaray",
    nationality: "Turkey",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Vanderson",
    displayName: "Vanderson",
    position: "RB",
    team: "AS Monaco",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Subbed off 70'",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "FC Barcelona",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Subbed off 70'",
  },
  {
    fullName: "David Raya",
    displayName: "Raya",
    position: "GK",
    team: "Arsenal",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Nicolás Otamendi",
    displayName: "Otamendi",
    position: "CB",
    team: "SL Benfica",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  // 2 Substitutes Used
  {
    fullName: "Thomas Müller",
    displayName: "Müller",
    position: "CAM",
    team: "Bayern Munich",
    nationality: "Germany",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on 70'",
  },
  {
    fullName: "Dani Carvajal",
    displayName: "Carvajal",
    position: "RB",
    team: "Real Madrid",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on 70'",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 75...");

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

  console.log("\nLogging Match 75 with 13 player performances...");

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
    scoreHome: 2,
    scoreAway: 4,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshots (2-4 Home Loss, 75th Match, Hwang In-Beom debut assist)",
    performances,
  });

  console.log(`\nMatch 75 successfully created! ID: ${match.id}`);
  console.log(`Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME LOSS)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 75:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
