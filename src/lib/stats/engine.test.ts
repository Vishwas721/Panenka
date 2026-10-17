import { describe, it, expect } from "vitest";
import { buildProfile, teamScore, resultOf, type MatchRecord } from "./profile";
import { computeAttributes, computeOverall, cardTier, ratingToScore, archetype, cardKeys } from "./attributes";
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
  it("maps ratings monotonically onto 1-99", () => {
    expect(ratingToScore(6)).toBe(58);
    expect(ratingToScore(10)).toBe(99);
    expect(ratingToScore(7.5)).toBeGreaterThan(ratingToScore(7));
  });

  it("rewards a prolific striker over a quiet one", () => {
    const star = buildProfile(Array.from({ length: 10 }, () => rec({ goals: 1, rating: 8.2, motm: true })));
    const quiet = buildProfile(Array.from({ length: 10 }, () => rec({ rating: 6.1 })));
    const a = computeAttributes(star)!;
    const b = computeAttributes(quiet)!;
    expect(a.FIN).toBeGreaterThan(b.FIN);
    const ovrA = computeOverall(star, a, "ST")!;
    const ovrB = computeOverall(quiet, b, "ST")!;
    expect(ovrA).toBeGreaterThan(ovrB);
    expect(cardTier(ovrA).min).toBeGreaterThanOrEqual(cardTier(ovrB).min);
    expect(archetype(a)).not.toBeNull();
  });

  it("shrinks small samples toward the middle", () => {
    const one = computeAttributes(buildProfile([rec({ goals: 4, rating: 10, motm: true })]))!;
    expect(one.FIN).toBeLessThan(80);
  });
});

describe("positional fairness", () => {
  const games = (p: Partial<MatchRecord>, n = 8) => Array.from({ length: n }, () => rec(p));

  it("does not punish a steady defender for not scoring", () => {
    const cb = buildProfile(games({ rating: 7, goalsFor: 1, goalsAgainst: 0 }));
    const st = buildProfile(games({ rating: 7, goalsFor: 1, goalsAgainst: 0 }));
    const cbOvr = computeOverall(cb, computeAttributes(cb, "CB"), "CB")!;
    const stOvr = computeOverall(st, computeAttributes(st, "ST"), "ST")!;
    // Same ratings, no output: the defender (with clean sheets) must not trail the striker.
    expect(cbOvr).toBeGreaterThanOrEqual(stOvr);
  });

  it("values an assist from a centre-back more than one from a striker", () => {
    const rows = [rec({ assists: 1, rating: 7 }), ...games({ rating: 7 }, 3)];
    const p = buildProfile(rows);
    expect(computeAttributes(p, "CB")!.IMP).toBeGreaterThan(computeAttributes(p, "ST")!.IMP);
  });

  it("rewards clean sheets in DEF and conceding lowers it", () => {
    const tight = computeAttributes(buildProfile(games({ goalsFor: 1, goalsAgainst: 0 })), "CB")!;
    const leaky = computeAttributes(buildProfile(games({ goalsFor: 3, goalsAgainst: 3 })), "CB")!;
    expect(tight.DEF).toBeGreaterThan(leaky.DEF + 15);
  });

  it("shows DEF instead of FIN on defensive cards", () => {
    expect(cardKeys("CB")).toContain("DEF");
    expect(cardKeys("CB")).not.toContain("FIN");
    expect(cardKeys("ST")).toContain("FIN");
    expect(cardKeys("ST")).not.toContain("DEF");
  });

  it("keeps a scoring striker ahead of a quiet one", () => {
    const scorer = buildProfile(games({ goals: 1, rating: 7.5 }));
    const quiet = buildProfile(games({ rating: 6 }));
    expect(computeOverall(scorer, computeAttributes(scorer, "ST"), "ST")!).toBeGreaterThan(
      computeOverall(quiet, computeAttributes(quiet, "ST"), "ST")! + 10,
    );
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
