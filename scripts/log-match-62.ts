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
    fullName: "Sho Inagaki",
    displayName: "Inagaki",
    position: "CM",
    team: "Nagoya Grampus",
    nationality: "Japan",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal (1st club goal!)",
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
    fullName: "Gabriel Batistuta",
    displayName: "Batistuta",
    position: "ST",
    team: "Fiorentina",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
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
    fullName: "Granit Xhaka",
    displayName: "Xhaka",
    position: "CM",
    team: "Bayer Leverkusen",
    nationality: "Switzerland",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
  },
  {
    fullName: "Julian Brandt",
    displayName: "Brandt",
    position: "CAM",
    team: "Borussia Dortmund",
    nationality: "Germany",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Club debut, Subbed off at HT",
  },
  {
    fullName: "Diego Maradona",
    displayName: "Maradona",
    position: "CAM",
    team: "FC Barcelona",
    nationality: "Argentina",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 45,
    notes: "Subbed off at HT",
  },
  // 3 Substitutes Used
  {
    fullName: "Thomas Müller",
    displayName: "Müller",
    position: "CAM",
    team: "FC Bayern München",
    nationality: "Germany",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 45,
    notes: "Subbed on at HT",
  },
];

async function main() {
  console.log("Checking/creating players in Panenka for Match 62...");

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

  console.log("\nLogging Match 62 with 14 player performances...");

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
    scoreAway: 1,
    status: "COMPLETED",
    notes: "eFootball Away match logged from player ratings screenshot (4-1 Loss)",
    performances,
  });

  console.log(`\nMatch 62 successfully created! ID: ${match.id}`);
  console.log(`Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY LOSS)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 62:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
