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
    assists: 1,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 2 Goals, 1 Assist, MOTM (50th Club Goal Contribution Milestone: 38G + 12A!)",
  },
  {
    fullName: "Barış Alper Yılmaz",
    displayName: "Yılmaz",
    position: "RW",
    team: "Galatasaray",
    nationality: "Turkey",
    matchRating: 7.0,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Scored 1 Goal, 1 Assist (2nd club goal, 3rd assist); subbed off at 70'",
  },
  {
    fullName: "Sho Inagaki",
    displayName: "Inagaki",
    position: "CM",
    team: "Nagoya Grampus",
    nationality: "Japan",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Solid 90-minute central midfield display",
  },
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "AM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Assisted 1 Goal (10th Club Assist Milestone!)",
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
    notes: "Clean sheet victory (3-0 Home Win)",
  },
  {
    fullName: "Nicolás Otamendi",
    displayName: "Otamendi",
    position: "CB",
    team: "Benfica",
    nationality: "Argentina",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Clean sheet performance at center-back",
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
    notes: "Clean sheet performance at left-back",
  },
  {
    fullName: "Hwang In-Beom",
    displayName: "Hwang",
    position: "CM",
    team: "Feyenoord",
    nationality: "South Korea",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Solid shift in midfield",
  },
  {
    fullName: "Granit Xhaka",
    displayName: "Xhaka",
    position: "CM",
    team: "Bayer Leverkusen",
    nationality: "Switzerland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Controlled central midfield",
  },
  {
    fullName: "Daley Blind",
    displayName: "Blind",
    position: "CB",
    team: "Girona",
    nationality: "Netherlands",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Clean sheet performance in defense",
  },
  {
    fullName: "Dani Carvajal",
    displayName: "Carvajal",
    position: "RB",
    team: "Real Madrid",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Clean sheet at right-back",
  },

  // 1 Substitute
  {
    fullName: "Cody Gakpo",
    displayName: "Gakpo",
    position: "LW",
    team: "Liverpool",
    nationality: "Netherlands",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Barış Alper Yılmaz",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 78...");

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

  console.log("\nLogging Match 78 with 12 player performances...");

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
    scoreHome: 3,
    scoreAway: 0,
    status: "COMPLETED",
    notes: "eFootball Home match logged from player ratings screenshots (3-0 Home Win, Clean Sheet, Batistuta 2G 1A MOTM, Yılmaz 1G 1A, Mbappé 1A, 300 Goal Contributions Milestone reached)",
    performances,
  });

  console.log(`\nMatch 78 successfully created! ID: ${match.id}`);
  console.log(`Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN, CLEAN SHEET)`);
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 78:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
