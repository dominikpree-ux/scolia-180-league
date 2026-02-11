import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, X, Check } from "lucide-react";

export default function PlayerRequestManager() {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-player-requests"],
    queryFn: () => base44.entities.PlayerRequest.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlayerRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-player-requests"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-player-requests"] });
    },
  });

  const startEdit = (request) => {
    setEditingId(request.id);
    setEditForm({
      player_name: request.player_name || "",
      message: request.message || "",
      team_response: request.team_response || "",
      status: request.status || "pending",
    });
  };

  const saveEdit = (id) => {
    updateMutation.mutate({ id, data: editForm });
  };

  if (isLoading) {
    return <div className="text-gray-400">Lade Spielersuchen...</div>;
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-white">Spielersuchen Verwaltung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Keine Spielersuchen vorhanden</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]">
              {editingId === request.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Spielername</label>
                    <Input
                      value={editForm.player_name}
                      onChange={(e) => setEditForm({ ...editForm, player_name: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nachricht</label>
                    <Textarea
                      value={editForm.message}
                      onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Team Antwort</label>
                    <Textarea
                      value={editForm.team_response}
                      onChange={(e) => setEditForm({ ...editForm, team_response: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-white"
                    >
                      <option value="pending">Ausstehend</option>
                      <option value="accepted">Akzeptiert</option>
                      <option value="declined">Abgelehnt</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(request.id)}
                      className="bg-green-600 hover:bg-green-500"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Speichern
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      className="text-gray-400"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{request.player_name}</span>
                        <Badge
                          className={
                            request.status === "accepted"
                              ? "bg-green-600"
                              : request.status === "declined"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                          }
                        >
                          {request.status === "accepted"
                            ? "Akzeptiert"
                            : request.status === "declined"
                            ? "Abgelehnt"
                            : "Ausstehend"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">→ {request.team_name}</div>
                      <div className="text-xs text-gray-500">{request.player_email}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(request)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Spielersuche wirklich löschen?")) {
                            deleteMutation.mutate(request.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    <div className="font-medium text-xs text-gray-500 mb-1">Nachricht:</div>
                    <p>{request.message}</p>
                  </div>
                  {request.team_response && (
                    <div className="mt-2 text-sm text-gray-300">
                      <div className="font-medium text-xs text-gray-500 mb-1">Team Antwort:</div>
                      <p>{request.team_response}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-2">
                    Erstellt: {new Date(request.created_date).toLocaleDateString("de-DE")}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}