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
    fullName: "Rayan Cherki",
    displayName: "Cherki",
    position: "CAM",
    team: "Olympique Lyonnais",
    nationality: "France",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; scored 1 Goal, provided 1 Assist; Man of the Match (★ 7.5)",
  },
  {
    fullName: "Felipe Anderson",
    displayName: "Felipe Anderson",
    position: "CAM",
    team: "Palmeiras",
    nationality: "Brazil",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at AMF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Désiré Doué",
    displayName: "Doué",
    position: "RW",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RWF; scored 1 Goal",
  },
  {
    fullName: "Álvaro Morata",
    displayName: "Morata",
    position: "ST",
    team: "AC Milan",
    nationality: "Spain",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal",
  },
  {
    fullName: "Rúben Neves",
    displayName: "Neves",
    position: "CDM",
    team: "Al-Hilal",
    nationality: "Portugal",
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF",
  },
  {
    fullName: "Hayato Araki",
    displayName: "Araki",
    position: "CB",
    team: "Sanfrecce Hiroshima",
    nationality: "Japan",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
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
    fullName: "Mason Mount",
    displayName: "Mount",
    position: "CAM",
    team: "Manchester United",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started in midfield",
  },
  {
    fullName: "Lukáš Hrádecký",
    displayName: "Hrádecký",
    position: "GK",
    team: "Bayer Leverkusen",
    nationality: "Finland",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper",
  },
  {
    fullName: "Fikayo Tomori",
    displayName: "Tomori",
    position: "CB",
    team: "AC Milan",
    nationality: "England",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back; Panenka debut",
  },
  {
    fullName: "Nico Schlotterbeck",
    displayName: "Schlotterbeck",
    position: "CB",
    team: "Borussia Dortmund",
    nationality: "Germany",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at center-back",
  },

  // 1 Substitute
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Felipe Anderson; provided 1 Assist off the bench",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 98...");

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

  console.log("\nLogging Match 98 with 12 player performances...");

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
      "eFootball Home match logged from player ratings screenshots and notes (3-3 Home Draw, Cherki 1G 1A & MOTM, Doué 1G, Morata 1G, Anderson 1A, Rahimi 1A off bench; Debuts: Fikayo Tomori; Subs: Rahimi subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 98 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 98:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
