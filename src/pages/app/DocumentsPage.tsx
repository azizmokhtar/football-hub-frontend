import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Card } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { documentsService } from "@/services/documents.service";
import type { Document } from "@/types";
import { useAuthUser } from "@/stores/auth.store";
import { format } from "date-fns";

export default function DocumentsPage() {
  const user = useAuthUser();
  const qc = useQueryClient();
  const { data: docs, isLoading } = useQuery({ queryKey: ["documents"], queryFn: documentsService.list });
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: (form: FormData) => documentsService.upload(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: (id: number) => documentsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const canManage = user?.role === "COACH" || user?.role === "ADMIN" || user?.role === "STAFF";

  const grouped = useMemo(() => {
    const byType = new Map<string, Document[]>();
    (docs ?? []).forEach((d) => {
      const key = d.file_type || "FILE";
      byType.set(key, [...(byType.get(key) ?? []), d]);
    });
    return Array.from(byType.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [docs]);

  const onUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    const form = new FormData();
    form.append("title", title.trim());
    form.append("file", file);
    // backend: team is auto-set for coach/staff; admin can append "team" ID if needed
    upload(form);
  };

  return (
    <Page title="Documents" subtitle="Browse and manage shared files">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          {isLoading ? (
            <div className="py-8 text-sm text-gray-500">Loading documents…</div>
          ) : grouped.length ? (
            <div className="space-y-6">
              {grouped.map(([type, list]) => (
                <div key={type}>
                  <div className="text-xs uppercase text-gray-500 mb-2">{type}</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {list.map((d) => (
                      <div key={d.id} className="rounded-lg border p-3 flex items-start justify-between">
                        <div>
                          <div className="font-medium">{d.title}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(d.uploaded_at), "dd MMM yyyy HH:mm")} • {d.team_name ?? "—"}
                          </div>
                          {d.description && (
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">{d.description}</p>
                          )}
                          <a
                            href={d.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Open file
                          </a>
                        </div>
                        {canManage && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={removing}
                            onClick={() => remove(d.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-sm text-gray-500">No documents.</div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-3">Upload</h2>
          {canManage ? (
            <form onSubmit={onUpload} className="space-y-4">
              <div>
                <Label htmlFor="doc-title">Title</Label>
                <Input
                  id="doc-title"
                  placeholder="e.g., Travel Plan – Matchday 12"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="doc-file">File</Label>
                <input
                  ref={fileRef}
                  id="doc-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm"
                />
              </div>
              <Button type="submit" disabled={!file || !title.trim() || uploading}>
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </form>
          ) : (
            <div className="text-sm text-gray-500">Only staff/coaches/admins can upload.</div>
          )}
        </Card>
      </div>
    </Page>
  );
}
