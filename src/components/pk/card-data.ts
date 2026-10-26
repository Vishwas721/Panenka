import type { PlayerInsight } from "@/server/services/insights.service";
import type { PlayerCardData } from "./player-card";

export function toCardData(i: PlayerInsight): PlayerCardData {
  return {
    id: i.player.id,
    fullName: i.player.fullName,
    displayName: i.player.displayName,
    position: i.rating.position,
    cardPosition: i.player.position,
    squadNumber: i.player.squadNumber,
    imageUrl: i.player.imageUrl,
    nationality: i.player.nationality,
    team: i.player.team,
    ovr: i.ovr,
    tier: i.tier,
    attrs: i.attrs,
    archetype: i.archetype,
    signature: i.keywords.signature.slice(0, 3),
    apps: i.profile.apps,
    goals: i.profile.goals,
    assists: i.profile.assists,
    motm: i.profile.motm,
    avgRating: i.profile.rating.avg,
  };
}
