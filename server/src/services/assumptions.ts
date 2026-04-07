import { and, eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { assumptionEntries } from "@paperclipai/db";
import type { AssumptionVerificationStatus } from "@paperclipai/shared";
import { notFound } from "../errors.js";

export function assumptionService(db: Db) {
  return {
    async create(
      companyId: string,
      input: {
        sourceType: string;
        sourceId: string;
        packetId?: string | null;
        agentId?: string | null;
        statement: string;
        confidence?: string;
        sourceDescription?: string | null;
        source?: string | null;
        verificationMethod?: string | null;
      },
    ) {
      const [row] = await db
        .insert(assumptionEntries)
        .values({
          companyId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          packetId: input.packetId ?? null,
          agentId: input.agentId ?? null,
          statement: input.statement,
          confidence: input.confidence ?? "medium",
          sourceDescription: input.sourceDescription ?? null,
          source: input.source ?? null,
          verificationMethod: input.verificationMethod ?? null,
        })
        .returning();
      return row;
    },

    async getById(id: string) {
      const [row] = await db
        .select()
        .from(assumptionEntries)
        .where(eq(assumptionEntries.id, id));
      return row ?? null;
    },

    async list(
      companyId: string,
      filters?: { verificationStatus?: string; sourceType?: string; sourceId?: string; packetId?: string },
    ) {
      const conditions = [eq(assumptionEntries.companyId, companyId)];
      if (filters?.verificationStatus)
        conditions.push(eq(assumptionEntries.verificationStatus, filters.verificationStatus));
      if (filters?.sourceType) conditions.push(eq(assumptionEntries.sourceType, filters.sourceType));
      if (filters?.sourceId) conditions.push(eq(assumptionEntries.sourceId, filters.sourceId));
      if (filters?.packetId) conditions.push(eq(assumptionEntries.packetId, filters.packetId));

      return db
        .select()
        .from(assumptionEntries)
        .where(and(...conditions))
        .orderBy(desc(assumptionEntries.createdAt));
    },

    async update(
      id: string,
      input: Partial<{
        statement: string;
        confidence: string;
        sourceDescription: string | null;
        source: string | null;
        verificationMethod: string | null;
      }>,
    ) {
      const existing = await db.select().from(assumptionEntries).where(eq(assumptionEntries.id, id));
      if (!existing[0]) throw notFound("Assumption entry not found");

      const [updated] = await db
        .update(assumptionEntries)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(assumptionEntries.id, id))
        .returning();
      return updated;
    },

    async verify(id: string, status: "verified" | "falsified") {
      const existing = await db.select().from(assumptionEntries).where(eq(assumptionEntries.id, id));
      if (!existing[0]) throw notFound("Assumption entry not found");

      const [updated] = await db
        .update(assumptionEntries)
        .set({
          verificationStatus: status,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assumptionEntries.id, id))
        .returning();
      return updated;
    },

    async remove(id: string) {
      const existing = await db.select().from(assumptionEntries).where(eq(assumptionEntries.id, id));
      if (!existing[0]) throw notFound("Assumption entry not found");
      await db.delete(assumptionEntries).where(eq(assumptionEntries.id, id));
    },
  };
}
