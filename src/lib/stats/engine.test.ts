import { describe, it, expect } from "vitest";
import { buildProfile, teamScore, resultOf, type MatchRecord } from "./profile";
import { computeAttributes, computeOverall, cardTier, archetype, cardKeys } from "./attributes";
import { buildRatingModel, ratePlayer, rateAtPositions, candidatePositions, POSITION_WEIGHTS } from "./rating-model";
import { evaluateKeywords, squadKeywords, KEYWORD_CATALOGUE } from "./keywords";

let n = 0;
function rec(p: Partial<MatchRecord>): MatchRecord {
  n++;
  return {
    matchId: `m${String(n).padStart(3, "0")}`,
    date: new Date(Date.UTC(2025, 8, n)).toISOString(),
    opponent: "Rivals FC",
    competitionId: "c1",
    competitionName: "League",
    season: "2025/26",
    venue: "HOME",
    goalsFor: 2,
    goalsAgainst: 1,
    started: true,
    minutes: 90,
    goals: 0,
    assists: 0,
    rating: 7,
    motm: false,
    ...p,
  };
}

describe("teamScore / resultOf", () => {
  it("flips the score for away fixtures", () => {
    expect(teamScore("AWAY", 1, 3)).toEqual({ goalsFor: 3, goalsAgainst: 1 });
    expect(teamScore("HOME", 1, 3)).toEqual({ goalsFor: 1, goalsAgainst: 3 });
    expect(teamScore(null, null, 2)).toEqual({ goalsFor: null, goalsAgainst: null });
  });
  it("derives W/D/L", () => {
    expect(resultOf(2, 1)).toBe("W");
    expect(resultOf(1, 1)).toBe("D");
    expect(resultOf(0, 1)).toBe("L");
    expect(resultOf(null, 1)).toBeNull();
  });
});

describe("buildProfile", () => {
  const records = [
    rec({ goals: 1, rating: 7.5 }),
    rec({ goals: 2, assists: 1, rating: 8.6, motm: true }),
    rec({ goals: 0, rating: 6.0, goalsFor: 0, goalsAgainst: 2 }),
    rec({ goals: 3, rating: 9.4, motm: true, started: false, minutes: 30, goalsFor: 4, goalsAgainst: 0 }),
    rec({ assists: 2, rating: 8.0, venue: "AWAY", goalsFor: 1, goalsAgainst: 1 }),
  ];
  const p = buildProfile([...records].reverse());

  it("totals output", () => {
    expect(p.apps).toBe(5);
    expect(p.goals).toBe(6);
    expect(p.assists).toBe(3);
    expect(p.motm).toBe(2);
    expect(p.starts).toBe(4);
    expect(p.superSub.goals).toBe(3);
  });

  it("computes rating profile", () => {
    expect(p.rating.avg).toBeCloseTo(7.9, 2);
    expect(p.rating.best).toBe(9.4);
    expect(p.rating.worst).toBe(6);
    expect(p.rating.ninePlus).toBe(1);
    expect(p.rating.eightPlus).toBe(3);
  });

  it("tracks streaks chronologically regardless of input order", () => {
    expect(p.streaks.scoring.best).toBe(2);
    expect(p.streaks.scoring.current).toBe(0);
    expect(p.streaks.contributing.current).toBe(2);
  });

  it("records results and hauls", () => {
    expect(p.record.wins).toBe(3);
    expect(p.record.draws).toBe(1);
    expect(p.record.losses).toBe(1);
    expect(p.hauls.goals.three).toBe(1);
    expect(p.hauls.fullPackage).toBe(1);
    expect(p.bestPerformances[0]!.goals).toBe(3);
  });

  it("handles a player with no appearances", () => {
    const empty = buildProfile([]);
    expect(empty.apps).toBe(0);
    expect(empty.perApp).toBeNull();
    expect(empty.rating.avg).toBeNull();
    expect(computeAttributes(empty)).toBeNull();
  });
});

describe("attributes and OVR", () => {
  it("rewards a prolific striker over a quiet one", () => {
    const star = buildProfile(Array.from({ length: 10 }, () => rec({ goals: 1, rating: 8.2, motm: true })));
    const quiet = buildProfile(Array.from({ length: 10 }, () => rec({ rating: 6.1 })));
    const a = computeAttributes(star, "ST")!;
    const b = computeAttributes(quiet, "ST")!;
    expect(a.FIN).toBeGreaterThan(b.FIN);
    const ovrA = computeOverall(star, a, "ST")!;
    const ovrB = computeOverall(quiet, b, "ST")!;
    expect(ovrA).toBeGreaterThan(ovrB);
    expect(cardTier(ovrA).min).toBeGreaterThanOrEqual(cardTier(ovrB).min);
    expect(archetype(a, "ST")).not.toBeNull();
  });

  it("does not hand a one-game wonder an elite overall", () => {
    const one = buildProfile([rec({ goals: 4, rating: 10, motm: true })]);
    expect(computeOverall(one, null, "ST")!).toBeLessThan(84);
    expect(computeAttributes(one, "ST")!.FIN).toBeLessThan(85);
  });
});

