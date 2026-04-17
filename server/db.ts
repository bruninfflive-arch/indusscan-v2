import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  machines,
  analyses,
  emissions,
  recommendations,
  machineDataCache,
  userMetrics,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// MACHINE OPERATIONS
// ============================================================================

export async function getMachineByIdentifiers(
  brand: string,
  model: string,
  machineType: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(machines)
    .where(
      and(
        eq(machines.brand, brand),
        eq(machines.model, model),
        eq(machines.machineType, machineType)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMachines() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(machines);
    return result;
  } catch (error) {
    console.error("[Database] Erro ao buscar máquinas:", error);
    return [];
  }
}

export async function createOrUpdateMachine(machineData: {
  machineType: string;
  brand: string;
  model: string;
  yearOfManufacture?: number;
  powerConsumption?: number | string;
  energySource?: string;
  efficiency?: number | string;
  dataSource: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getMachineByIdentifiers(
    machineData.brand,
    machineData.model,
    machineData.machineType
  );

  if (existing) {
    // Atualizar máquina existente
    await db
      .update(machines)
      .set({
        ...machineData,
        analysisCount: existing.analysisCount + 1,
      } as any)
      .where(eq(machines.id, existing.id));
    return existing.id;
  } else {
    // Criar nova máquina
    const result = await db.insert(machines).values({
      ...machineData,
      analysisCount: 1,
    } as any);
    return (result as any).insertId as number;
  }
}

// ============================================================================
// ANALYSIS OPERATIONS
// ============================================================================

export async function createAnalysis(analysisData: {
  userId: number;
  machineId?: number;
  imageUrl: string;
  imageFileName?: string;
  identifiedMachineType?: string;
  identifiedBrand?: string;
  identifiedModel?: string;
  identifiedYear?: number;
  confidenceScore?: number;
  anomalies?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(analyses).values({
    ...analysisData,
    status: "processing",
  } as any);

  return (result as any).insertId as number;
}

export async function updateAnalysisStatus(
  analysisId: number,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(analyses)
    .set({
      status,
      errorMessage,
      completedAt: status === "completed" ? new Date() : undefined,
    })
    .where(eq(analyses.id, analysisId));
}

export async function getAnalysisByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt));
}

export async function getAnalysisById(analysisId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, analysisId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function deleteAnalysis(analysisId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deletar emissões associadas
  await db.delete(emissions).where(eq(emissions.analysisId, analysisId));

  // Deletar recomendações associadas
  await db
    .delete(recommendations)
    .where(eq(recommendations.analysisId, analysisId));

  // Deletar análise
  await db.delete(analyses).where(eq(analyses.id, analysisId));
}

// ============================================================================
// EMISSIONS OPERATIONS
// ============================================================================

export async function createEmissions(emissionData: {
  analysisId: number;
  minEmission: string | number;
  avgEmission: string | number;
  maxEmission: string | number;
  annualProjection: string | number;
  year1Projection?: string | number;
  year3Projection?: string | number;
  year5Projection?: string | number;
  monthlyProjection?: number[];
  formulaUsed: string;
  calculationInputs?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emissions).values(emissionData as any);
  return (result as any).insertId as number;
}

export async function getEmissionsByAnalysisId(analysisId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(emissions)
    .where(eq(emissions.analysisId, analysisId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// RECOMMENDATIONS OPERATIONS
// ============================================================================

export async function createRecommendations(
  recommendationsList: Array<{
    analysisId: number;
    title: string;
    description: string;
    category: "sensor" | "actuator" | "filter" | "maintenance" | "replacement" | "optimization";
    estimatedCO2ReductionPercent?: number;
    estimatedCO2ReductionKg?: string | number;
    priority: "low" | "medium" | "high";
    timeline?: string;
    estimatedCost?: string;
    requiredComponents?: string[];
    implementationSteps?: string[];
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(recommendations).values(recommendationsList as any);
}

export async function getRecommendationsByAnalysisId(analysisId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(recommendations)
    .where(eq(recommendations.analysisId, analysisId));
}

// ============================================================================
// MACHINE DATA CACHE OPERATIONS
// ============================================================================

export async function getMachineDataFromCache(searchKey: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(machineDataCache)
    .where(eq(machineDataCache.searchKey, searchKey))
    .limit(1);

  if (result.length > 0) {
    const cache = result[0];
    // Atualizar usageCount e lastUsed
    await db
      .update(machineDataCache)
      .set({
        usageCount: cache.usageCount + 1,
        lastUsed: new Date(),
      })
      .where(eq(machineDataCache.id, cache.id));

    return cache;
  }

  return undefined;
}

export async function saveMachineDataToCache(cacheData: {
  searchKey: string;
  powerConsumption?: number;
  energySource?: string;
  efficiency?: number;
  sourceUrls?: string[];
  rawData?: Record<string, unknown>;
  dataQuality: "high" | "medium" | "low";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getMachineDataFromCache(cacheData.searchKey);

  if (existing) {
    // Atualizar cache existente
    await db
      .update(machineDataCache)
      .set({
        ...cacheData,
        usageCount: existing.usageCount + 1,
      } as any)
      .where(eq(machineDataCache.id, existing.id));
  } else {
    // Criar novo cache
    await db.insert(machineDataCache).values({
      ...cacheData,
      usageCount: 1,
    } as any);
  }
}

// ============================================================================
// USER METRICS OPERATIONS
// ============================================================================

export async function getUserMetrics(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userMetrics)
    .where(eq(userMetrics.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserMetrics(
  userId: number,
  metrics: Partial<{
    totalAnalyses: number;
    totalMachines: number;
    totalEmissionKgCO2: string | number;
    potentialReductionKgCO2: string | number;
    netZeroProgress: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserMetrics(userId);

  if (existing) {
    await db
      .update(userMetrics)
      .set(metrics as any)
      .where(eq(userMetrics.userId, userId));
  } else {
    const insertData: any = {
      userId,
      totalAnalyses: metrics.totalAnalyses || 0,
      totalMachines: metrics.totalMachines || 0,
      totalEmissionKgCO2: metrics.totalEmissionKgCO2 || 0,
      potentialReductionKgCO2: metrics.potentialReductionKgCO2 || 0,
      netZeroProgress: metrics.netZeroProgress || 0,
    };
    await db.insert(userMetrics).values(insertData);
  }
}

// ============================================================================
// AGGREGATION OPERATIONS
// ============================================================================

export async function getAnnualEmissionsData(userId: number, year?: number) {
  const db = await getDb();
  if (!db) return [];

  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(`${targetYear}-01-01`);
  const endDate = new Date(`${targetYear}-12-31`);

  return db
    .select()
    .from(emissions)
    .innerJoin(analyses, eq(emissions.analysisId, analyses.id))
    .where(
      and(
        eq(analyses.userId, userId),
        gte(analyses.createdAt, startDate),
        lte(analyses.createdAt, endDate)
      )
    )
    .orderBy(desc(analyses.createdAt));
}

export async function getTotalEmissionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(emissions)
    .innerJoin(analyses, eq(emissions.analysisId, analyses.id))
    .where(eq(analyses.userId, userId));

  return result.reduce((sum, row) => sum + Number(row.emissions.annualProjection), 0);
}
