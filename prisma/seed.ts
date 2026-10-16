import { PrismaClient, Position, PreferredFoot, MatchStatus, MatchVenue, AppearanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Seed pseudo-random generator with a fixed seed for reproducible data
function createRng(seed = 42) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rng = createRng(12345);

async function main() {
  console.log("🌱 Seeding Panenka demo data...");

  // Clean up any existing demo records
  await prisma.playerMatchPerformance.deleteMany({ where: { isDemo: true } });
  await prisma.match.deleteMany({ where: { isDemo: true } });
  await prisma.player.deleteMany({ where: { isDemo: true } });
  await prisma.competition.deleteMany({ where: { isDemo: true } });

  // 1. Create Competitions
  const premierLeague = await prisma.competition.create({
    data: {
      name: "Premier Division",
      season: "2025/26",
      notes: "Main competitive league",
      isDemo: true,
    },
  });

  const championsCup = await prisma.competition.create({
    data: {
      name: "Champions Cup",
      season: "2025/26",
      notes: "Cup tournament",
      isDemo: true,
    },
  });

  // 2. Create Players
  // We'll create distinct players to satisfy all statistical scenarios:
  // - Goalscoring powerhouse (hat-tricks, braces)
  // - Top assister (multiple assists, high assist rate)
  // - High efficiency rate player
  // - Low appearance player (< 3 apps, tests eligibility threshold)
  // - Archived player
  // - Zero-appearance player (edge case)

  const playerData = [
    {
      fullName: "Mateo Rossi",
      displayName: "M. Rossi",
      position: Position.ST,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 9,
      team: "FC Panenka",
      nationality: "Argentina",
      notes: "Prolific finisher, clinical in front of goal",
    },
    {
      fullName: "Luka Lindqvist",
      displayName: "L. Lindqvist",
      position: Position.CAM,
      preferredFoot: PreferredFoot.LEFT,
      squadNumber: 10,
      team: "FC Panenka",
      nationality: "Sweden",
      notes: "Primary playmaker, exceptional vision",
    },
    {
      fullName: "Kofi Mensah",
      displayName: "K. Mensah",
      position: Position.RW,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 7,
      team: "FC Panenka",
      nationality: "Ghana",
      notes: "Pacy winger with dual goal and assist threat",
    },
    {
      fullName: "Alexandre Silva",
      displayName: "Alex Silva",
      position: Position.CM,
      preferredFoot: PreferredFoot.BOTH,
      squadNumber: 8,
      team: "FC Panenka",
      nationality: "Portugal",
      notes: "Box-to-box midfielder, consistent performer",
    },
    {
      fullName: "Tariq Al-Mansoor",
      displayName: "T. Al-Mansoor",
      position: Position.LW,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 11,
      team: "FC Panenka",
      nationality: "Morocco",
      notes: "Explosive attacker, high ceiling",
    },
    {
      fullName: "Dante Valenti",
      displayName: "D. Valenti",
      position: Position.CB,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 4,
      team: "FC Panenka",
      nationality: "Italy",
      notes: "Solid center-back, occasional aerial threat on corners",
    },
    {
      fullName: "Marcus Brody",
      displayName: "M. Brody",
      position: Position.GK,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 1,
      team: "FC Panenka",
      nationality: "England",
      notes: "Starting goalkeeper",
    },
    {
      fullName: "Kenji Sato",
      displayName: "K. Sato",
      position: Position.ST,
      preferredFoot: PreferredFoot.LEFT,
      squadNumber: 19,
      team: "FC Panenka",
      nationality: "Japan",
      notes: "Young impact sub, high efficiency in limited minutes",
    },
    {
      fullName: "Diego Morales",
      displayName: "D. Morales",
      position: Position.CDM,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 6,
      team: "FC Panenka",
      nationality: "Uruguay",
      notes: "Defensive anchor",
    },
    {
      fullName: "Samu Castrillo",
      displayName: "S. Castrillo",
      position: Position.RB,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 2,
      team: "FC Panenka",
      nationality: "Spain",
      notes: "Attacking full-back with accurate crossing",
    },
    {
      fullName: "Jonas Varga",
      displayName: "J. Varga",
      position: Position.LB,
      preferredFoot: PreferredFoot.LEFT,
      squadNumber: 3,
      team: "FC Panenka",
      nationality: "Hungary",
      notes: "Disciplined defender",
    },
    {
      fullName: "Elias Novak",
      displayName: "E. Novak",
      position: Position.CB,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 5,
      team: "FC Panenka",
      nationality: "Croatia",
      notes: "Composed ball-playing defender",
    },
    {
      fullName: "Julian Brandtner",
      displayName: "J. Brandtner",
      position: Position.CM,
      preferredFoot: PreferredFoot.BOTH,
      squadNumber: 14,
      team: "FC Panenka",
      nationality: "Germany",
      notes: "Rotational midfielder (<3 appearances to test eligibility threshold)",
    },
    {
      fullName: "Viktor Petrov",
      displayName: "V. Petrov",
      position: Position.ST,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 21,
      team: "FC Panenka",
      nationality: "Bulgaria",
      notes: "Former veteran striker (Archived)",
      archivedAt: new Date("2026-01-15T10:00:00Z"),
    },
    {
      fullName: "Noah Sterling",
      displayName: "N. Sterling",
      position: Position.GK,
      preferredFoot: PreferredFoot.RIGHT,
      squadNumber: 13,
      team: "FC Panenka",
      nationality: "Scotland",
      notes: "Backup keeper with zero appearances logged",
    },
  ];

  const createdPlayers: Record<string, string> = {};

  for (const p of playerData) {
    const created = await prisma.player.create({
      data: {
        ...p,
        isDemo: true,
      },
    });
    createdPlayers[p.fullName] = created.id;
  }

  // 3. Create Matches & Performances
  // 8 completed matches, 1 scheduled match, 1 abandoned match
  const matchesData = [
    {
      date: new Date("2026-02-01T15:00:00Z"),
      opponent: "Riverside United",
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: 4,
      scoreAway: 1,
      status: MatchStatus.COMPLETED,
      competitionId: premierLeague.id,
      notes: "Opening league match of the spring term",
      performances: [
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 82, goals: 3, assists: 0, notes: "Hat-trick display" }, // Hat-trick king!
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 3, notes: "Masterclass playmaker" }, // 3 assists
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 75, goals: 1, assists: 1 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 65, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 8, goals: 0, assists: 0 },
        { name: "Viktor Petrov", status: AppearanceStatus.SUBSTITUTE_USED, min: 15, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-02-08T15:00:00Z"),
      opponent: "Northport FC",
      team: "FC Panenka",
      venue: MatchVenue.AWAY,
      scoreHome: 2,
      scoreAway: 3,
      status: MatchStatus.COMPLETED,
      competitionId: premierLeague.id,
      notes: "Thrilling away victory",
      performances: [
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 90, goals: 2, assists: 0 }, // Brace!
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 85, goals: 0, assists: 2 }, // 2 assists
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 90, goals: 1, assists: 1 },
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 70, goals: 0, assists: 0 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 20, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-02-15T19:45:00Z"),
      opponent: "Metropolitan Athletic",
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: 5,
      scoreAway: 0,
      status: MatchStatus.COMPLETED,
      competitionId: championsCup.id,
      notes: "Dominant cup performance",
      performances: [
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 60, goals: 2, assists: 1 }, // Another brace
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 30, goals: 2, assists: 0 }, // Brace off the bench!
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 80, goals: 1, assists: 1 },
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 2 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 1 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 70, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Julian Brandtner", status: AppearanceStatus.SUBSTITUTE_USED, min: 20, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-02-22T15:00:00Z"),
      opponent: "Ironbridge City",
      team: "FC Panenka",
      venue: MatchVenue.AWAY,
      scoreHome: 1,
      scoreAway: 2,
      status: MatchStatus.COMPLETED,
      competitionId: premierLeague.id,
      notes: "Gritty win in tough conditions",
      performances: [
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 90, goals: 1, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 1, assists: 0 }, // CB goal
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 1 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 1 },
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 85, goals: 0, assists: 0 },
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 75, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 5, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-03-01T15:00:00Z"),
      opponent: "Seaside Rovers",
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: 4,
      scoreAway: 2,
      status: MatchStatus.COMPLETED,
      competitionId: premierLeague.id,
      notes: "Four-goal show from Rossi",
      performances: [
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 90, goals: 4, assists: 0 }, // 4-goal match milestone!
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 2 },
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 80, goals: 0, assists: 1 },
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 70, goals: 0, assists: 1 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 10, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-03-08T15:00:00Z"),
      opponent: "Highland Rangers",
      team: "FC Panenka",
      venue: MatchVenue.AWAY,
      scoreHome: 0,
      scoreAway: 1,
      status: MatchStatus.COMPLETED,
      competitionId: premierLeague.id,
      notes: "Late winner",
      performances: [
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 25, goals: 1, assists: 0 }, // Winner!
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 1 },
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 65, goals: 0, assists: 0 },
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Julian Brandtner", status: AppearanceStatus.SUBSTITUTE_USED, min: 15, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-03-15T15:00:00Z"),
      opponent: "Oakwood Town",
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: 3,
      scoreAway: 1,
      status: MatchStatus.COMPLETED,
      competitionId: premierLeague.id,
      notes: "Steady home performance",
      performances: [
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 78, goals: 2, assists: 0 }, // Brace!
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 1, assists: 1 },
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 2 },
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 12, goals: 0, assists: 0 },
      ],
    },
    {
      date: new Date("2026-03-22T19:45:00Z"),
      opponent: "Grand Valley FC",
      team: "FC Panenka",
      venue: MatchVenue.AWAY,
      scoreHome: 2,
      scoreAway: 6,
      status: MatchStatus.COMPLETED,
      competitionId: championsCup.id,
      notes: "Record-setting match, 5+ goals category demonstration",
      performances: [
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 90, goals: 5, assists: 1 }, // 5+ goals milestone!
        { name: "Kofi Mensah", status: AppearanceStatus.STARTED, min: 80, goals: 1, assists: 2 },
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 2 },
        { name: "Alexandre Silva", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 1 },
        { name: "Tariq Al-Mansoor", status: AppearanceStatus.STARTED, min: 75, goals: 0, assists: 0 },
        { name: "Diego Morales", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Samu Castrillo", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Jonas Varga", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Dante Valenti", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Elias Novak", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Marcus Brody", status: AppearanceStatus.STARTED, min: 90, goals: 0, assists: 0 },
        { name: "Kenji Sato", status: AppearanceStatus.SUBSTITUTE_USED, min: 10, goals: 0, assists: 0 },
      ],
    },
    // Scheduled Match (should NOT count in totals/rates)
    {
      date: new Date("2026-04-05T15:00:00Z"),
      opponent: "Westlake Wanderers",
      team: "FC Panenka",
      venue: MatchVenue.HOME,
      scoreHome: null,
      scoreAway: null,
      status: MatchStatus.SCHEDULED,
      competitionId: premierLeague.id,
      notes: "Upcoming league fixture",
      performances: [],
    },
    // Abandoned Match (should NOT count in totals/rates)
    {
      date: new Date("2026-03-29T15:00:00Z"),
      opponent: "Foggy Bottom FC",
      team: "FC Panenka",
      venue: MatchVenue.AWAY,
      scoreHome: 1,
      scoreAway: 0,
      status: MatchStatus.ABANDONED,
      competitionId: premierLeague.id,
      notes: "Abandoned due to heavy floodlight failure at 30 mins",
      performances: [
        { name: "Mateo Rossi", status: AppearanceStatus.STARTED, min: 30, goals: 0, assists: 0 },
        { name: "Luka Lindqvist", status: AppearanceStatus.STARTED, min: 30, goals: 0, assists: 0 },
      ],
    },
  ];

  for (const m of matchesData) {
    const { performances, ...matchInfo } = m;
    const match = await prisma.match.create({
      data: {
        ...matchInfo,
        isDemo: true,
      },
    });

    for (const perf of performances) {
      const playerId = createdPlayers[perf.name];
      if (!playerId) continue;

      await prisma.playerMatchPerformance.create({
        data: {
          matchId: match.id,
          playerId,
          appearanceStatus: perf.status,
          minutesPlayed: perf.min ?? null,
          goals: perf.goals ?? 0,
          assists: perf.assists ?? 0,
          notes: "notes" in perf ? ((perf as { notes?: string }).notes ?? null) : null,
          isDemo: true,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
