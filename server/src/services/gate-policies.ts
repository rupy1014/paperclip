import { and, eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { gatePolicies } from "@paperclipai/db";
import type { GatePolicyAction, GatePolicyScopeType } from "@paperclipai/shared";
import { notFound, unprocessable } from "../errors.js";

export function gatePolicyService(db: Db) {
  return {
    async create(
      companyId: string,
      input: {
        scopeType: string;
        scopeId: string;
        action: string;
        fulfillerType?: string;
        fulfillerId?: string | null;
        mode?: string;
        isActive?: boolean;
      },
    ) {
      const [row] = await db
        .insert(gatePolicies)
        .values({
          companyId,
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          action: input.action,
          fulfillerType: input.fulfillerType ?? "board",
          fulfillerId: input.fulfillerId ?? null,
          mode: input.mode ?? "blocking",
          isActive: input.isActive ?? true,
        })
        .onConflictDoUpdate({
          target: [
            gatePolicies.companyId,
            gatePolicies.scopeType,
            gatePolicies.scopeId,
            gatePolicies.action,
          ],
          set: {
            fulfillerType: input.fulfillerType ?? "board",
            fulfillerId: input.fulfillerId ?? null,
            mode: input.mode ?? "blocking",
            isActive: input.isActive ?? true,
            updatedAt: new Date(),
          },
        })
        .returning();
      return row;
    },

    async getById(id: string) {
      const [row] = await db
        .select()
        .from(gatePolicies)
        .where(eq(gatePolicies.id, id));
      return row ?? null;
    },

    async list(companyId: string, filters?: { scopeType?: string; scopeId?: string; action?: string; activeOnly?: boolean }) {
      const conditions = [eq(gatePolicies.companyId, companyId)];
      if (filters?.scopeType) conditions.push(eq(gatePolicies.scopeType, filters.scopeType));
      if (filters?.scopeId) conditions.push(eq(gatePolicies.scopeId, filters.scopeId));
      if (filters?.action) conditions.push(eq(gatePolicies.action, filters.action));
      if (filters?.activeOnly !== false) conditions.push(eq(gatePolicies.isActive, true));

      return db
        .select()
        .from(gatePolicies)
        .where(and(...conditions))
        .orderBy(desc(gatePolicies.createdAt));
    },

    async update(id: string, input: Partial<{ fulfillerType: string; fulfillerId: string | null; mode: string; isActive: boolean }>) {
      const existing = await db.select().from(gatePolicies).where(eq(gatePolicies.id, id));
      if (!existing[0]) throw notFound("Gate policy not found");

      const [updated] = await db
        .update(gatePolicies)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(gatePolicies.id, id))
        .returning();
      return updated;
    },

    async remove(id: string) {
      const existing = await db.select().from(gatePolicies).where(eq(gatePolicies.id, id));
      if (!existing[0]) throw notFound("Gate policy not found");
      await db.delete(gatePolicies).where(eq(gatePolicies.id, id));
    },

    /**
     * Check which gates apply for a given action + optional scope.
     * Returns matching active gate policies ordered most-specific-first
     * (agent > project > company).
     */
    async checkGates(
      companyId: string,
      action: GatePolicyAction,
      scope?: { scopeType?: GatePolicyScopeType; scopeId?: string },
    ) {
      const conditions = [
        eq(gatePolicies.companyId, companyId),
        eq(gatePolicies.action, action),
        eq(gatePolicies.isActive, true),
      ];

      const rows = await db
        .select()
        .from(gatePolicies)
        .where(and(...conditions))
        .orderBy(desc(gatePolicies.createdAt));

      // Sort by specificity: agent > project > company
      const scopePriority: Record<string, number> = { agent: 0, project: 1, company: 2 };
      const sorted = rows.sort(
        (a, b) => (scopePriority[a.scopeType] ?? 3) - (scopePriority[b.scopeType] ?? 3),
      );

      // If a specific scope is given, filter to matching or broader scopes
      if (scope?.scopeType && scope?.scopeId) {
        return sorted.filter(
          (g) =>
            (g.scopeType === scope.scopeType && g.scopeId === scope.scopeId) ||
            g.scopeType === "company",
        );
      }

      return sorted;
    },
  };
}
