import { useQuery } from "@tanstack/react-query";
import { packetsApi } from "../api/packets";
import { agentsApi } from "../api/agents";
import { issuesApi } from "../api/issues";
import { queryKeys } from "../lib/queryKeys";
import { PacketCard } from "./PacketCard";
import { Package } from "lucide-react";
import type { ProductionPacket } from "@paperclipai/shared";
import { useMemo } from "react";

export function ProjectPacketsList({
  projectId,
  companyId,
}: {
  projectId: string;
  companyId: string;
}) {
  const { data: packets, isLoading } = useQuery({
    queryKey: queryKeys.packets.listByProject(companyId, projectId),
    queryFn: () => packetsApi.list(companyId, { projectId }),
    enabled: !!companyId && !!projectId,
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: issues } = useQuery({
    queryKey: queryKeys.issues.listByProject(companyId, projectId),
    queryFn: () => issuesApi.list(companyId, { projectId }),
    enabled: !!companyId && !!projectId,
  });

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents ?? []) map.set(agent.id, agent.name);
    return map;
  }, [agents]);

  const issueById = useMemo(() => {
    const map = new Map<string, { title: string; identifier: string | null }>();
    for (const issue of issues ?? []) map.set(issue.id, { title: issue.title, identifier: issue.identifier ?? null });
    return map;
  }, [issues]);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">Loading packets…</div>
    );
  }

  if (!packets?.length) {
    return (
      <div className="py-12 text-center">
        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No production packets yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a packet from an issue to group its documents and work products into an execution unit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {packets.map((packet: ProductionPacket) => {
        const issue = issueById.get(packet.issueId);
        return (
          <PacketCard
            key={packet.id}
            packet={packet}
            agentName={packet.ownerAgentId ? agentNameById.get(packet.ownerAgentId) : undefined}
            issueTitle={issue?.title}
            issueIdentifier={issue?.identifier ?? undefined}
          />
        );
      })}
    </div>
  );
}
