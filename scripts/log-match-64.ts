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
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Fiorentina",
    nationality: "Argentina",
    matchRating: 8.5,
    goals: 3,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 3 Goals (Back-to-Back Hat-Tricks, MOTM)",
  },
  {
    fullName: "Cody Gakpo",
    displayName: "Gakpo",
    position: "LW",
    team: "Liverpool",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 0,
    assists: 2,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 2 Goals",
  },
  {
    fullName: "Julian Brandt",
    displayName: "Brandt",
    position: "CAM",
    team: "Borussia Dortmund",
    nationality: "Germany",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 1 Goal",
  },
  {
    fullName: "David Raya",
    displayName: "Raya",
    position: "GK",
    team: "Arsenal",
    nationality: "Spain",
    matchRating: 6.0,
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
    fullName: "Manuel Akanji",
    displayName: "Akanji",
    position: "CB",
    team: "Manchester City",
    nationality: "Switzerland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Matthijs de Ligt",
    displayName: "de Ligt",
    position: "CB",
    team: "Manchester United",
    nationality: "Netherlands",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Ronald Araújo",
    displayName: "Araújo",
    position: "CB",
    team: "FC Barcelona",
    nationality: "Uruguay",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "FC Barcelona",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  {
    fullName: "Alexis Saelemaekers",
    displayName: "Saelemaekers",
    position: "RW",
    team: "AS Roma",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  // 3 Substitutes Used
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
  {
    fullName: "Henrikh Mkhitaryan",
    displayName: "Mkhitaryan",
    position: "CM",
    team: "Inter Milan",
    nationality: "Armenia",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
  {
    fullName: "Barış Alper Yılmaz",
    displayName: "Yılmaz",
    position: "RW",
    team: "Galatasaray",
    nationality: "Turkey",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 64...");

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

  console.log("\nLogging Match 64 with 14 player performances...");

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
    notes: "eFootball Away match logged from player ratings screenshot (2-3 Away Win, Batistuta Back-to-Back Hat-Tricks!)",
    performances,
  });

  console.log(`\nMatch 64 successfully created! ID: ${match.id}`);
  console.log(`Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 64:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
