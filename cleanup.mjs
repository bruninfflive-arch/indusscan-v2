import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function cleanup() {
  try {
    console.log("Iniciando limpeza do banco de dados...");
    
    // Deletar recomendações
    await db.delete(schema.recommendations);
    console.log("✓ Recomendações deletadas");
    
    // Deletar emissões
    await db.delete(schema.emissions);
    console.log("✓ Emissões deletadas");
    
    // Deletar análises
    await db.delete(schema.analyses);
    console.log("✓ Análises deletadas");
    
    // Deletar máquinas
    await db.delete(schema.machines);
    console.log("✓ Máquinas deletadas");
    
    // Resetar métricas
    await db.update(schema.userMetrics).set({
      totalAnalyses: 0,
      totalMachines: 0,
      totalEmissionKgCO2: 0,
    });
    console.log("✓ Métricas resetadas");
    
    console.log("\n✅ Limpeza concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro durante limpeza:", error);
    process.exit(1);
  }
}

cleanup();
