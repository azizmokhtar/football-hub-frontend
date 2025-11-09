import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { teamsService } from "@/services/teams.service";
import { useAuthUser } from "@/stores/auth.store";
import type { TeamMember } from "@/types";

// -------- Formation definitions (normalized coordinates 0..1, y=0 is your goal) -------
type Slot = { id: string; x: number; y: number; line: "GK" | "DF" | "MF" | "FW" };
type FormationKey =
  | "4-4-2"
  | "4-3-3"
  | "3-5-2"
  | "4-2-3-1"
  | "4-1-4-1"
  | "5-3-2";

const makeGK = (): Slot[] => [{ id: "GK", x: 0.5, y: 0.05, line: "GK" }];

const FORMATIONS: Record<FormationKey, Slot[]> = {
  "4-4-2": [
    ...makeGK(),
    // DF
    { id: "LB", x: 0.18, y: 0.22, line: "DF" },
    { id: "LCB", x: 0.36, y: 0.22, line: "DF" },
    { id: "RCB", x: 0.64, y: 0.22, line: "DF" },
    { id: "RB", x: 0.82, y: 0.22, line: "DF" },
    // MF
    { id: "LM", x: 0.20, y: 0.46, line: "MF" },
    { id: "LCM", x: 0.38, y: 0.44, line: "MF" },
    { id: "RCM", x: 0.62, y: 0.44, line: "MF" },
    { id: "RM", x: 0.80, y: 0.46, line: "MF" },
    // FW
    { id: "LS", x: 0.42, y: 0.72, line: "FW" },
    { id: "RS", x: 0.58, y: 0.72, line: "FW" },
  ],
  "4-3-3": [
    ...makeGK(),
    { id: "LB", x: 0.18, y: 0.22, line: "DF" },
    { id: "LCB", x: 0.36, y: 0.22, line: "DF" },
    { id: "RCB", x: 0.64, y: 0.22, line: "DF" },
    { id: "RB", x: 0.82, y: 0.22, line: "DF" },
    { id: "LCM", x: 0.36, y: 0.44, line: "MF" },
    { id: "CDM", x: 0.50, y: 0.40, line: "MF" },
    { id: "RCM", x: 0.64, y: 0.44, line: "MF" },
    { id: "LW", x: 0.25, y: 0.72, line: "FW" },
    { id: "ST", x: 0.50, y: 0.76, line: "FW" },
    { id: "RW", x: 0.75, y: 0.72, line: "FW" },
  ],
  "3-5-2": [
    ...makeGK(),
    { id: "LCB", x: 0.32, y: 0.22, line: "DF" },
    { id: "CB", x: 0.50, y: 0.20, line: "DF" },
    { id: "RCB", x: 0.68, y: 0.22, line: "DF" },
    { id: "LM", x: 0.18, y: 0.44, line: "MF" },
    { id: "LCM", x: 0.36, y: 0.44, line: "MF" },
    { id: "CAM", x: 0.50, y: 0.54, line: "MF" },
    { id: "RCM", x: 0.64, y: 0.44, line: "MF" },
    { id: "RM", x: 0.82, y: 0.44, line: "MF" },
    { id: "LS", x: 0.44, y: 0.76, line: "FW" },
    { id: "RS", x: 0.56, y: 0.76, line: "FW" },
  ],
  "4-2-3-1": [
    ...makeGK(),
    { id: "LB", x: 0.18, y: 0.22, line: "DF" },
    { id: "LCB", x: 0.36, y: 0.22, line: "DF" },
    { id: "RCB", x: 0.64, y: 0.22, line: "DF" },
    { id: "RB", x: 0.82, y: 0.22, line: "DF" },
    { id: "LDM", x: 0.42, y: 0.36, line: "MF" },
    { id: "RDM", x: 0.58, y: 0.36, line: "MF" },
    { id: "LAM", x: 0.36, y: 0.52, line: "MF" },
    { id: "CAM", x: 0.50, y: 0.56, line: "MF" },
    { id: "RAM", x: 0.64, y: 0.52, line: "MF" },
    { id: "ST", x: 0.50, y: 0.78, line: "FW" },
  ],
  "4-1-4-1": [
    ...makeGK(),
    { id: "LB", x: 0.18, y: 0.22, line: "DF" },
    { id: "LCB", x: 0.36, y: 0.22, line: "DF" },
    { id: "RCB", x: 0.64, y: 0.22, line: "DF" },
    { id: "RB", x: 0.82, y: 0.22, line: "DF" },
    { id: "CDM", x: 0.50, y: 0.36, line: "MF" },
    { id: "LM", x: 0.20, y: 0.50, line: "MF" },
    { id: "LCM", x: 0.38, y: 0.50, line: "MF" },
    { id: "RCM", x: 0.62, y: 0.50, line: "MF" },
    { id: "RM", x: 0.80, y: 0.50, line: "MF" },
    { id: "ST", x: 0.50, y: 0.78, line: "FW" },
  ],
  "5-3-2": [
    ...makeGK(),
    { id: "LWB", x: 0.16, y: 0.26, line: "DF" },
    { id: "LCB", x: 0.32, y: 0.20, line: "DF" },
    { id: "CB", x: 0.50, y: 0.18, line: "DF" },
    { id: "RCB", x: 0.68, y: 0.20, line: "DF" },
    { id: "RWB", x: 0.84, y: 0.26, line: "DF" },
    { id: "LCM", x: 0.38, y: 0.44, line: "MF" },
    { id: "CM", x: 0.50, y: 0.48, line: "MF" },
    { id: "RCM", x: 0.62, y: 0.44, line: "MF" },
    { id: "LS", x: 0.44, y: 0.76, line: "FW" },
    { id: "RS", x: 0.56, y: 0.76, line: "FW" },
  ],
};

