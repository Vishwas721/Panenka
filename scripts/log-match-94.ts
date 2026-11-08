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
    fullName: "Sofiane Rahimi",
    displayName: "Rahimi",
    position: "ST",
    team: "Al-Ain",
    nationality: "Morocco",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at forward; scored 1 Goal; Man of the Match (★ 7.0); Panenka debut",
  },
  {
    fullName: "Álvaro Morata",
    displayName: "Morata",
    position: "ST",
    team: "AC Milan",
    nationality: "Spain",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; assisted 1 Goal; subbed off at 70'; Panenka debut",
  },
  {
    fullName: "Edin Višća",
    displayName: "Višća",
    position: "RW",
    team: "Trabzonspor",
    nationality: "Bosnia and Herzegovina",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at wing; assisted 1 Goal; Panenka debut",
  },
  {
    fullName: "Luka Modrić",
    displayName: "Modrić",
    position: "CM",
    team: "Real Madrid",
    nationality: "Croatia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in central midfield; Panenka debut",
  },
  {
    fullName: "Martin Ødegaard",
    displayName: "Ødegaard",
    position: "CAM",
    team: "Arsenal",
    nationality: "Norway",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CAM; subbed off at 70'; Panenka debut",
  },
  {
    fullName: "Fabián Ruiz",
    displayName: "Fabián Ruiz",
    position: "CM",
    team: "Paris Saint-Germain",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in central midfield",
  },
  {
    fullName: "Joe Gomez",
    displayName: "Gomez",
    position: "CB",
    team: "Liverpool",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in defense",
  },
  {
    fullName: "Virgil van Dijk",
    displayName: "Van Dijk",
    position: "CB",
    team: "Liverpool",
    nationality: "Netherlands",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back; Panenka debut",
  },
  {
    fullName: "Sergio Ramos",
    displayName: "Ramos",
    position: "CB",
    team: "Sevilla",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back; Panenka debut",
  },
  {
    fullName: "Matty Cash",
    displayName: "Cash",
    position: "RB",
    team: "Aston Villa",
    nationality: "Poland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at right-back; Panenka debut",
  },
  {
    fullName: "Lukáš Hrádecký",
    displayName: "Hrádecký",
    position: "GK",
    team: "Bayer Leverkusen",
    nationality: "Finland",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper; Panenka debut",
  },

  // 2 Substitutes (subbed on at 70')
  {
    fullName: "Filippo Inzaghi",
    displayName: "Inzaghi",
    position: "ST",
    team: "AC Milan",
    nationality: "Italy",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Morata; scored 1 Goal; Panenka debut",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Ødegaard; scored 1 Goal; Panenka debut",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 94...");

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

  console.log("\nLogging Match 94 with 13 player performances...");

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
    scoreAway: 2,
    status: "COMPLETED",
    notes:
      "eFootball Home match logged from match notes (3-2 Home Win, Rahimi 1G & MOTM, Morata 1A, Višća 1A, Inzaghi 1G off bench, Mount 1G off bench; 11 Debuts; Subs: Inzaghi, Mount subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 94 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 94:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
