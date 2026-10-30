"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Position, PreferredFoot } from "@prisma/client";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { createPlayerSchema, type CreatePlayerInput } from "@/lib/validation";
import { createPlayerAction, updatePlayerAction } from "@/app/actions/players";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { POSITION_LABEL } from "@/components/pk/format";

/** Any player-shaped object works: Prisma `Player` or the insights `PlayerIdentity`. */
export interface EditablePlayer {
  id: string;
  fullName: string;
  displayName: string | null;
  position: Position;
  altPositions?: Position[];
  preferredFoot: PreferredFoot;
  squadNumber: number | null;
  team: string | null;
  nationality: string | null;
  imageUrl: string | null;
  notes: string | null;
}

export interface PlayerFormDialogProps {
  /** Present = edit mode. */
  player?: EditablePlayer | null;
  /** Element that opens the dialog (uncontrolled usage). */
  trigger?: React.ReactNode;
  /** Controlled usage. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (player: { id: string; fullName: string }) => void;
  /** Suggested team for new players. */
  defaultTeam?: string | null;
}

// Laid out roughly as a pitch: attack at the top, keeper at the bottom.
const PITCH: Position[][] = [
  ["LW", "ST", "RW"],
  ["CAM"],
  ["CM", "CDM"],
  ["LB", "CB", "RB"],
  ["GK", "UNKNOWN"],
];

const FEET: { value: PreferredFoot; label: string }[] = [
  { value: "LEFT", label: "Left" },
  { value: "RIGHT", label: "Right" },
  { value: "BOTH", label: "Both" },
  { value: "UNKNOWN", label: "?" },
];

function Field({ label, error, children, htmlFor, className }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="eyebrow block">{label}</label>
      {children}
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}

