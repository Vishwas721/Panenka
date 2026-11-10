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
    fullName: "Filippo Inzaghi",
    displayName: "Inzaghi",
    position: "ST",
    team: "AC Milan",
    nationality: "Italy",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal (solo)",
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
    notes: "Started at center-back",
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
    notes: "Started at left-back",
  },
  {
    fullName: "Juan Vigón",
    displayName: "Vigón",
    position: "CAM",
    team: "Tigres UANL",
    nationality: "Mexico",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF",
  },
  {
    fullName: "Fikayo Tomori",
    displayName: "Tomori",
    position: "CB",
    team: "AC Milan",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },
  {
    fullName: "Konrad Laimer",
    displayName: "Laimer",
    position: "CM",
    team: "Bayern München",
    nationality: "Austria",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF",
  },
  {
    fullName: "Rayan Cherki",
    displayName: "Cherki",
    position: "CAM",
    team: "Olympique Lyonnais",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Gabriel Jesus",
    displayName: "Gabriel Jesus",
    position: "ST",
    team: "Arsenal",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; subbed off at 70'; Panenka debut",
  },
  {
    fullName: "Edin Višća",
    displayName: "Višća",
    position: "RW",
    team: "Trabzonspor",
    nationality: "Bosnia and Herzegovina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RWF; subbed off at 70'",
  },
  {
    fullName: "Hayato Araki",
    displayName: "Araki",
    position: "CB",
    team: "Sanfrecce Hiroshima",
    nationality: "Japan",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },
  {
    fullName: "Mile Svilar",
    displayName: "Svilar",
    position: "GK",
    team: "AS Roma",
    nationality: "Serbia",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper",
  },

  // 3 Substitutes (subbed on at 70')
  {
    fullName: "Rodrygo",
    displayName: "Rodrygo",
    position: "ST",
    team: "Real Madrid",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Gabriel Jesus",
  },
  {
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Cherki",
  },
  {
    fullName: "Désiré Doué",
    displayName: "Doué",
    position: "RW",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Višća",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 102...");

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

  console.log("\nLogging Match 102 with 14 player performances...");

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
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Match 102 logged from player ratings screenshots (1-3 Home Loss, Inzaghi 1G solo; Debuts: Gabriel Jesus; Subs: Rodrygo, Mount, Doué subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 102 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 102:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
