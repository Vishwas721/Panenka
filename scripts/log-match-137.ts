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
    fullName: "Gerónimo Rulli",
    displayName: "Rulli",
    position: "GK",
    team: "Marseille",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at GK; played full 90 minutes",
  },
  {
    fullName: "Eren Elmalı",
    displayName: "Elmalı",
    position: "LB",
    team: "Trabzonspor",
    nationality: "Turkey",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at LB; played full 90 minutes",
  },
  {
    fullName: "Dean Huijsen",
    displayName: "Huijsen",
    position: "CB",
    team: "Bournemouth",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at CB; played full 90 minutes",
  },
  {
    fullName: "Antonio Rüdiger",
    displayName: "Rüdiger",
    position: "CB",
    team: "Real Madrid",
    nationality: "Germany",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at CB; played full 90 minutes",
  },
  {
    fullName: "Vanderson",
    displayName: "Vanderson",
    position: "RB",
    team: "Monaco",
    nationality: "Brazil",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at RB; played full 90 minutes",
  },
  {
    fullName: "Vitinha",
    displayName: "Vitinha",
    position: "CM",
    team: "Paris Saint-Germain",
    nationality: "Portugal",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CMF; played full 90 minutes",
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
    notes: "Started at AMF; subbed off at 70'",
  },
  {
    fullName: "Pedro",
    displayName: "Pedro",
    position: "CAM",
    team: "Lazio",
    nationality: "Spain",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at AMF; subbed off at 70'",
  },
  {
    fullName: "Ferreira",
    displayName: "Ferreira",
    position: "LW",
    team: "São Paulo",
    nationality: "Brazil",
    matchRating: 7.0,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at LWF; provided 1 Assist; played full 90 minutes",
  },
  {
    fullName: "Marco van Basten",
    displayName: "Van Basten",
    position: "ST",
    team: "AC Milan",
    nationality: "Netherlands",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at CF; scored 1 Goal; played full 90 minutes",
  },
  {
    fullName: "Lionel Messi",
    displayName: "Messi",
    position: "RW",
    team: "Barcelona",
    nationality: "Argentina",
    matchRating: 4.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at RWF; subbed off at 70'",
  },

  // 3 Substitutes (all on at 70')
  {
    fullName: "Dimitri Payet",
    displayName: "Payet",
    position: "CAM",
    team: "Vasco da Gama",
    nationality: "France",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for Martin Ødegaard",
  },
  {
    fullName: "Ademola Lookman",
    displayName: "Lookman",
    position: "CAM",
    team: "Atalanta",
    nationality: "Nigeria",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Subbed on at 70' for Pedro",
  },
  {
    fullName: "Benjamín Rollheiser",
    displayName: "Rollheiser",
    position: "CAM",
    team: "Benfica",
    nationality: "Argentina",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for Lionel Messi",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 137...");

  const playerIds: { [name: string]: string } = {};

  for (const p of matchPlayers) {
    const existing = await prisma.player.findFirst({
      where: {
        OR: [
          { fullName: { equals: p.fullName, mode: "insensitive" } },
          { displayName: { equals: p.displayName, mode: "insensitive" } },
        ],
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

  console.log("\nLogging Match 137 with 14 player performances...");

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
      "eFootball Match 137 logged from player ratings screenshots (1-2 Home Loss, Marco van Basten 1G, Ferreira 1A; Opponent MOTM; Subs: Dimitri Payet, Ademola Lookman, Benjamín Rollheiser on at 70' for Martin Ødegaard, Pedro, Lionel Messi; Debuts: Marco van Basten, Ferreira, Dean Huijsen, Antonio Rüdiger, Gerónimo Rulli, Eren Elmalı, Pedro, Lionel Messi, Dimitri Payet, Benjamín Rollheiser)",
    performances,
  });

  console.log(`\nMatch 137 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME LOSS)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 137:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
