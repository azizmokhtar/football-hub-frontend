import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usersService } from "@/services/users.service";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function AdminUsersListPage() {
  const [q, setQ] = useState("");
  const { data: users, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => usersService.adminListAll(q || undefined),
  });

  return (
    <Page title="Users" subtitle="All users across teams">
      <Card className="mb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); refetch(); }}
          className="flex gap-2"
        >
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" disabled={isFetching}>Search</Button>
          <Button asChild><Link to="/app/admin/users/new">New User</Link></Button>
        </form>
      </Card>

      <Card>
        {isLoading ? (
          <div className="py-8 text-sm text-gray-500">Loading users…</div>
        ) : users?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Team</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        to={`/app/admin/users/${u.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {u.first_name} {u.last_name}
                      </Link>
                    </td>

                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2 pr-4">{u.team_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-sm text-gray-500">No users found.</div>
        )}
      </Card>
    </Page>
  );
}
