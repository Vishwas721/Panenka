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
    fullName: "Ørjan Nyland",
    displayName: "Nyland",
    position: "GK",
    team: "Sevilla",
    nationality: "Norway",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at GK; played full 90 minutes",
  },
  {
    fullName: "Javier Zanetti",
    displayName: "Zanetti",
    position: "LB",
    team: "Inter Milan",
    nationality: "Argentina",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at LB; played full 90 minutes",
  },
  {
    fullName: "Dayot Upamecano",
    displayName: "Upamecano",
    position: "CB",
    team: "Bayern Munich",
    nationality: "France",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Started at CB; played full 90 minutes",
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
    notes: "Started at CB; played full 90 minutes",
  },
  {
    fullName: "Héctor Fort",
    displayName: "Fort",
    position: "RB",
    team: "Barcelona",
    nationality: "Spain",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at RB; played full 90 minutes",
  },
  {
    fullName: "João Gomes",
    displayName: "João Gomes",
    position: "CM",
    team: "Wolverhampton Wanderers",
    nationality: "Brazil",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at CMF; scored 1 Goal; played full 90 minutes",
  },
  {
    fullName: "Ernest Muçi",
    displayName: "Muçi",
    position: "CAM",
    team: "Beşiktaş",
    nationality: "Albania",
    matchRating: 6.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at RMF; played full 90 minutes",
  },
  {
    fullName: "Édgar Méndez",
    displayName: "Édgar Méndez",
    position: "RW",
    team: "Bengaluru FC",
    nationality: "Spain",
    matchRating: 7.0,
    goals: 1,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at RMF; scored 1 Goal; subbed off at 70'",
  },
  {
    fullName: "Jakub Kamiński",
    displayName: "Kamiński",
    position: "LW",
    team: "VfL Wolfsburg",
    nationality: "Poland",
    matchRating: 6.5,
    goals: 0,
    assists: 1,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Panenka debut; started at LWF; provided 1 Assist; subbed off at 70'",
  },
  {
    fullName: "Thomas Müller",
    displayName: "Müller",
    position: "CAM",
    team: "Bayern Munich",
    nationality: "Germany",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "STARTED",
    minutesPlayed: 70,
    notes: "Started at SS; subbed off at 70'",
  },
  {
    fullName: "Okazaki Shinji",
    displayName: "Okazaki",
    position: "ST",
    team: "Leicester City",
    nationality: "Japan",
    matchRating: 7.5,
    goals: 1,
    assists: 1,
    isMotm: true,
    status: "STARTED",
    minutesPlayed: 90,
    notes: "Panenka debut; started at SS; scored 1 Goal & provided 1 Assist; MOTM; played full 90 minutes",
  },

  // 3 Substitutes (all on at 70')
  {
    fullName: "Fábio Silva",
    displayName: "Fábio Silva",
    position: "ST",
    team: "UD Las Palmas",
    nationality: "Portugal",
    matchRating: 5.5,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for Thomas Müller",
  },
  {
    fullName: "Leandro Trossard",
    displayName: "Trossard",
    position: "LW",
    team: "Arsenal",
    nationality: "Belgium",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for Jakub Kamiński",
  },
  {
    fullName: "Roberto Donadoni",
    displayName: "Donadoni",
    position: "RW",
    team: "AC Milan",
    nationality: "Italy",
    matchRating: 5.0,
    goals: 0,
    assists: 0,
    isMotm: false,
    status: "SUBSTITUTE_USED",
    minutesPlayed: 20,
    notes: "Panenka debut; subbed on at 70' for Édgar Méndez",
  },
];

async function main() {
  console.log("Checking/verifying players in Panenka for Match 141...");

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

  console.log("\nLogging Match 141 with 14 player performances...");

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
      "eFootball Match 141 logged from player ratings screenshots (3-2 Home Win, Okazaki Shinji 1G 1A MOTM, João Gomes 1G, Édgar Méndez 1G, Jakub Kamiński 1A; Subs: Fábio Silva, Leandro Trossard, Roberto Donadoni on at 70' for Thomas Müller, Jakub Kamiński, Édgar Méndez; Debuts: Ørjan Nyland, Héctor Fort, João Gomes, Ernest Muçi, Édgar Méndez, Jakub Kamiński, Okazaki Shinji, Fábio Silva, Leandro Trossard, Roberto Donadoni)",
    performances,
  });

  console.log(`\nMatch 141 successfully created! ID: ${match.id}`);
  console.log(
    `Score: Panenka ${match.scoreHome} - ${match.scoreAway} Opponent (HOME WIN)`
  );
  console.log(`Appearances recorded: ${match.performances.length}`);
}

main()
  .catch((e) => {
    console.error("Error logging match 141:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
