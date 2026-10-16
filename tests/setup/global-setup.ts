import { execSync } from "node:child_process";

/**
 * Tests run against a dedicated `panenka_test` database so they never
 * write into the development data. Migrations and the demo seed are applied
 * before the run.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://panenka:panenka_dev_password@127.0.0.1:5434/panenka_test";

export default function setup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };
  execSync("npx prisma migrate deploy", { stdio: "ignore", env });
  // Integration tests read the deterministic demo squad.
  execSync("npx tsx prisma/seed.ts", { stdio: "ignore", env });
}
