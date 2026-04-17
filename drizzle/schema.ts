import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Catálogo de máquinas identificadas (auto-alimentado pelo sistema)
 */
export const machines = mysqlTable("machines", {
  id: int("id").autoincrement().primaryKey(),
  // Identificadores da máquina
  machineType: varchar("machineType", { length: 255 }).notNull(), // Ex: "Motor Elétrico Industrial"
  brand: varchar("brand", { length: 255 }).notNull(), // Ex: "WEG"
  model: varchar("model", { length: 255 }).notNull(), // Ex: "W22 Magnet"
  yearOfManufacture: int("yearOfManufacture"), // Ex: 2015
  // Dados técnicos encontrados via Deep Research
  powerConsumption: decimal("powerConsumption", { precision: 10, scale: 2 }), // kW
  energySource: varchar("energySource", { length: 100 }), // "electric", "diesel", "natural_gas"
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }), // % de eficiência
  // Metadados
  dataSource: varchar("dataSource", { length: 255 }), // "deep_research", "manual_input"
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  // Contador de análises que usaram este catálogo
  analysisCount: int("analysisCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;

/**
 * Histórico de análises realizadas por usuários
 */
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  machineId: int("machineId"), // Referência ao catálogo de máquinas
  // Imagem original
  imageUrl: text("imageUrl").notNull(), // URL da imagem no S3
  imageFileName: varchar("imageFileName", { length: 255 }),
  // Dados identificados pela IA
  identifiedMachineType: varchar("identifiedMachineType", { length: 255 }),
  identifiedBrand: varchar("identifiedBrand", { length: 255 }),
  identifiedModel: varchar("identifiedModel", { length: 255 }),
  identifiedYear: int("identifiedYear"),
  // Confiança da identificação (0-100)
  confidenceScore: int("confidenceScore"),
  // Anomalias detectadas
  anomalies: json("anomalies"), // Array de strings com anomalias
  // Status da análise
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Dados de emissões calculadas para cada análise
 */
export const emissions = mysqlTable("emissions", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  // Emissões em kg CO₂/hora
  minEmission: decimal("minEmission", { precision: 10, scale: 4 }).notNull(),
  avgEmission: decimal("avgEmission", { precision: 10, scale: 4 }).notNull(),
  maxEmission: decimal("maxEmission", { precision: 10, scale: 4 }).notNull(),
  // Projeções anuais
  annualProjection: decimal("annualProjection", { precision: 15, scale: 2 }).notNull(), // kg CO₂/ano
  // Projeções futuras com degradação
  year1Projection: decimal("year1Projection", { precision: 15, scale: 2 }),
  year3Projection: decimal("year3Projection", { precision: 15, scale: 2 }),
  year5Projection: decimal("year5Projection", { precision: 15, scale: 2 }),
  // Projeção mensal (array de 12 valores)
  monthlyProjection: json("monthlyProjection"), // Array de 12 números
  // Fórmula utilizada
  formulaUsed: varchar("formulaUsed", { length: 100 }),
  // Dados de entrada da fórmula
  calculationInputs: json("calculationInputs"), // Objeto com parâmetros usados
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Emission = typeof emissions.$inferSelect;
export type InsertEmission = typeof emissions.$inferInsert;

/**
 * Recomendações de descarbonização baseadas em emissões
 */
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  // Dados da recomendação
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "sensor",
    "actuator",
    "filter",
    "maintenance",
    "replacement",
    "optimization",
  ]).notNull(),
  // Impacto esperado
  estimatedCO2ReductionPercent: int("estimatedCO2ReductionPercent"), // % de redução
  estimatedCO2ReductionKg: decimal("estimatedCO2ReductionKg", { precision: 10, scale: 2 }), // kg CO₂/ano
  // Viabilidade
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  timeline: varchar("timeline", { length: 100 }), // Ex: "Imediato", "3 meses", "12 meses"
  estimatedCost: varchar("estimatedCost", { length: 100 }), // Ex: "Baixo", "Médio", "Alto"
  // Detalhes técnicos
  requiredComponents: json("requiredComponents"), // Array de componentes necessários
  implementationSteps: json("implementationSteps"), // Array de passos
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

/**
 * Cache de dados técnicos obtidos via Deep Research
 * Reutilizado para análises futuras da mesma máquina
 */
export const machineDataCache = mysqlTable("machine_data_cache", {
  id: int("id").autoincrement().primaryKey(),
  // Chave de busca (para reutilização)
  searchKey: varchar("searchKey", { length: 255 }).notNull(), // Ex: "WEG W22 Magnet"
  // Dados técnicos encontrados
  powerConsumption: decimal("powerConsumption", { precision: 10, scale: 2 }),
  energySource: varchar("energySource", { length: 100 }),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }),
  // Metadados
  sourceUrls: json("sourceUrls"), // Array de URLs consultadas
  rawData: json("rawData"), // Dados brutos da pesquisa
  // Confiabilidade
  dataQuality: mysqlEnum("dataQuality", ["high", "medium", "low"]).default("medium").notNull(),
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsed: timestamp("lastUsed").defaultNow().onUpdateNow().notNull(),
  usageCount: int("usageCount").default(0).notNull(),
});

export type MachineDataCache = typeof machineDataCache.$inferSelect;
export type InsertMachineDataCache = typeof machineDataCache.$inferInsert;

/**
 * Métricas agregadas por usuário (cache para performance)
 */
export const userMetrics = mysqlTable("user_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Contadores
  totalAnalyses: int("totalAnalyses").default(0).notNull(),
  totalMachines: int("totalMachines").default(0).notNull(),
  // Emissões agregadas
  totalEmissionKgCO2: decimal("totalEmissionKgCO2", { precision: 15, scale: 2 }).default(sql`0`).notNull(),
  // Economia potencial
  potentialReductionKgCO2: decimal("potentialReductionKgCO2", { precision: 15, scale: 2 }).default(sql`0`).notNull(),
  // Progresso Net Zero
  netZeroProgress: int("netZeroProgress").default(0), // % de progresso
  // Timestamp
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type UserMetrics = typeof userMetrics.$inferSelect;
export type InsertUserMetrics = typeof userMetrics.$inferInsert;