export function PlayerFormDialog({ player, trigger, open: openProp, onOpenChange, onSuccess, defaultTeam }: PlayerFormDialogProps) {
  const router = useRouter();
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOpenState(o);
    onOpenChange?.(o);
  };
  const isEdit = Boolean(player);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaults = React.useMemo<CreatePlayerInput>(
    () => ({
      fullName: player?.fullName ?? "",
      displayName: player?.displayName ?? "",
      position: player?.position ?? "UNKNOWN",
      altPositions: (player?.altPositions ?? []).filter((p) => p !== "UNKNOWN") as Exclude<Position, "UNKNOWN">[],
      preferredFoot: player?.preferredFoot ?? "UNKNOWN",
      squadNumber: player?.squadNumber ?? null,
      team: player?.team ?? defaultTeam ?? "",
      nationality: player?.nationality ?? "",
      imageUrl: player?.imageUrl ?? "",
      notes: player?.notes ?? "",
    }),
    [player, defaultTeam],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlayerInput>({
    resolver: zodResolver(createPlayerSchema) as any,
    defaultValues: defaults,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaults);
      setServerError(null);
    }
  }, [open, defaults, reset]);

  const onSubmit = async (values: CreatePlayerInput) => {
    setServerError(null);
    try {
      const res = isEdit && player ? await updatePlayerAction(player.id, values) : await createPlayerAction(values);
      if (!res.success) {
        setServerError(res.error);
        return;
      }
      setOpen(false);
      onSuccess?.(res.data);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <div className="eyebrow">{isEdit ? "Player file" : "New signing"}</div>
          <DialogTitle className="font-display text-4xl font-black uppercase leading-none">
            {isEdit ? `Edit ${player?.displayName || player?.fullName}` : "Sign a player"}
          </DialogTitle>
          <DialogDescription className="font-serif text-base italic">
            {isEdit ? "Update their registration. Stats come from the matches you log." : "Only the name is required — the numbers come from matches."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
            <Field label="Full name *" htmlFor="pf-fullName" error={errors.fullName?.message}>
              <Input id="pf-fullName" autoFocus placeholder="e.g. Antonín Panenka" {...register("fullName")} />
            </Field>
            <Field label="Shirt no." htmlFor="pf-number" error={errors.squadNumber?.message}>
              <Input
                id="pf-number"
                inputMode="numeric"
                placeholder="–"
                className="text-center font-display text-xl font-black"
                {...register("squadNumber", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Card name" htmlFor="pf-display" error={errors.displayName?.message}>
              <Input id="pf-display" placeholder="Shown on the card" {...register("displayName")} />
            </Field>
            <Field label="Team" htmlFor="pf-team" error={errors.team?.message}>
              <Input id="pf-team" placeholder="Your club" {...register("team")} />
            </Field>
          </div>

          <Field label="Position" error={errors.position?.message}>
            <Controller
              control={control}
              name="position"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Position" className="pitch-lines space-y-1.5 rounded-lg border bg-background/40 p-3">
                  {PITCH.map((line, i) => (
                    <div key={i} className="flex justify-center gap-1.5">
                      {line.map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          role="radio"
                          aria-checked={field.value === pos}
                          title={POSITION_LABEL[pos]}
                          onClick={() => field.onChange(pos)}
                          className={cn(
                            "min-w-[3.4rem] rounded-full border px-3 py-1.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] transition-colors",
                            field.value === pos ? "border-primary bg-primary text-primary-foreground" : "bg-card/70 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                          )}
                        >
                          {pos === "UNKNOWN" ? "Any" : pos}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            />
          </Field>

          <Field label="Also plays (optional)">
            <Controller
              control={control}
              name="altPositions"
              render={({ field }) => {
                const value = field.value ?? [];
                // One other position at most: picking a new one replaces the old.
                const toggle = (pos: Exclude<Position, "UNKNOWN">) => field.onChange(value.includes(pos) ? [] : [pos]);
                return (
                  <div>
                    <div role="group" aria-label="Other position they play" className="flex flex-wrap gap-1.5">
                      {PITCH.flat()
                        .filter((p): p is Exclude<Position, "UNKNOWN"> => p !== "UNKNOWN" && p !== watch("position"))
                        .map((pos) => {
                          const on = value.includes(pos);
                          return (
                            <button
                              key={pos}
                              type="button"
                              aria-pressed={on}
                              title={POSITION_LABEL[pos]}
                              onClick={() => toggle(pos)}
                              className={cn(
                                "min-w-[3rem] rounded-full border px-2.5 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] transition-colors",
                                on ? "border-foreground bg-foreground text-background" : "bg-card/70 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                              )}
                            >
                              {pos}
                            </button>
                          );
                        })}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      One other position they can play. Their overall stays at the main position; the profile also shows their rating here.
                    </p>
                  </div>
                );
              }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred foot">
              <Controller
                control={control}
                name="preferredFoot"
                render={({ field }) => (
                  <div role="radiogroup" aria-label="Preferred foot" className="inline-flex rounded-full border bg-background/50 p-0.5">
                    {FEET.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === f.value}
                        onClick={() => field.onChange(f.value)}
                        className={cn(
                          "rounded-full px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em]",
                          field.value === f.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>
            <Field label="Nationality" htmlFor="pf-nat" error={errors.nationality?.message}>
              <Input id="pf-nat" placeholder="Optional" {...register("nationality")} />
            </Field>
          </div>

          <Field label="Photo URL" htmlFor="pf-img" error={errors.imageUrl?.message}>
            <Input id="pf-img" placeholder="https://… (optional, shown on the card)" {...register("imageUrl")} />
          </Field>

          <Field label="Scouting notes" htmlFor="pf-notes" error={errors.notes?.message}>
            <Textarea id="pf-notes" rows={2} placeholder="Optional" {...register("notes")} />
          </Field>

          {serverError && (
            <div role="alert" className="flex gap-2 rounded-md border border-loss/40 bg-loss/10 p-3 text-sm text-loss">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
              {isEdit ? "Save player" : "Sign player"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
