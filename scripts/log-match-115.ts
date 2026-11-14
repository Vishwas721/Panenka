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
    fullName: "Omar Marmoush",
    displayName: "Marmoush",
    position: "ST",
    team: "Eintracht Frankfurt",
    nationality: "Egypt",
    matchRating: 7.5,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal (MOTM); played full 90 minutes",
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Matthijs de Ligt",
    displayName: "de Ligt",
    position: "CB",
    team: "Manchester United",
    nationality: "Netherlands",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Eric Cantona",
    displayName: "Cantona",
    position: "ST",
    team: "Manchester United",
    nationality: "France",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; played full 90 minutes",
  },
  {
    fullName: "Alisson Becker",
    displayName: "Alisson",
    position: "GK",
    team: "Liverpool",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started in goal; played full 90 minutes",
  },
  {
    fullName: "Gabriel Magalhães",
    displayName: "Gabriel",
    position: "CB",
    team: "Arsenal",
    nationality: "Brazil",
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
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Alexis Mac Allister",
    displayName: "Mac Allister",
    position: "CM",
    team: "Liverpool",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
  },
  {
    fullName: "Bukayo Saka",
    displayName: "Saka",
    position: "RW",
    team: "Arsenal",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RMF; subbed off at 70'",
  },
  {
    fullName: "Kevin De Bruyne",
    displayName: "De Bruyne",
    position: "CAM",
    team: "Manchester City",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Noussair Mazraoui",
    displayName: "Mazraoui",
    position: "LB",
    team: "Manchester United",
    nationality: "Morocco",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },

  // 3 Substitutes (all subbed on at 70')
  {
    fullName: "Florian Wirtz",
    displayName: "Wirtz",
    position: "CAM",
    team: "Bayer Leverkusen",
    nationality: "Germany",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' at LMF",
  },
  {
    fullName: "Kai Havertz",
    displayName: "Havertz",
    position: "ST",
    team: "Arsenal",
    nationality: "Germany",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' at CF",
  },
  {
    fullName: "Bernardo Silva",
    displayName: "Bernardo Silva",
    position: "RW",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' at RWF",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 115...");

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

  console.log("\nLogging Match 115 with 14 player performances...");

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
    scoreHome: 1,
    scoreAway: 1,
    status: "COMPLETED",
    notes:
      "eFootball Match 115 logged from player ratings screenshots (1-1 Home Draw, Omar Marmoush 1G MOTM, Wayne Rooney 1A; Subs: Florian Wirtz, Kai Havertz, Bernardo Silva on at 70' for Wayne Rooney, Bukayo Saka, Kevin De Bruyne; 2 Debuts: Alisson Becker, Florian Wirtz)",
    performances,
  });

  console.log(`\nMatch 115 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 115:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
