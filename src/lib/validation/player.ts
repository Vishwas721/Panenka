import { z } from "zod";

export const positionEnum = z.enum([
  "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "UNKNOWN",
]);

export const preferredFootEnum = z.enum(["LEFT", "RIGHT", "BOTH", "UNKNOWN"]);

export const createPlayerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(200, "Full name must be 200 characters or fewer")
    .trim(),
  displayName: z
    .string()
    .max(100, "Display name must be 100 characters or fewer")
    .trim()
    .optional()
    .or(z.literal("")),
  position: positionEnum.default("UNKNOWN"),
  preferredFoot: preferredFootEnum.default("UNKNOWN"),
  squadNumber: z
    .number()
    .int("Squad number must be a whole number")
    .min(1, "Squad number must be at least 1")
    .max(99, "Squad number must be 99 or less")
    .nullable()
    .optional(),
  team: z
    .string()
    .max(200, "Team name must be 200 characters or fewer")
    .trim()
    .optional()
    .or(z.literal("")),
  nationality: z
    .string()
    .max(100, "Nationality must be 100 characters or fewer")
    .trim()
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "Image URL must use http or https",
    )
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const updatePlayerSchema = createPlayerSchema.partial();

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
