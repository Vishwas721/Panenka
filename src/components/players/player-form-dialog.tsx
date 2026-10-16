"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPlayerSchema,
  type CreatePlayerInput,
} from "@/lib/validation";
import {
  createPlayerAction,
  updatePlayerAction,
} from "@/app/actions/players";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Player, Position, PreferredFoot } from "@prisma/client";
import { AlertCircle, Loader2 } from "lucide-react";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "GK", label: "GK — Goalkeeper" },
  { value: "CB", label: "CB — Centre-Back" },
  { value: "LB", label: "LB — Left-Back" },
  { value: "RB", label: "RB — Right-Back" },
  { value: "CDM", label: "CDM — Central Defensive Midfielder" },
  { value: "CM", label: "CM — Central Midfielder" },
  { value: "CAM", label: "CAM — Central Attacking Midfielder" },
  { value: "LW", label: "LW — Left Winger" },
  { value: "RW", label: "RW — Right Winger" },
  { value: "ST", label: "ST — Striker" },
  { value: "UNKNOWN", label: "UNKNOWN — Unspecified" },
];

const PREFERRED_FEET: { value: PreferredFoot; label: string }[] = [
  { value: "RIGHT", label: "Right" },
  { value: "LEFT", label: "Left" },
  { value: "BOTH", label: "Both" },
  { value: "UNKNOWN", label: "Unknown" },
];

export interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
  onSuccess?: (player: Player) => void;
}

export function PlayerFormDialog({
  open,
  onOpenChange,
  player,
  onSuccess,
}: PlayerFormDialogProps) {
  const isEdit = Boolean(player);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: CreatePlayerInput = React.useMemo(() => {
    return {
      fullName: player?.fullName ?? "",
      displayName: player?.displayName ?? "",
      position: player?.position ?? "UNKNOWN",
      preferredFoot: player?.preferredFoot ?? "UNKNOWN",
      squadNumber: player?.squadNumber ?? null,
      team: player?.team ?? "",
      nationality: player?.nationality ?? "",
      imageUrl: player?.imageUrl ?? "",
      notes: player?.notes ?? "",
    };
  }, [player]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlayerInput>({
    resolver: zodResolver(createPlayerSchema) as any,
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);
    setServerError(null);
  }, [defaultValues, reset, open]);

  const onSubmit = async (values: CreatePlayerInput) => {
    setServerError(null);
    try {
      if (isEdit && player) {
        const res = await updatePlayerAction(player.id, values);
        if (!res.success) {
          setServerError(res.error);
          return;
        }
        onOpenChange(false);
        onSuccess?.(res.data);
      } else {
        const res = await createPlayerAction(values);
        if (!res.success) {
          setServerError(res.error);
          return;
        }
        onOpenChange(false);
        onSuccess?.(res.data);
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? "Edit Player" : "Add New Player"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update player profile for ${player?.fullName}.`
              : "Register a new player in your squad."}
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Full Name & Display Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Mateo Rossi"
                aria-invalid={Boolean(errors.fullName)}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g. Rossi"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>
          </div>

          {/* Position & Preferred Foot */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <Controller
                control={control}
                name="position"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val as Position)}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.position && (
                <p className="text-xs text-destructive">
                  {errors.position.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preferredFoot">Preferred Foot</Label>
              <Controller
                control={control}
                name="preferredFoot"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(val as PreferredFoot)
                    }
                  >
                    <SelectTrigger id="preferredFoot">
                      <SelectValue placeholder="Select foot" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFERRED_FEET.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.preferredFoot && (
                <p className="text-xs text-destructive">
                  {errors.preferredFoot.message}
                </p>
              )}
            </div>
          </div>

          {/* Squad Number & Team */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="squadNumber">Squad Number</Label>
              <Input
                id="squadNumber"
                type="number"
                min={1}
                max={99}
                placeholder="1–99"
                {...register("squadNumber", {
                  setValueAs: (v) =>
                    v === "" || v === null || Number.isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
              />
              {errors.squadNumber && (
                <p className="text-xs text-destructive">
                  {errors.squadNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="team">Team / Club</Label>
              <Input
                id="team"
                placeholder="e.g. Panenka FC"
                {...register("team")}
              />
              {errors.team && (
                <p className="text-xs text-destructive">
                  {errors.team.message}
                </p>
              )}
            </div>
          </div>

          {/* Nationality & Image URL */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                placeholder="e.g. Argentina"
                {...register("nationality")}
              />
              {errors.nationality && (
                <p className="text-xs text-destructive">
                  {errors.nationality.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Image URL (http/https)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/avatar.jpg"
                {...register("imageUrl")}
              />
              {errors.imageUrl && (
                <p className="text-xs text-destructive">
                  {errors.imageUrl.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Scouting reports, medical notes, or background context..."
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">
                {errors.notes.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create Player"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
