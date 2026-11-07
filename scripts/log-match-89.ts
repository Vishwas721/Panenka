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
    fullName: "Bryan Mbeumo",
    displayName: "Mbeumo",
    position: "ST",
    team: "Brentford",
    nationality: "Cameroon",
    matchRating: 7.5,
    goals: 2,
    assists: 0,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Scored 2 Goals (Brace); Man of the Match (★ 7.5); subbed off at 70'",
  },
  {
    fullName: "Guti",
    displayName: "Guti",
    position: "CM",
    team: "Real Madrid",
    nationality: "Spain",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; assisted Mbeumo's goal",
  },
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at AMF; assisted Mbeumo's goal",
  },
  {
    fullName: "Strahinja Pavlović",
    displayName: "Pavlović",
    position: "CB",
    team: "AC Milan",
    nationality: "Serbia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB",
  },
  {
    fullName: "Amadou Onana",
    displayName: "Onana",
    position: "CDM",
    team: "Aston Villa",
    nationality: "Belgium",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF",
  },
  {
    fullName: "Milot Rashica",
    displayName: "Rashica",
    position: "RW",
    team: "Beşiktaş",
    nationality: "Kosovo",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at RWF; subbed off at 70'",
  },
  {
    fullName: "Davinson Sánchez",
    displayName: "Sánchez",
    position: "CB",
    team: "Galatasaray",
    nationality: "Colombia",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB",
  },
  {
    fullName: "Luka Sučić",
    displayName: "Sučić",
    position: "CM",
    team: "Real Sociedad",
    nationality: "Croatia",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CMF; subbed off at 70'",
  },
  {
    fullName: "Claudio Bravo",
    displayName: "Bravo",
    position: "GK",
    team: "Real Betis",
    nationality: "Chile",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper; Panenka debut",
  },
  {
    fullName: "Nuno Mendes",
    displayName: "Nuno Mendes",
    position: "LB",
    team: "Paris Saint-Germain",
    nationality: "Portugal",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB",
  },
  {
    fullName: "Javier Zanetti",
    displayName: "Zanetti",
    position: "RB",
    team: "Inter Milan",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at full-back",
  },

  // 3 Substitutes (subbed on at 70')
  {
    fullName: "Gustavo Silva",
    displayName: "Gustavo Silva",
    position: "LW",
    team: "Vitória",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Rashica",
  },
  {
    fullName: "Franz Beckenbauer",
    displayName: "Beckenbauer",
    position: "CB",
    team: "FC Bayern München",
    nationality: "Germany",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Sučić",
  },
  {
    fullName: "Eden Hazard",
    displayName: "Hazard",
    position: "LW",
    team: "Real Madrid",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Mbeumo",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 89...");

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

  console.log("\nLogging Match 89 with 14 player performances...");

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
    scoreHome: 2,
    scoreAway: 2,
    status: "COMPLETED",
    notes:
      "eFootball Away match logged from player ratings screenshots (2-2 Away Draw, Mbeumo 2G & MOTM, Guti 1A, Mbappé 1A; Debut: Claudio Bravo; Subs: Gustavo Silva, Beckenbauer, Hazard subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 89 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Opponent ${match.scoreHome} - ${match.scoreAway} Panenka (AWAY DRAW)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 89:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