// ------------- Small helper UI bits ----------------
function PlayerChip({ p }: { p: TeamMember }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center">
        {p.profile_picture ? (
          <img src={p.profile_picture} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-gray-700 font-semibold">
            {(p.first_name?.[0] ?? "?")}{p.last_name?.[0] ?? ""}
          </span>
        )}
      </div>
      <div className="leading-tight">
        <div className="text-sm font-medium">{p.first_name} {p.last_name}</div>
        <div className="text-[11px] text-gray-500">
          #{p.jersey_number ?? "—"} • {p.position ?? "—"}
        </div>
      </div>
    </div>
  );
}

type DropPayload = { type: "player"; playerId: number };

// ------------- Pitch Slot --------------
function PitchSlot({
  slot,
  assigned,
  onDropPlayer,
  onClear,
}: {
  slot: Slot;
  assigned?: TeamMember;
  onDropPlayer: (playerId: number, slotId: string) => void;
  onClear: (slotId: string) => void;
}) {
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as DropPayload;
      if (data?.type === "player") onDropPlayer(data.playerId, slot.id);
    } catch {}
  };

  const base = "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-sm border";
  const size = assigned ? "w-48 p-2 bg-white" : "w-12 h-12 bg-white/80 backdrop-blur";
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ left: `${slot.x * 100}%`, top: `${(1 - slot.y) * 100}%` }}
      className={`${base} ${size} flex items-center justify-center`}
    >
      {assigned ? (
        <div className="relative w-full">
          <PlayerChip p={assigned} />
          <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
            <span className="px-1 py-0.5 rounded bg-gray-100">{slot.id}</span>
            <button onClick={() => onClear(slot.id)} className="hover:text-red-600">Remove</button>
          </div>
        </div>
      ) : (
        <span className="text-[10px] font-medium text-gray-600">{slot.id}</span>
      )}
    </div>
  );
}

// ------------- Bench Draggable card --------------
function BenchCard({ p }: { p: TeamMember }) {
  const onDragStart = (e: React.DragEvent) => {
    const payload: DropPayload = { type: "player", playerId: p.id };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    // “move” cursor feel
    e.dataTransfer.effectAllowed = "move";
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="rounded-xl border p-2 bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing"
      title="Drag onto the pitch"
    >
      <PlayerChip p={p} />
    </div>
  );
}

