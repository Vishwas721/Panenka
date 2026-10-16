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

  // Per-player baseline quality drives ratings so the demo squad has distinct identities.
  const baseline: Record<string, number> = {
    "Mateo Rossi": 7.2, "Luka Lindqvist": 7.3, "Kofi Mensah": 7.0, "Alexandre Silva": 6.8,
    "Tariq Al-Mansoor": 6.6, "Dante Valenti": 6.9, "Marcus Brody": 6.7, "Kenji Sato": 6.5,
    "Diego Morales": 6.6, "Samu Castrillo": 6.7, "Jonas Varga": 6.5, "Elias Novak": 6.8,
    "Julian Brandtner": 6.3, "Viktor Petrov": 6.2, "Noah Sterling": 6.4,
  };
  const ratingFor = (name: string, goals: number, assists: number, started: boolean) => {
    const noise = (rng() - 0.5) * 1.6;
    const r = (baseline[name] ?? 6.5) + noise + goals * 0.75 + assists * 0.5 - (started ? 0 : 0.3);
    return Math.round(Math.max(4.2, Math.min(10, r)) * 10) / 10;
  };

  // Procedurally extend the fixture list so streaks, splits and keywords have depth.
  const opponents = [
    "Harbour City", "Riverside Athletic", "Northgate United", "Kingsbridge Rovers", "Old Mill FC",
    "Eastfield Town", "Westlake Wanderers", "Southport Albion", "Crown Park", "Ironworks FC",
  ];
  const attackers = ["Mateo Rossi", "Kofi Mensah", "Tariq Al-Mansoor", "Kenji Sato"];
  const creators = ["Luka Lindqvist", "Alexandre Silva", "Kofi Mensah", "Elias Novak", "Mateo Rossi"];
  const regulars = [
    "Mateo Rossi", "Luka Lindqvist", "Kofi Mensah", "Alexandre Silva", "Tariq Al-Mansoor",
    "Dante Valenti", "Marcus Brody", "Diego Morales", "Samu Castrillo", "Jonas Varga", "Elias Novak",
  ];
  const bench = ["Kenji Sato", "Julian Brandtner", "Viktor Petrov"];
  const pick = <T,>(xs: T[]) => xs[Math.floor(rng() * xs.length)]!;
  type SeedPerf = { name: string; status: AppearanceStatus; min?: number; goals?: number; assists?: number; notes?: string };
  type SeedMatch = Omit<(typeof matchesData)[number], "performances" | "notes"> & { notes: string | null; performances: SeedPerf[] };
  const generated: SeedMatch[] = [];
  for (let i = 0; i < 24; i++) {
    const date = new Date(Date.UTC(2025, 7, 9 + i * 7 + (i % 3 === 0 ? 3 : 0), 15));
    const venue = i % 2 === 0 ? MatchVenue.HOME : MatchVenue.AWAY;
    const ourGoals = Math.floor(rng() * 4.2);
    const theirGoals = Math.floor(rng() * 2.8);
    const tally: Record<string, { goals: number; assists: number }> = {};
    for (let g = 0; g < ourGoals; g++) {
      const scorer = rng() < 0.12 ? pick(regulars) : pick(attackers);
      (tally[scorer] ??= { goals: 0, assists: 0 }).goals++;
      if (rng() < 0.75) {
        let creator = pick(creators);
        if (creator === scorer) creator = scorer === "Luka Lindqvist" ? "Alexandre Silva" : "Luka Lindqvist";
        (tally[creator] ??= { goals: 0, assists: 0 }).assists++;
      }
    }
    const subs = bench.filter(() => rng() < 0.6);
    generated.push({
      date,
      opponent: opponents[i % opponents.length]!,
      team: "FC Panenka",
      venue,
      scoreHome: venue === MatchVenue.HOME ? ourGoals : theirGoals,
      scoreAway: venue === MatchVenue.HOME ? theirGoals : ourGoals,
      status: MatchStatus.COMPLETED,
      competitionId: i % 4 === 3 ? championsCup.id : premierLeague.id,
      notes: null,
      performances: [
        ...regulars.map((name) => ({ name, status: AppearanceStatus.STARTED, min: rng() < 0.25 ? 60 + Math.floor(rng() * 25) : 90, goals: tally[name]?.goals ?? 0, assists: tally[name]?.assists ?? 0 })),
        ...subs.map((name) => ({ name, status: AppearanceStatus.SUBSTITUTE_USED, min: 10 + Math.floor(rng() * 25), goals: tally[name]?.goals ?? 0, assists: tally[name]?.assists ?? 0 })),
      ],
    });
  }

  const appeared = (st: AppearanceStatus) => st === AppearanceStatus.STARTED || st === AppearanceStatus.SUBSTITUTE_USED;
  for (const m of [...(matchesData as SeedMatch[]), ...generated]) {
    const { performances, ...matchInfo } = m;
    const match = await prisma.match.create({
      data: {
        ...matchInfo,
        isDemo: true,
      },
    });

    const rated = performances.map((perf) => ({
      perf,
      rating:
        m.status === MatchStatus.COMPLETED && appeared(perf.status)
          ? ratingFor(perf.name, perf.goals ?? 0, perf.assists ?? 0, perf.status === AppearanceStatus.STARTED)
          : null,
    }));
    let best: (typeof rated)[number] | null = null;
    for (const r of rated) if (r.rating !== null && (!best || r.rating > (best.rating ?? 0))) best = r;

    for (const { perf, rating } of rated) {
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
          rating,
          isMotm: best !== null && best.perf === perf,
          notes: perf.notes ?? null,
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
