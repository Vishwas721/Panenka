import type { Metadata } from "next";
import { getSquadInsights } from "@/server/services/insights.service";
import { KEYWORD_CATALOGUE, DYNAMIC_TEMPLATES } from "@/lib/stats/keywords";
import { Masthead } from "@/components/pk/kit";
import { shortName } from "@/components/pk/format";
import { Codex, type Owner, type DynamicInstance } from "@/components/keywords/codex";

export const metadata: Metadata = {
  title: "Codex",
  description: "Every keyword a player can earn, who owns it, and the endless dynamic honours.",
};

export const dynamic = "force-dynamic";

export default async function KeywordsPage() {
  const squad = await getSquadInsights();

  const owners: Record<string, Owner[]> = {};
  const dynamicMap = new Map<string, DynamicInstance>();

  for (const i of squad) {
    const owner: Owner = { id: i.player.id, name: shortName(i.player), fullName: i.player.fullName, imageUrl: i.player.imageUrl };
    for (const k of i.keywords.unlocked) {
      if (k.dynamic) {
        const inst = dynamicMap.get(k.id) ?? { id: k.id, template: k.id.split(":")[0]!, name: k.name, rarity: k.rarity, family: k.family, description: k.description, owners: [] };
        inst.owners.push(owner);
        dynamicMap.set(k.id, inst);
      } else {
        (owners[k.id] ??= []).push(owner);
      }
    }
  }

  const ownedCount = Object.keys(owners).length;

  return (
    <>
      <Masthead
        kicker={<><span className="text-primary">●</span> The Codex</>}
        title={<>{KEYWORD_CATALOGUE.length}<span className="text-outline">+</span> Keywords</>}
        accent="and counting"
      >
        Every title a player can earn from their ratings, goals, assists and awards — {ownedCount} already claimed by the squad,
        plus {DYNAMIC_TEMPLATES.length} dynamic families that mint new honours for every opponent, competition, season and month.
      </Masthead>
      <Codex catalogue={KEYWORD_CATALOGUE} owners={owners} templates={DYNAMIC_TEMPLATES} instances={[...dynamicMap.values()]} squadSize={squad.length} />
    </>
  );
}
