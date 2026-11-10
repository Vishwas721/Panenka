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
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal and provided 1 Assist",
  },
  {
    fullName: "Désiré Doué",
    displayName: "Doué",
    position: "RW",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RWF; scored 1 Goal",
  },
  {
    fullName: "Rayan Cherki",
    displayName: "Cherki",
    position: "CAM",
    team: "Olympique Lyonnais",
    nationality: "France",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; scored 1 Goal; subbed off at 70'",
  },
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
    notes: "Started at CF; provided 1 Assist",
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
    notes: "Started at center-back",
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
    minutesPlayed: 70,
    notes: "Started at CMF; subbed off at 70'",
  },
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
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; subbed off at 70'; Panenka debut",
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
  {
    fullName: "Virgil van Dijk",
    displayName: "Van Dijk",
    position: "CB",
    team: "Liverpool",
    nationality: "Netherlands",
    matchRating: 5.0,
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
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at left-back",
  },
  {
    fullName: "Fikayo Tomori",
    displayName: "Tomori",
    position: "CB",
    team: "AC Milan",
    nationality: "England",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },

  // 3 Substitutes (subbed on at 70')
  {
    fullName: "Edin Višća",
    displayName: "Višća",
    position: "RW",
    team: "Trabzonspor",
    nationality: "Bosnia and Herzegovina",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Rodrygo; scored 1 Goal off the bench",
  },
  {
    fullName: "Juan Vigón",
    displayName: "Vigón",
    position: "CAM",
    team: "Tigres UANL",
    nationality: "Mexico",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Inagaki",
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Cherki",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 101...");

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

  console.log("\nLogging Match 101 with 14 player performances...");

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
    scoreHome: 5,
    scoreAway: 4,
    status: "COMPLETED",
    notes:
      "eFootball Match 101 logged from player ratings screenshots (5-4 Away Loss, Inzaghi 1G 1A, Doué 1G, Cherki 1G, Višća 1G off bench, Rahimi 1A; Debuts: Rodrygo; Subs: Višća, Vigón, Mount subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 101 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 101:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
