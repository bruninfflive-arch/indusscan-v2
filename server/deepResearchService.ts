import { invokeLLM } from "./_core/llm";
import { getMachineDataFromCache, saveMachineDataToCache } from "./db";

export interface MachineDataResearch {
  powerConsumption?: number; // kW
  energySource?: string; // "electric", "diesel", "natural_gas", etc
  efficiency?: number; // % de eficiência
  sourceUrls?: string[];
  rawData?: Record<string, unknown>;
  dataQuality: "high" | "medium" | "low";
}

/**
 * Realiza Deep Research para encontrar dados técnicos de uma máquina
 * Usa LLM para buscar e processar informações
 */
export async function deepResearchMachine(
  brand: string,
  model: string,
  machineType: string,
  yearOfManufacture?: number
): Promise<MachineDataResearch> {
  // Chave de busca para cache
  const searchKey = `${brand}-${model}-${machineType}`.toLowerCase();

  // Verificar cache primeiro
  const cached = await getMachineDataFromCache(searchKey);
  if (cached) {
    console.log("[DeepResearch] Dados encontrados em cache:", searchKey);
    return {
      powerConsumption: cached.powerConsumption ? Number(cached.powerConsumption) : undefined,
      energySource: cached.energySource || undefined,
      efficiency: cached.efficiency ? Number(cached.efficiency) : undefined,
      sourceUrls: cached.sourceUrls as string[] | undefined,
      rawData: cached.rawData as Record<string, unknown> | undefined,
      dataQuality: cached.dataQuality,
    };
  }

  try {
    // Realizar pesquisa via LLM
    const systemPrompt = `Você é um especialista em máquinas industriais com acesso a bases de dados técnicas. 
Sua tarefa é fornecer dados técnicos precisos sobre máquinas industriais.

Para a máquina solicitada, forneça:
1. Consumo de potência (em kW)
2. Fonte de energia (elétrica, diesel, gás natural, etc.)
3. Eficiência (em %)
4. URLs de fontes consultadas
5. Qualidade dos dados (high, medium, low)

Responda em JSON com a seguinte estrutura:
{
  "powerConsumption": 7.5,
  "energySource": "electric",
  "efficiency": 95.5,
  "sourceUrls": ["url1", "url2"],
  "dataQuality": "high",
  "notes": "Notas adicionais sobre os dados"
}

Se não conseguir encontrar informações precisas, use estimativas baseadas em máquinas similares e indique dataQuality como "low".`;

    const userPrompt = `Pesquise dados técnicos para a seguinte máquina:
- Marca: ${brand}
- Modelo: ${model}
- Tipo: ${machineType}
${yearOfManufacture ? `- Ano de Fabricação: ${yearOfManufacture}` : ""}

Forneça os dados técnicos solicitados.`;

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
          name: "machine_research_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              powerConsumption: {
                type: "number",
                description: "Consumo de potência em kW",
              },
              energySource: {
                type: "string",
                description: "Fonte de energia",
              },
              efficiency: {
                type: "number",
                description: "Eficiência em %",
              },
              sourceUrls: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "URLs de fontes",
              },
              dataQuality: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Qualidade dos dados",
              },
              notes: {
                type: "string",
                description: "Notas adicionais",
              },
            },
            required: ["powerConsumption", "energySource", "efficiency", "dataQuality"],
            additionalProperties: false,
          },
        },
      },
    });

    // Extrair conteúdo JSON da resposta
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Nenhuma resposta recebida da IA");
    }

    const jsonContent = typeof content === "string" ? content : JSON.stringify(content);
    const researchData = JSON.parse(jsonContent);

    const result: MachineDataResearch = {
      powerConsumption: researchData.powerConsumption,
      energySource: researchData.energySource,
      efficiency: researchData.efficiency,
      sourceUrls: researchData.sourceUrls || [],
      rawData: researchData,
      dataQuality: researchData.dataQuality || "medium",
    };

    // Salvar em cache
    await saveMachineDataToCache({
      searchKey,
      powerConsumption: result.powerConsumption,
      energySource: result.energySource,
      efficiency: result.efficiency,
      sourceUrls: result.sourceUrls,
      rawData: result.rawData,
      dataQuality: result.dataQuality,
    });

    console.log("[DeepResearch] Dados pesquisados e cacheados:", searchKey);
    return result;
  } catch (error) {
    console.error("[DeepResearch] Erro na pesquisa:", error);

    // Retornar dados estimados em caso de erro
    return {
      powerConsumption: 7.5, // Valor padrão estimado
      energySource: "electric",
      efficiency: 90,
      dataQuality: "low",
    };
  }
}

/**
 * Enriquece dados de máquina com informações do Deep Research
 */
export async function enrichMachineData(
  brand: string,
  model: string,
  machineType: string,
  yearOfManufacture?: number
): Promise<{
  powerConsumption?: number;
  energySource?: string;
  efficiency?: number;
  dataQuality: "high" | "medium" | "low";
}> {
  const researchData = await deepResearchMachine(
    brand,
    model,
    machineType,
    yearOfManufacture
  );

  return {
    powerConsumption: researchData.powerConsumption,
    energySource: researchData.energySource,
    efficiency: researchData.efficiency,
    dataQuality: researchData.dataQuality,
  };
}
