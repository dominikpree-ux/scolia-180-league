import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChatInterface({ forcedUserType, team }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(forcedUserType || null);
  const [teamData, setTeamData] = useState(team || null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);

      if (!forcedUserType) {
        const teams = await base44.entities.Team.filter({
          captain_email: me?.email,
        });

        if (teams.length > 0) {
          setUserType("team");
          setTeamData(teams[0]);
        } else {
          setUserType("player");
        }
      }
    };
    loadUser();
  }, [forcedUserType]);

  // Fetch all messages
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      if (!user?.id) return [];

      const playerMsgs = await base44.entities.PlayerMessage.filter({});
      const teamMsgs = await base44.entities.TeamMessage.filter({});

      return [...playerMsgs, ...teamMsgs];
    },
    enabled: !!user?.id,
  });

  const myId =
    userType === "team" ? teamData?.id : user?.id;

  // Build conversations
  const conversations = (() => {
    const convMap = new Map();

    messages.forEach((msg) => {
      let key, name, otherId;

      if ("player_from_id" in msg) {
        if (msg.player_from_id === myId) {
          key = `player-${msg.player_to_id}`;
          name = msg.player_to_name;
          otherId = msg.player_to_id;
        } else if (msg.player_to_id === myId) {
          key = `player-${msg.player_from_id}`;
          name = msg.player_from_name;
          otherId = msg.player_from_id;
        }
      } else {
        if (msg.team_from_id === myId) {
          key = `team-${msg.team_to_id}`;
          name = msg.team_to_name;
          otherId = msg.team_to_id;
        } else if (msg.team_to_id === myId) {
          key = `team-${msg.team_from_id}`;
          name = msg.team_from_name;
          otherId = msg.team_from_id;
        }
      }

      if (key && !convMap.has(key)) {
        convMap.set(key, { key, name, otherId });
      }
    });

    return Array.from(convMap.values());
  })();

  // Get messages for selected conversation
  const conversationMessages = selectedConversation
    ? messages.filter((msg) => {
        if ("player_from_id" in msg) {
          if (selectedConversation.startsWith("player-")) {
            const playerId = selectedConversation.replace("player-", "");
            return (
              msg.player_from_id === playerId ||
              msg.player_to_id === playerId
            );
          }
        } else {
          if (selectedConversation.startsWith("team-")) {
            const teamId = selectedConversation.replace("team-", "");
            return (
              msg.team_to_id === teamId ||
              msg.team_from_id === teamId
            );
          }
        }
        return false;
      })
    : [];

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConversation || !user) return;

      const [type, id] = selectedConversation.split("-");

      if (userType === "team") {
        await base44.entities.TeamMessage.create({
          team_from_id: teamData.id,
          team_from_name: teamData.name,
          team_to_id: id,
          team_to_name:
            conversations.find((c) => c.key === selectedConversation)?.name ||
            "Unknown",
          message: messageText,
          status: "pending",
        });
      } else {
        await base44.entities.PlayerMessage.create({
          player_from_id: user.id,
          player_from_name: user.full_name || "Unknown",
          player_to_id: id,
          player_to_name:
            conversations.find((c) => c.key === selectedConversation)?.name ||
            "Unknown",
          message: messageText,
        });
      }

      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  // Subscribe to updates
  useEffect(() => {
    const unsub1 = base44.entities.PlayerMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    });
    const unsub2 = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    });
    return () => {
      unsub
