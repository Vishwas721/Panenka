import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const env = process.env.NODE_ENV || "development";
  const dbUrl = process.env.DATABASE_URL || "";

  if (env === "production" || (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1"))) {
    console.error("❌ Refusing to run reset-demo in a non-local or production environment!");
    process.exit(1);
  }

  console.log("🧹 Resetting demo data...");

  const deletedPerfs = await prisma.playerMatchPerformance.deleteMany({
    where: { isDemo: true },
  });

  const deletedMatches = await prisma.match.deleteMany({
    where: { isDemo: true },
  });

  const deletedPlayers = await prisma.player.deleteMany({
    where: { isDemo: true },
  });

  const deletedComps = await prisma.competition.deleteMany({
    where: { isDemo: true },
  });

  console.log(
    `✅ Successfully removed demo data:\n` +
      `- ${deletedPerfs.count} performances\n` +
      `- ${deletedMatches.count} matches\n` +
      `- ${deletedPlayers.count} players\n` +
      `- ${deletedComps.count} competitions`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
