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
    fullName: "Jonathan David",
    displayName: "David",
    position: "ST",
    team: "Lille OSC",
    nationality: "Canada",
    matchRating: 7.5,
    goals: 1,
    assists: 2,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Scored 1 Goal, 2 Assists; Man of the Match (★ 7.5)",
  },
  {
    fullName: "Yéremy Pino",
    displayName: "Pino",
    position: "RW",
    team: "Villarreal",
    nationality: "Spain",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RMF; scored 1 Goal, 1 Assist; Panenka debut",
  },
  {
    fullName: "Bryan Mbeumo",
    displayName: "Mbeumo",
    position: "ST",
    team: "Brentford",
    nationality: "Cameroon",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at CF; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Davinson Sánchez",
    displayName: "Sánchez",
    position: "CB",
    team: "Galatasaray",
    nationality: "Colombia",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB",
  },
  {
    fullName: "Nuno Mendes",
    displayName: "Nuno Mendes",
    position: "LB",
    team: "Paris Saint-Germain",
    nationality: "Portugal",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB",
  },
  {
    fullName: "Kyle Walker",
    displayName: "Walker",
    position: "RB",
    team: "Manchester City",
    nationality: "England",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB",
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
    fullName: "Eden Hazard",
    displayName: "Hazard",
    position: "LW",
    team: "Real Madrid",
    nationality: "Belgium",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at LWF; subbed off at 70'",
  },
  {
    fullName: "Guti",
    displayName: "Guti",
    position: "CM",
    team: "Real Madrid",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF",
  },
  {
    fullName: "Claudio Bravo",
    displayName: "Bravo",
    position: "GK",
    team: "Real Betis",
    nationality: "Chile",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Goalkeeper",
  },
  {
    fullName: "Clément Lenglet",
    displayName: "Lenglet",
    position: "CB",
    team: "Atlético Madrid",
    nationality: "France",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB",
  },

  // 2 Substitutes (subbed on at 70')
  {
    fullName: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "CAM",
    team: "Paris Saint-Germain",
    nationality: "France",
    matchRating: 6.5,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Mbeumo; scored 1 Goal",
  },
  {
    fullName: "Gustavo Silva",
    displayName: "Gustavo Silva",
    position: "LW",
    team: "Vitória",
    nationality: "Brazil",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Hazard",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 91...");

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

  console.log("\nLogging Match 91 with 13 player performances...");

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
    scoreHome: 5,
    scoreAway: 3,
    status: "COMPLETED",
    notes:
      "eFootball Home match logged from player ratings screenshots (5-3 Home Win, Jonathan David 1G 2A & MOTM, Pino 1G 1A debut, Mbeumo 1G, Mbappé 1G off bench, Opponent Own Goal 1G; Subs: Mbappé, Gustavo Silva subbed on at 70')",
    performances,
  });

  console.log(`\nMatch 91 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 91:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