describe("squad-relative model", () => {
  // Mixed results and varied ratings, roughly like a real logged season.
  const season = (n: number, f: (i: number) => Partial<MatchRecord>) =>
    Array.from({ length: n }, (_, i) => rec({ goalsFor: [2, 1, 3, 0, 2][i % 5], goalsAgainst: [1, 1, 0, 2, 2][i % 5], ...f(i) }));
  const squad = () => {
    const members = [
      { id: "ronaldo", position: "ST", profile: buildProfile(season(35, (i) => ({ goals: i % 4 === 3 ? 0 : 1, rating: i % 4 === 3 ? 5.8 : 6.7, motm: i % 6 === 0, assists: i % 9 === 0 ? 1 : 0 }))) },
      { id: "hot", position: "ST", profile: buildProfile(season(3, () => ({ goals: 1, rating: 7 }))) },
      { id: "avgST", position: "ST", profile: buildProfile(season(12, (i) => ({ goals: i % 3 === 0 ? 1 : 0, rating: i % 3 === 0 ? 6.3 : 5.8 }))) },
      { id: "st3", position: "LW", profile: buildProfile(season(15, (i) => ({ assists: i % 3 === 0 ? 1 : 0, rating: i % 2 ? 6.2 : 5.9 }))) },
      { id: "cb", position: "CB", profile: buildProfile(season(20, (i) => ({ rating: i % 2 ? 6.2 : 5.9, goalsFor: 1, goalsAgainst: i % 3 === 0 ? 1 : 0 }))) },
      { id: "cb2", position: "CB", profile: buildProfile(season(20, (i) => ({ rating: i % 2 ? 5.6 : 5.2, goalsFor: 1, goalsAgainst: 2 }))) },
      { id: "gk", position: "GK", profile: buildProfile(season(15, (i) => ({ rating: i % 2 ? 5.9 : 5.5 }))) },
      { id: "cm", position: "CM", profile: buildProfile(season(16, (i) => ({ assists: i % 4 === 0 ? 1 : 0, rating: i % 2 ? 6.1 : 5.8 }))) },
      { id: "cdm", position: "CDM", profile: buildProfile(season(12, (i) => ({ rating: i % 2 ? 6.0 : 5.7 }))) },
    ];
    const model = buildRatingModel(members);
    const ovr = Object.fromEntries(members.map((m) => [m.id, ratePlayer(model, m.profile, m.position).ovr!]));
    return { ovr, model, members };
  };

  it("spreads the squad like a real game: the standout scorer is in the 80s and leads the attack", () => {
    const { ovr } = squad();
    expect(ovr.ronaldo).toBeGreaterThanOrEqual(80);
    expect(ovr.ronaldo).toBeGreaterThan(Math.max(ovr.hot!, ovr.avgST!, ovr.st3!));
    // An elite defender (6.0+ average, clean sheets in most games) can top the squad too.
    expect(ovr.cb).toBeGreaterThanOrEqual(80);
    expect(Math.max(...Object.values(ovr)) - Math.min(...Object.values(ovr))).toBeGreaterThan(20);
  });

  it("ranks sustained output above a three-game hot streak", () => {
    const { ovr } = squad();
    expect(ovr.ronaldo).toBeGreaterThan(ovr.hot!);
  });

  it("lets a defender with clean sheets rate well without any goals or assists", () => {
    const { ovr } = squad();
    expect(ovr.cb).toBeGreaterThanOrEqual(75);
    expect(ovr.cb).toBeGreaterThan(ovr.cb2! + 8);
  });

  it("judges ratings against role peers, so a 5.9 CB beats a 5.9 striker", () => {
    const { model } = squad();
    const p = buildProfile(season(12, () => ({ rating: 5.9 })));
    expect(ratePlayer(model, p, "CB").ovr!).toBeGreaterThan(ratePlayer(model, p, "ST").ovr!);
  });
});

const REFERENCE_MODEL_FOR_TESTS = buildRatingModel([]);

