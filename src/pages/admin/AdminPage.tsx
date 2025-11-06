import * as React from 'react';
import { Page, Card } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  return (
    <Page title="Admin Control Panel" subtitle="Manage teams, users and quick actions.">
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[1fr] gap-6">
        

        <Card  className="max-w-card max-h-card overflow-y-auto">
          <h2 className="font-semibold mb-2">Teams</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create teams and manage their details.
          </p>
          <div className="flex gap-2">
            <Button>New Team</Button>
            <Button variant="secondary">View All</Button>
          </div>
        </Card>

        <Card  className="max-w-card max-h-card overflow-y-auto">
          <h2 className="font-semibold mb-2">Users</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add users and assign them to teams with roles and positions.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive">New User</Button>
            <Button variant="secondary">View All</Button>
          </div>
        </Card>
      </section>

      <Card  className="max-w-card max-h-card overflow-y-auto">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <ul className="list-disc ml-5 space-y-2 text-sm text-gray-700">
          <li>Assign a coach to a team</li>
          <li>Move a player between teams</li>
          <li>Promote/demote roles (PLAYER/COACH/STAFF/ADMIN)</li>
        </ul>
      </Card>
    </Page>
  );
}
