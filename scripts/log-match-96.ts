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
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; assisted Inzaghi's goal",
  },
  {
    fullName: "Matty Cash",
    displayName: "Cash",
    position: "RB",
    team: "Aston Villa",
    nationality: "Poland",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RMF",
  },
  {
    fullName: "Sho Inagaki",
    displayName: "Inagaki",
    position: "CM",
    team: "Nagoya Grampus",
    nationality: "Japan",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF",
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
    notes: "Goalkeeper",
  },
  {
    fullName: "Virgil van Dijk",
    displayName: "Van Dijk",
    position: "CB",
    team: "Liverpool",
    nationality: "Netherlands",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },
  {
    fullName: "Hayato Araki",
    displayName: "Araki",
    position: "CB",
    team: "Sanfrecce Hiroshima",
    nationality: "Japan",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back; Panenka debut",
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
    notes: "Started at CB",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Edin Višća",
    displayName: "Višća",
    position: "RW",
    team: "Trabzonspor",
    nationality: "Bosnia and Herzegovina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RWF; subbed off at 70'",
  },
  {
    fullName: "Felipe Anderson",
    displayName: "Felipe Anderson",
    position: "CAM",
    team: "Palmeiras",
    nationality: "Brazil",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Luka Modrić",
    displayName: "Modrić",
    position: "CM",
    team: "Real Madrid",
    nationality: "Croatia",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in central midfield",
  },

  // 3 Substitutes (subbed on at 70')
  {
    fullName: "Filippo Inzaghi",
    displayName: "Inzaghi",
    position: "ST",
    team: "AC Milan",
    nationality: "Italy",
    matchRating: 7.0,
    goals: 2,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Felipe Anderson; scored 2 Goals off the bench (Brace)",
  },
  {
    fullName: "Rayan Cherki",
    displayName: "Cherki",
    position: "CAM",
    team: "Olympique Lyonnais",
    nationality: "France",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Mount; assisted Inzaghi's goal; Panenka debut",
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
    notes: "Subbed on at 70' for Višća",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 96...");

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

  console.log("\nLogging Match 96 with 14 player performances...");

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
    scoreAway: 7,
    status: "COMPLETED",
    notes:
      "eFootball Home match logged from player ratings screenshots (2-7 Home Loss, Inzaghi 2G brace off bench, Cherki 1A debut, Rahimi 1A; Debuts: Hayato Araki, Rayan Cherki; Subs: Inzaghi, Cherki, Doué subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 96 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 96:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
