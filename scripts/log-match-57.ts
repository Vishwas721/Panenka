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
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 2 Goals (MOTM)",
  },
  {
    fullName: "Vitinha",
    displayName: "Vitinha",
    position: "CM",
    team: "Paris Saint-Germain",
    nationality: "Portugal",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "FC Barcelona",
    nationality: "Argentina",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal",
  },
  {
    fullName: "Alexis Saelemaekers",
    displayName: "Saelemaekers",
    position: "RW",
    team: "AS Roma",
    nationality: "Belgium",
    matchRating: 7.0,
    goals: 0,
    assists: 2,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 2 Goals on debut",
  },
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 1 Goal",
  },
  {
    fullName: "Rui Silva",
    displayName: "Rui Silva",
    position: "GK",
    team: "Real Betis",
    nationality: "Portugal",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Club debut",
  },
  {
    fullName: "Matthijs de Ligt",
    displayName: "de Ligt",
    position: "CB",
    team: "Manchester United",
    nationality: "Netherlands",
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
    matchRating: 6.0,
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
    minutesPlayed: 45,
    notes: "Subbed off at HT",
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
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  // 2 Substitutes Used
  {
    fullName: "Dani Olmo",
    displayName: "Dani Olmo",
    position: "CAM",
    team: "FC Barcelona",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
  {
    fullName: "Daley Blind",
    displayName: "Blind",
    position: "CB",
    team: "Girona FC",
    nationality: "Netherlands",
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
  console.log("Checking/creating players in Panenka for Match 57...");

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

  console.log("\nLogging Match 57 with 13 player performances...");

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
    notes: "eFootball Away match logged from player ratings screenshot (1-4 Away Win, 200th Goal Contribution Milestone!)",
    performances,
  });

  console.log(`\nMatch 57 successfully created! ID: ${match.id}`);
  console.log(`Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY WIN)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 57:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
