import { invokeLLM } from "./_core/llm";
import { getEmissionSeverity } from "./emissionsCalculationService";

export interface Recommendation {
  title: string;
  description: string;
  category: "sensor" | "actuator" | "filter" | "maintenance" | "replacement" | "optimization";
  estimatedCO2ReductionPercent: number;
  estimatedCO2ReductionKg: number;
  priority: "low" | "medium" | "high";
  timeline: string;
  estimatedCost: string;
  requiredComponents: string[];
  implementationSteps: string[];
}

/**
 * Gera recomendações de descarbonização baseado em dados da máquina
 */
export async function generateRecommendations(
  machineType: string,
  brand: string,
  model: string,
  annualEmissionKgCO2: number,
  powerConsumption: number,
  energySource: string,
  efficiency: number,
  anomalies: string[]
): Promise<Recommendation[]> {
  try {
    const severity = getEmissionSeverity(annualEmissionKgCO2);

    const systemPrompt = `Você é um especialista em eficiência energética e descarbonização industrial.
    
Sua tarefa é gerar recomendações práticas e viáveis para reduzir emissões de CO2 de máquinas industriais.

Considere:
1. Sensores IoT para monitoramento em tempo real
2. Atuadores para otimização automática
3. Filtros e sistemas de limpeza
4. Manutenção preventiva
5. Substituição por máquinas mais eficientes
6. Otimizações operacionais

Responda com um array JSON de recomendações, ordenadas por impacto potencial.`;

    const userPrompt = `Gere recomendações de descarbonização para:
- Máquina: ${machineType} (${brand} ${model})
- Emissão Anual: ${annualEmissionKgCO2} kg CO2
- Consumo: ${powerConsumption} kW
- Fonte de Energia: ${energySource}
- Eficiência: ${efficiency}%
- Severidade: ${severity}
- Anomalias Detectadas: ${anomalies.join(", ") || "Nenhuma"}

Gere entre 3 e 5 recomendações práticas e viáveis.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Título da recomendação",
                    },
                    description: {
                      type: "string",
                      description: "Descrição detalhada",
                    },
                    category: {
                      type: "string",
                      enum: [
                        "sensor",
                        "actuator",
                        "filter",
                        "maintenance",
                        "replacement",
                        "optimization",
                      ],
                      description: "Categoria da recomendação",
                    },
                    estimatedCO2ReductionPercent: {
                      type: "integer",
                      description: "Redução estimada de CO2 em %",
                    },
                    estimatedCO2ReductionKg: {
                      type: "number",
                      description: "Redução estimada de CO2 em kg/ano",
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                      description: "Prioridade da implementação",
                    },
                    timeline: {
                      type: "string",
                      description: "Prazo estimado",
                    },
                    estimatedCost: {
                      type: "string",
                      enum: ["Baixo", "Médio", "Alto"],
                      description: "Custo estimado",
                    },
                    requiredComponents: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "Componentes necessários",
                    },
                    implementationSteps: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "Passos de implementação",
                    },
                  },
                  required: [
                    "title",
                    "description",
                    "category",
                    "estimatedCO2ReductionPercent",
                    "estimatedCO2ReductionKg",
                    "priority",
                    "timeline",
                    "estimatedCost",
                    "requiredComponents",
                    "implementationSteps",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Nenhuma resposta recebida da IA");
    }

    const jsonContent = typeof content === "string" ? content : JSON.stringify(content);
    const parsedResponse = JSON.parse(jsonContent);

    return parsedResponse.recommendations as Recommendation[];
  } catch (error) {
    console.error("[Recommendations] Erro ao gerar recomendações:", error);
    return getDefaultRecommendations(annualEmissionKgCO2, powerConsumption);
  }
}

/**
 * Recomendações padrão quando a IA falha
 */
function getDefaultRecommendations(
  annualEmissionKgCO2: number,
  powerConsumption: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  recommendations.push({
    title: "Instalação de Sensor IoT de Monitoramento",
    description:
      "Sensor inteligente para monitorar consumo de energia em tempo real.",
    category: "sensor",
    estimatedCO2ReductionPercent: 5,
    estimatedCO2ReductionKg: Math.round((annualEmissionKgCO2 * 0.05 * 100) / 100),
    priority: "high",
    timeline: "Imediato",
    estimatedCost: "Baixo",
    requiredComponents: ["Sensor IoT", "Gateway", "Software de Análise"],
    implementationSteps: [
      "Selecionar sensor compatível",
      "Instalar sensor na máquina",
      "Configurar conectividade",
      "Calibrar medições",
    ],
  });

  recommendations.push({
    title: "Programa de Manutenção Preventiva",
    description: "Manutenção regular reduz atrito e desgaste.",
    category: "maintenance",
    estimatedCO2ReductionPercent: 8,
    estimatedCO2ReductionKg: Math.round((annualEmissionKgCO2 * 0.08 * 100) / 100),
    priority: "high",
    timeline: "Imediato",
    estimatedCost: "Baixo",
    requiredComponents: ["Óleo lubrificante", "Peças de reposição", "Ferramentas"],
    implementationSteps: [
      "Criar cronograma de manutenção",
      "Treinar equipe",
      "Executar manutenção periódica",
      "Registrar histórico",
    ],
  });

  if (powerConsumption > 10) {
    recommendations.push({
      title: "Otimização de Parâmetros Operacionais",
      description: "Ajustar velocidade, temperatura e pressão para reduzir consumo.",
      category: "optimization",
      estimatedCO2ReductionPercent: 10,
      estimatedCO2ReductionKg: Math.round((annualEmissionKgCO2 * 0.1 * 100) / 100),
      priority: "medium",
      timeline: "3 meses",
      estimatedCost: "Baixo",
      requiredComponents: ["Controlador programável", "Documentação técnica"],
      implementationSteps: [
        "Analisar parâmetros atuais",
        "Simular otimizações",
        "Implementar mudanças",
        "Monitorar resultados",
      ],
    });
  }

  recommendations.push({
    title: "Instalação de Filtros de Alta Eficiência",
    description: "Filtros otimizados reduzem perdas de carga.",
    category: "filter",
    estimatedCO2ReductionPercent: 6,
    estimatedCO2ReductionKg: Math.round((annualEmissionKgCO2 * 0.06 * 100) / 100),
    priority: "medium",
    timeline: "1 mês",
    estimatedCost: "Médio",
    requiredComponents: ["Filtros de alta eficiência", "Adaptadores"],
    implementationSteps: [
      "Selecionar filtros compatíveis",
      "Desinstalar filtros antigos",
      "Instalar novos filtros",
      "Testar performance",
    ],
  });

  if (annualEmissionKgCO2 > 5000) {
    recommendations.push({
      title: "Substituição por Máquina de Maior Eficiência",
      description: "Máquinas modernas IE4+ podem reduzir emissões em até 30%.",
      category: "replacement",
      estimatedCO2ReductionPercent: 30,
      estimatedCO2ReductionKg: Math.round((annualEmissionKgCO2 * 0.3 * 100) / 100),
      priority: "medium",
      timeline: "12 meses",
      estimatedCost: "Alto",
      requiredComponents: ["Nova máquina IE4+", "Instalação profissional"],
      implementationSteps: [
        "Pesquisar modelos eficientes",
        "Comparar custos",
        "Planejar substituição",
        "Instalar nova máquina",
        "Descartar máquina antiga responsavelmente",
      ],
    });
  }

  return recommendations;
}
