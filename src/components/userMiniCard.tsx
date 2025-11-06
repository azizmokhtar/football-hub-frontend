// components/UserMiniCard.tsx
import { Avatar } from "@/components/Avatar";
import { useAuthUser } from "@/stores/auth.store";

function initials(first?: string | null, last?: string | null, email?: string | null) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f || l) return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || "U";
  const u = (email ?? "").split("@")[0] ?? "";
  return (u[0] ?? "U").toUpperCase();
}

export function UserMiniCard() {
  const user = useAuthUser();
  const first = user?.first_name ?? user?.firstName;
  const last = user?.last_name ?? user?.lastName;
  const email = user?.email ?? "—";
  const role = (user?.role ?? "—").toString().toLowerCase();

  // If later you have user?.avatar_url, pass it to Avatar as src
  return (
    <div className="flex items-center gap-3">
      <Avatar src={user?.avatar_url} alt={`${first ?? ""} ${last ?? ""}`}>
        {initials(first, last, email)}
      </Avatar>

      <div className="min-w-0">
        <div className="truncate font-medium text-white">
          {(first || last) ? `${first ?? ""} ${last ?? ""}`.trim() : (email.split("@")[0] ?? "User")}
        </div>
        <div className="truncate text-xs text-gray-400">{email}</div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">{role}</div>
      </div>
    </div>
  );
}
