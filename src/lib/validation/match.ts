import { z } from "zod";

export const matchStatusEnum = z.enum(["SCHEDULED", "COMPLETED", "ABANDONED"]);
export const matchVenueEnum = z.enum(["HOME", "AWAY", "NEUTRAL"]);
export const appearanceStatusEnum = z.enum([
  "STARTED",
  "SUBSTITUTE_USED",
  "UNUSED_SUBSTITUTE",
  "DID_NOT_PLAY",
]);

export const APPEARANCE_COUNTED_STATUSES = [
  "STARTED",
  "SUBSTITUTE_USED",
] as const;

export function didAppear(status: string): boolean {
  return APPEARANCE_COUNTED_STATUSES.includes(
    status as (typeof APPEARANCE_COUNTED_STATUSES)[number],
  );
}

export const playerPerformanceSchema = z
  .object({
    playerId: z.string().min(1, "Player is required"),
    appearanceStatus: appearanceStatusEnum,
    minutesPlayed: z
      .number()
      .int("Minutes must be a whole number")
      .min(0, "Minutes cannot be negative")
      .max(130, "Minutes cannot exceed 130")
      .nullable()
      .optional(),
    goals: z
      .number()
      .int("Goals must be a whole number")
      .min(0, "Goals cannot be negative")
      .default(0),
    assists: z
      .number()
      .int("Assists must be a whole number")
      .min(0, "Assists cannot be negative")
      .default(0),
    rating: z
      .number()
      .min(1, "Rating must be between 1.0 and 10.0")
      .max(10, "Rating must be between 1.0 and 10.0")
      .transform((n) => Math.round(n * 10) / 10)
      .nullable()
      .optional(),
    isMotm: z.boolean().optional(),
    notes: z
      .string()
      .max(1000, "Notes must be 1000 characters or fewer")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!didAppear(data.appearanceStatus)) {
        return (
          data.goals === 0 &&
          data.assists === 0 &&
          !data.minutesPlayed &&
          (data.rating === null || data.rating === undefined) &&
          !data.isMotm
        );
      }
      return true;
    },
    {
      message:
        "Players who did not appear cannot have goals, assists, minutes, a rating, or MOTM",
    },
  );

const singleMotm = (perfs: { isMotm?: boolean }[] | undefined) =>
  (perfs ?? []).filter((p) => p.isMotm).length <= 1;

const matchBaseSchema = z.object({
  date: z.coerce.date(),
  opponent: z
    .string()
    .min(1, "Opponent is required")
    .max(200, "Opponent name must be 200 characters or fewer")
    .trim(),
  team: z
    .string()
    .max(200, "Team name must be 200 characters or fewer")
    .trim()
    .optional()
    .or(z.literal("")),
  competitionId: z.string().optional().or(z.literal("")),
  venue: matchVenueEnum.nullable().optional(),
  venueName: z
    .string()
    .max(200, "Venue name must be 200 characters or fewer")
    .trim()
    .optional()
    .or(z.literal("")),
  scoreHome: z
    .number()
    .int()
    .min(0, "Score cannot be negative")
    .nullable()
    .optional(),
  scoreAway: z
    .number()
    .int()
    .min(0, "Score cannot be negative")
    .nullable()
    .optional(),
  status: matchStatusEnum.default("COMPLETED"),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  performances: z.array(playerPerformanceSchema).default([]),
});

export const createMatchSchema = matchBaseSchema.refine(
  (data) => {
    // Both scores or neither
    const hasHome = data.scoreHome !== null && data.scoreHome !== undefined;
    const hasAway = data.scoreAway !== null && data.scoreAway !== undefined;
    return hasHome === hasAway;
  },
  {
    message: "Provide both home and away scores, or neither",
    path: ["scoreHome"],
  },
).refine((data) => singleMotm(data.performances), {
  message: "Only one player can be Man of the Match",
  path: ["performances"],
});

export const updateMatchSchema = matchBaseSchema
  .partial()
  .refine((data) => singleMotm(data.performances), {
    message: "Only one player can be Man of the Match",
    path: ["performances"],
  });

export type PlayerPerformanceInput = z.infer<typeof playerPerformanceSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
