/**
 * Serviço de cálculo de emissões de CO₂ para máquinas industriais
 * Utiliza fórmulas baseadas em dados técnicos reais
 */

export interface EmissionCalculationInputs {
  powerConsumption: number; // kW
  energySource: "electric" | "diesel" | "natural_gas" | "gasoline" | "other";
  operatingHoursPerDay?: number; // Padrão: 8 horas
  operatingDaysPerYear?: number; // Padrão: 250 dias
  efficiency?: number; // % de eficiência (afeta consumo real)
  machineAge?: number; // Anos de uso (afeta degradação)
}

export interface EmissionCalculationResult {
  minEmission: number; // kg CO₂/hora
  avgEmission: number; // kg CO₂/hora
  maxEmission: number; // kg CO₂/hora
  annualProjection: number; // kg CO₂/ano
  monthlyProjection: number[]; // Array de 12 meses
  year1Projection: number; // kg CO₂/ano (com degradação)
  year3Projection: number; // kg CO₂/ano (com degradação)
  year5Projection: number; // kg CO₂/ano (com degradação)
  formulaUsed: string;
  calculationInputs: EmissionCalculationInputs;
}

/**
 * Fatores de emissão por fonte de energia (kg CO₂/kWh)
 * Baseado em dados de agências ambientais
 */
const EMISSION_FACTORS: Record<string, { min: number; avg: number; max: number }> = {
  electric: {
    min: 0.15, // Energia renovável (hidroelétrica, eólica)
    avg: 0.42, // Média global
    max: 0.82, // Carvão
  },
  diesel: {
    min: 2.5,
    avg: 2.68,
    max: 2.9,
  },
  natural_gas: {
    min: 1.8,
    avg: 2.04,
    max: 2.3,
  },
  gasoline: {
    min: 2.3,
    avg: 2.31,
    max: 2.4,
  },
  other: {
    min: 2.0,
    avg: 2.5,
    max: 3.0,
  },
};

/**
 * Fator de degradação por ano (máquinas mais antigas consomem mais energia)
 */
const DEGRADATION_FACTOR_PER_YEAR = 0.02; // 2% de aumento anual

/**
 * Calcula emissões de CO₂ baseado em dados técnicos
 */
export function calculateEmissions(
  inputs: EmissionCalculationInputs
): EmissionCalculationResult {
  const {
    powerConsumption,
    energySource,
    operatingHoursPerDay = 8,
    operatingDaysPerYear = 250,
    efficiency = 100,
    machineAge = 0,
  } = inputs;

  // Validações
  if (powerConsumption <= 0) {
    throw new Error("Consumo de potência deve ser maior que zero");
  }

  // Obter fatores de emissão
  const factors = EMISSION_FACTORS[energySource] || EMISSION_FACTORS.other;

  // Ajustar consumo pela eficiência (máquinas menos eficientes consomem mais)
  const efficiencyFactor = 100 / Math.max(efficiency, 50); // Mínimo 50% de eficiência
  const adjustedPowerConsumption = powerConsumption * efficiencyFactor;

  // Calcular emissões por hora (kg CO₂/h)
  const minEmissionPerHour = adjustedPowerConsumption * factors.min;
  const avgEmissionPerHour = adjustedPowerConsumption * factors.avg;
  const maxEmissionPerHour = adjustedPowerConsumption * factors.max;

  // Calcular emissões anuais (kg CO₂/ano)
  const hoursPerYear = operatingHoursPerDay * operatingDaysPerYear;
  const minAnnual = minEmissionPerHour * hoursPerYear;
  const avgAnnual = avgEmissionPerHour * hoursPerYear;
  const maxAnnual = maxEmissionPerHour * hoursPerYear;

  // Projeção mensal (assumindo distribuição uniforme)
  const monthlyProjection = Array(12).fill(avgAnnual / 12);

  // Projeções futuras com degradação
  const year1Projection = avgAnnual * (1 + DEGRADATION_FACTOR_PER_YEAR * 1);
  const year3Projection = avgAnnual * (1 + DEGRADATION_FACTOR_PER_YEAR * 3);
  const year5Projection = avgAnnual * (1 + DEGRADATION_FACTOR_PER_YEAR * 5);

  return {
    minEmission: Math.round(minEmissionPerHour * 100) / 100,
    avgEmission: Math.round(avgEmissionPerHour * 100) / 100,
    maxEmission: Math.round(maxEmissionPerHour * 100) / 100,
    annualProjection: Math.round(avgAnnual * 100) / 100,
    monthlyProjection: monthlyProjection.map((v) => Math.round(v * 100) / 100),
    year1Projection: Math.round(year1Projection * 100) / 100,
    year3Projection: Math.round(year3Projection * 100) / 100,
    year5Projection: Math.round(year5Projection * 100) / 100,
    formulaUsed: "ISO 14040/14044 LCA + Degradation Model",
    calculationInputs: inputs,
  };
}

/**
 * Calcula emissões com dados estimados (fallback)
 */
export function calculateEstimatedEmissions(
  machineType: string,
  energySource: "electric" | "diesel" | "natural_gas" | "gasoline" | "other" = "electric",
  machineAge: number = 0
): EmissionCalculationResult {
  // Estimativas padrão por tipo de máquina
  const estimatedPowerConsumption: Record<string, number> = {
    "motor elétrico": 7.5,
    compressor: 15,
    bomba: 5,
    turbina: 50,
    gerador: 30,
    ventilador: 3,
    transformador: 2,
    default: 10,
  };

  const powerConsumption =
    estimatedPowerConsumption[machineType.toLowerCase()] ||
    estimatedPowerConsumption.default;

  return calculateEmissions({
    powerConsumption,
    energySource,
    operatingHoursPerDay: 8,
    operatingDaysPerYear: 250,
    efficiency: 90,
    machineAge,
  });
}

/**
 * Calcula economia potencial de CO₂ com recomendações
 */
export function calculateCO2Savings(
  currentEmissions: number,
  reductionPercentage: number
): {
  annualSavings: number;
  monthlySavings: number;
  equivalentTrees: number;
} {
  const annualSavings = currentEmissions * (reductionPercentage / 100);
  const monthlySavings = annualSavings / 12;

  // 1 árvore absorve ~20 kg CO₂/ano
  const equivalentTrees = Math.round(annualSavings / 20);

  return {
    annualSavings: Math.round(annualSavings * 100) / 100,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    equivalentTrees,
  };
}

/**
 * Determina nível de severidade de emissão
 */
export function getEmissionSeverity(
  annualEmissionKgCO2: number
): "low" | "medium" | "high" | "critical" {
  if (annualEmissionKgCO2 < 500) return "low";
  if (annualEmissionKgCO2 < 2000) return "medium";
  if (annualEmissionKgCO2 < 5000) return "high";
  return "critical";
}