describe("main and second position", () => {
  const season = (n: number, f: (i: number) => Partial<MatchRecord>) =>
    Array.from({ length: n }, (_, i) => rec({ goalsFor: [2, 1, 3, 0, 2][i % 5], goalsAgainst: [1, 1, 0, 2, 2][i % 5], ...f(i) }));
  // A "Rooney": striker card, but a creator — few goals, lots of assists.
  const creator = buildProfile(season(30, (i) => ({ goals: i % 5 === 0 ? 1 : 0, assists: i % 2 === 0 ? 1 : 0, rating: i % 2 ? 6.3 : 6.0 })));

  it("keeps the overall at the main position and reports the other one alongside", () => {
    const r = rateAtPositions(REFERENCE_MODEL_FOR_TESTS, creator, "ST", ["CAM"]);
    expect(r.position).toBe("ST");
    expect(r.ovr).toBe(ratePlayer(REFERENCE_MODEL_FOR_TESTS, creator, "ST").ovr);
    expect(r.byPosition.map((b) => b.position)).toEqual(["ST", "CAM"]);
  });

  it("only rates positions the user set", () => {
    expect(candidatePositions("CDM")).toEqual(["CDM"]);
    expect(candidatePositions("ST", ["CAM"])).toEqual(["ST", "CAM"]);
  });

  it("re-labelling only changes the recipe, not the peers", () => {
    const p = buildProfile(season(20, (i) => ({ rating: i % 2 ? 6.1 : 5.9 })));
    const asCM = ratePlayer(REFERENCE_MODEL_FOR_TESTS, p, "CM", "CM").ovr!;
    const asCDMwithCMpeers = ratePlayer(REFERENCE_MODEL_FOR_TESTS, p, "CDM", "CM").ovr!;
    const asCDMwithDefPeers = ratePlayer(REFERENCE_MODEL_FOR_TESTS, p, "CDM", "CDM").ovr!;
    expect(Math.abs(asCDMwithCMpeers - asCM)).toBeLessThanOrEqual(6);
    expect(asCDMwithDefPeers).toBeGreaterThan(asCDMwithCMpeers); // why the second position keeps the main peers
  });
});

describe("position recipes", () => {
  const sum = (w: Record<string, number>) => Object.values(w).reduce((a, b) => a + b, 0);
  const output = (pos: string) => POSITION_WEIGHTS[pos]!.goals + POSITION_WEIGHTS[pos]!.assists + POSITION_WEIGHTS[pos]!.motm;

  it("every recipe sums to 1", () => {
    for (const [pos, w] of Object.entries(POSITION_WEIGHTS)) expect(sum(w), pos).toBeCloseTo(1, 5);
  });

  it("centre-backs and keepers use no goals or assists", () => {
    for (const pos of ["CB", "GK"]) {
      expect(POSITION_WEIGHTS[pos]!.goals).toBe(0);
      expect(POSITION_WEIGHTS[pos]!.assists).toBe(0);
    }
  });

  it("CDM is about 75% defending/performance and 25% output", () => {
    expect(output("CDM")).toBeCloseTo(0.25, 2);
  });

  it("CM balances output with performance; attackers lean on output", () => {
    expect(output("CM")).toBeGreaterThan(output("CDM"));
    expect(output("ST")).toBeGreaterThan(output("CM"));
  });

  it("shows DEF instead of FIN on defensive cards", () => {
    expect(cardKeys("CB")).toContain("DEF");
    expect(cardKeys("CB")).not.toContain("FIN");
    expect(cardKeys("ST")).toContain("FIN");
  });
});

describe("keywords", () => {
  it("has a large catalogue with unique ids", () => {
    expect(KEYWORD_CATALOGUE.length).toBeGreaterThan(450);
    expect(new Set(KEYWORD_CATALOGUE.map((k) => k.id)).size).toBe(KEYWORD_CATALOGUE.length);
  });

  it("unlocks ladders, feats and rivalry keywords", () => {
    const profile = buildProfile([
      rec({ goals: 1, rating: 8.1 }),
      rec({ goals: 3, rating: 9.5, motm: true }),
      rec({ goals: 1, assists: 1, rating: 8.0 }),
    ]);
    const attrs = computeAttributes(profile);
    const res = evaluateKeywords({ profile, attrs, ovr: computeOverall(profile, attrs, "ST") });
    const names = res.unlocked.map((k) => k.name);
    expect(names).toContain("Off the Mark");
    expect(names).toContain("Debut Goal");
    expect(names).toContain("Hat-Trick & Star");
    expect(names).toContain("Rivals FC Nemesis");
    expect(res.next.length).toBeGreaterThan(0);
  });

  it("awards squad honours to leaders, sharing ties", () => {
    const a = buildProfile([rec({ goals: 2 })]);
    const b = buildProfile([rec({ goals: 2 })]);
    const c = buildProfile([rec({ goals: 0, assists: 1 })]);
    const awards = squadKeywords([
      { id: "a", profile: a, ovr: 70 },
      { id: "b", profile: b, ovr: 60 },
      { id: "c", profile: c, ovr: 50 },
    ]);
    expect(awards.get("a")!.map((k) => k.name)).toContain("Squad Top Scorer");
    expect(awards.get("b")!.map((k) => k.name)).toContain("Squad Top Scorer");
    expect(awards.get("c")!.map((k) => k.name)).toContain("Squad Top Creator");
    expect(awards.get("a")!.map((k) => k.name)).toContain("Squad No. 1");
  });
});
