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
    fullName: "Didier Drogba",
    displayName: "Drogba",
    position: "ST",
    team: "Chelsea",
    nationality: "Ivory Coast",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 2 Goals (MOTM); played full 90 minutes",
  },
  {
    fullName: "Kevin De Bruyne",
    displayName: "De Bruyne",
    position: "CAM",
    team: "Manchester City",
    nationality: "Belgium",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Omar Marmoush",
    displayName: "Marmoush",
    position: "ST",
    team: "Eintracht Frankfurt",
    nationality: "Egypt",
    matchRating: 7.0,
    goals: 0,
    assists: 2,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; provided 2 Assists; subbed off at 70'",
  },
  {
    fullName: "Florian Wirtz",
    displayName: "Wirtz",
    position: "CAM",
    team: "Bayer Leverkusen",
    nationality: "Germany",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LMF; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Declan Rice",
    displayName: "Rice",
    position: "CDM",
    team: "Arsenal",
    nationality: "England",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
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
    fullName: "Noussair Mazraoui",
    displayName: "Mazraoui",
    position: "LB",
    team: "Manchester United",
    nationality: "Morocco",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
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
    fullName: "Bernardo Silva",
    displayName: "Bernardo Silva",
    position: "RW",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RWF; subbed off at 70'",
  },
  {
    fullName: "Cristian Romero",
    displayName: "Romero",
    position: "CB",
    team: "Tottenham Hotspur",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Bart Verbruggen",
    displayName: "Verbruggen",
    position: "GK",
    team: "Brighton & Hove Albion",
    nationality: "Netherlands",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in goal; played full 90 minutes",
  },

  // 3 Substitutes (all subbed on at 70')
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' at CMF",
  },
  {
    fullName: "Wayne Rooney",
    displayName: "Rooney",
    position: "ST",
    team: "Manchester United",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' at CF",
  },
  {
    fullName: "Bukayo Saka",
    displayName: "Saka",
    position: "RW",
    team: "Arsenal",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' at RMF/RW",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 118...");

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

  console.log("\nLogging Match 118 with 14 player performances...");

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
    scoreHome: 3,
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 118 logged from player ratings screenshots (3-3 Away Draw, Didier Drogba 2G MOTM, Florian Wirtz 1G, Omar Marmoush 2A, Kevin De Bruyne 1A; Subs: Alexis Mac Allister, Wayne Rooney, Bukayo Saka on at 70' for Omar Marmoush, Florian Wirtz, Bernardo Silva)",
    performances,
  });

  console.log(`\nMatch 118 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 118:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
