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
    fullName: "Soufiane Rahimi",
    displayName: "Rahimi",
    position: "ST",
    team: "Al-Ain",
    nationality: "Morocco",
    matchRating: 7.0,
    goals: 2,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 2 Goals (Brace) and provided 1 Assist",
  },
  {
    fullName: "Johan Cruyff",
    displayName: "Cruyff",
    position: "CAM",
    team: "Netherlands",
    nationality: "Netherlands",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Luka Sučić",
    displayName: "Sučić",
    position: "CAM",
    team: "Real Sociedad",
    nationality: "Croatia",
    matchRating: 6.5,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; scored 1 Goal and provided 1 Assist",
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
    notes: "Started at center-back; Panenka debut",
  },
  {
    fullName: "Denis Zakaria",
    displayName: "Zakaria",
    position: "CDM",
    team: "AS Monaco",
    nationality: "Switzerland",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF",
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
    fullName: "Emiliano Martínez",
    displayName: "E. Martínez",
    position: "GK",
    team: "Aston Villa",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper",
  },
  {
    fullName: "Renato Veiga",
    displayName: "Renato Veiga",
    position: "CB",
    team: "Chelsea",
    nationality: "Portugal",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },
  {
    fullName: "Kieran Trippier",
    displayName: "Trippier",
    position: "RB",
    team: "Newcastle United",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at right-back",
  },
  {
    fullName: "Pedro Porro",
    displayName: "Porro",
    position: "RB",
    team: "Tottenham Hotspur",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at right-back",
  },

  // 2 Substitutes (subbed on at 70')
  {
    fullName: "Artem Dovbyk",
    displayName: "Dovbyk",
    position: "ST",
    team: "AS Roma",
    nationality: "Ukraine",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Cruyff",
  },
  {
    fullName: "Désiré Doué",
    displayName: "Doué",
    position: "RW",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Bernardo Silva",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 105...");

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

  console.log("\nLogging Match 105 with 13 player performances...");

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
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 105 logged from player ratings screenshots (3-3 Home Draw, Rahimi 2G 1A, Sučić 1G 1A, Cruyff 1A; Debuts: Gabriel Magalhães; Subs: Dovbyk, Doué subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 105 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 105:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
