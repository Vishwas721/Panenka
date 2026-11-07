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
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CF; scored 1 Goal",
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
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB",
  },
  {
    fullName: "Javier Zanetti",
    displayName: "Zanetti",
    position: "RB",
    team: "Inter Milan",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at full-back",
  },
  {
    fullName: "Anatolii Trubin",
    displayName: "Trubin",
    position: "GK",
    team: "SL Benfica",
    nationality: "Ukraine",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper; Panenka debut",
  },
  {
    fullName: "Clément Lenglet",
    displayName: "Lenglet",
    position: "CB",
    team: "Atlético Madrid",
    nationality: "France",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB",
  },
  {
    fullName: "Jordi Alba",
    displayName: "Jordi Alba",
    position: "LB",
    team: "Inter Miami",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; Panenka debut",
  },
  {
    fullName: "Amadou Onana",
    displayName: "Onana",
    position: "CDM",
    team: "Aston Villa",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at DMF",
  },
  {
    fullName: "Guti",
    displayName: "Guti",
    position: "CM",
    team: "Real Madrid",
    nationality: "Spain",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CMF; subbed off at 70'",
  },
  {
    fullName: "Alexis Saelemaekers",
    displayName: "Saelemaekers",
    position: "RW",
    team: "AS Roma",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RMF",
  },
  {
    fullName: "Jonathan David",
    displayName: "David",
    position: "ST",
    team: "Lille OSC",
    nationality: "Canada",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; subbed off at 70'",
  },
  {
    fullName: "Eden Hazard",
    displayName: "Hazard",
    position: "LW",
    team: "Real Madrid",
    nationality: "Belgium",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LWF; subbed off at 70'",
  },

  // 3 Substitutes (subbed on at 70')
  {
    fullName: "Omar Marmoush",
    displayName: "Marmoush",
    position: "ST",
    team: "Eintracht Frankfurt",
    nationality: "Egypt",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for David; Panenka debut",
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
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Guti",
  },
  {
    fullName: "Gustavo Silva",
    displayName: "Gustavo Silva",
    position: "LW",
    team: "Vitória",
    nationality: "Brazil",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Hazard",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 93...");

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

  console.log("\nLogging Match 93 with 14 player performances...");

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
      "eFootball Home match logged from player ratings screenshots (1-3 Home Loss, Mbeumo 1G; Debuts: Anatolii Trubin, Jordi Alba, Omar Marmoush; Subs: Marmoush, Sučić, Gustavo Silva subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 93 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 93:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