// ------------- Main Page --------------
export default function LineupBuilderPage() {
  const user = useAuthUser();
  const { data: myTeam } = useQuery({ queryKey: ["my-team"], queryFn: teamsService.myTeam });

  const teamId = myTeam?.id ?? null;
  const { data: squad } = useQuery({
    enabled: !!teamId,
    queryKey: ["team", teamId, "squad"],
    queryFn: () => teamsService.getSquad(teamId!),
    staleTime: 60_000,
  });

  const players: TeamMember[] = squad?.players ?? [];

  const [formation, setFormation] = React.useState<FormationKey>("4-3-3");
  const slots = React.useMemo(() => FORMATIONS[formation], [formation]);

  // assigned[slotId] = playerId
  const [assigned, setAssigned] = React.useState<Record<string, number | null>>({});

  React.useEffect(() => {
    // Reset when formation changes (keeps GK if same id exists)
    setAssigned((prev) => {
      const next: Record<string, number | null> = {};
      for (const s of slots) next[s.id] = prev[s.id] ?? null;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation]);

  const onDropPlayer = (playerId: number, slotId: string) => {
    // Remove from any previous slot, then assign to target
    setAssigned((prev) => {
      const copy: Record<string, number | null> = { ...prev };
      for (const k of Object.keys(copy)) if (copy[k] === playerId) copy[k] = null;
      copy[slotId] = playerId;
      return copy;
    });
  };

  const clearSlot = (slotId: string) => {
    setAssigned((prev) => ({ ...prev, [slotId]: null }));
  };

  const assignedPlayerIds = new Set(Object.values(assigned).filter(Boolean) as number[]);
  const bench = players.filter((p) => !assignedPlayerIds.has(p.id));

  // Small helper to map slot->player
  const assignedPlayersBySlot: Record<string, TeamMember | undefined> = {};
  for (const [slotId, pid] of Object.entries(assigned)) {
    if (!pid) continue;
    assignedPlayersBySlot[slotId] = players.find((p) => p.id === pid);
  }

  const saveLineup = () => {
    // For now: print to console. Replace with POST to your API later.
    const payload = {
      team: myTeam?.id,
      formation,
      assignments: Object.fromEntries(
        Object.entries(assigned).map(([slotId, pid]) => [slotId, pid ?? null])
      ),
    };
    console.log("LINEUP:", payload);
    alert("Lineup captured in console. Hook this to your API when ready.");
  };

  return (
    <Page title="Lineup Builder" subtitle={myTeam?.name ?? "—"}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">Formation:</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FORMATIONS) as FormationKey[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={formation === k ? "primary" : "secondary"}
              onClick={() => setFormation(k)}
            >
              {k}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => setAssigned({})}>Clear</Button>
          <Button onClick={saveLineup}>Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pitch */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="relative h-[70vh] min-h-[520px] rounded-xl">
            {/* Pitch background */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05), rgba(0,0,0,0.05)), repeating-linear-gradient(0deg, #2f7d32 0 40px, #2a6f2d 40px 80px)",
              }}
            />
            {/* Pitch markings (half) */}
            <svg className="absolute inset-0 w-full h-full rotate-180">
                <rect x="2%" y="2%" width="96%" height="96%" rx="18" ry="18" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
              {/* Penalty box & goal area */}
              <rect x="28%" y="2%" width="44%" height="16%" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
              <rect x="38%" y="2%" width="24%" height="8%" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
              {/* Penalty spot + arc */}
              <circle cx="50%" cy="14%" r="2" fill="white" opacity="0.8" />
              <path d="M 42% 18% A 8% 8% 0 0 0 58% 18%" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
              {/* Center arc at halfway */}
              <path d="M 50% 50% m -7% 0 a 7% 7% 0 1 0 14 0 a 7% 7% 0 1 0 -14 0" fill="none" stroke="white" strokeWidth="2" opacity="0.25"/>
            </svg>

            {/* Slots */}
            {slots.map((s) => (
              <PitchSlot
                key={s.id}
                slot={s}
                assigned={assignedPlayersBySlot[s.id]}
                onDropPlayer={onDropPlayer}
                onClear={clearSlot}
              />
            ))}
          </div>
        </Card>

        {/* Bench */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">Bench</h2>
          <div className="grid gap-2 max-h-[70vh] overflow-auto pr-1">
            {bench.length ? bench.map((p) => <BenchCard key={p.id} p={p} />) : (
              <div className="text-sm text-gray-500">All players are on the pitch.</div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
