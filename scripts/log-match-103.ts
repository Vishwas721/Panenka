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
    fullName: "Bernardo Silva",
    displayName: "Bernardo Silva",
    position: "RW",
    team: "Manchester City",
    nationality: "Portugal",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RWF; scored 1 Goal; Panenka debut",
  },
  {
    fullName: "Johan Cruyff",
    displayName: "Cruyff",
    position: "CAM",
    team: "Netherlands",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; provided 1 Assist; subbed off at 70'; Panenka debut",
  },
  {
    fullName: "Weston McKennie",
    displayName: "McKennie",
    position: "CM",
    team: "Juventus",
    nationality: "United States",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; Panenka debut",
  },
  {
    fullName: "Giorgi Mamardashvili",
    displayName: "Mamardashvili",
    position: "GK",
    team: "Valencia",
    nationality: "Georgia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper",
  },
  {
    fullName: "Andreas Christensen",
    displayName: "Christensen",
    position: "CB",
    team: "Barcelona",
    nationality: "Denmark",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back; Panenka debut",
  },
  {
    fullName: "Renato Veiga",
    displayName: "Renato Veiga",
    position: "CB",
    team: "Chelsea",
    nationality: "Portugal",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },
  {
    fullName: "Dominik Szoboszlai",
    displayName: "Szoboszlai",
    position: "CM",
    team: "Liverpool",
    nationality: "Hungary",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; Panenka debut",
  },
  {
    fullName: "Kieran Trippier",
    displayName: "Trippier",
    position: "RB",
    team: "Newcastle United",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at right-back",
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
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RWF; subbed off at 70'",
  },
  {
    fullName: "Soufiane Rahimi",
    displayName: "Rahimi",
    position: "ST",
    team: "Al-Ain",
    nationality: "Morocco",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF",
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
    notes: "Started at right-back; Panenka debut",
  },

  // 2 Substitutes (subbed on at 70')
  {
    fullName: "Riccardo Sottil",
    displayName: "Sottil",
    position: "LW",
    team: "Fiorentina",
    nationality: "Italy",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Doué",
  },
  {
    fullName: "Cole Palmer",
    displayName: "Palmer",
    position: "CAM",
    team: "Chelsea",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Cruyff",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 103...");

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

  console.log("\nLogging Match 103 with 13 player performances...");

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
    scoreAway: 2,
    status: "COMPLETED",
    notes:
      "eFootball Match 103 logged from player ratings screenshots (1-2 Home Loss, Bernardo Silva 1G, Cruyff 1A; Debuts: Bernardo Silva, Johan Cruyff, Weston McKennie, Andreas Christensen, Dominik Szoboszlai, Pedro Porro; Subs: Sottil, Palmer subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 103 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 103:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
