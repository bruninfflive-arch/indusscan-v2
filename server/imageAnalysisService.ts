import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export interface MachineIdentification {
  machineType: string;
  brand: string;
  model: string;
  yearOfManufacture?: number;
  confidenceScore: number; // 0-100
  anomalies: string[];
  description: string;
}

/**
 * Analisa uma imagem de máquina industrial usando Vision API
 * Identifica tipo, marca, modelo e ano de fabricação
 */
export async function analyzeMachineImage(
  imageUrl: string
): Promise<MachineIdentification> {
  try {
    const systemPrompt = `Você é um especialista em máquinas industriais. Analise a imagem fornecida e identifique:
1. Tipo de máquina (ex: Motor Elétrico, Compressor, Bomba, Turbina, etc.)
2. Marca/Fabricante (ex: WEG, Siemens, ABB, etc.)
3. Modelo específico (ex: W22 Magnet, IE3, etc.)
4. Ano aproximado de fabricação (se possível)
5. Confiança na identificação (0-100)
6. Anomalias detectadas (oxidação, desgaste, vazamentos, etc.)

Responda em JSON com a seguinte estrutura:
{
  "machineType": "tipo da máquina",
  "brand": "marca",
  "model": "modelo",
  "yearOfManufacture": 2015,
  "confidenceScore": 85,
  "anomalies": ["anomalia1", "anomalia2"],
  "description": "descrição detalhada da máquina"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem de máquina industrial e forneça os dados solicitados.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "machine_identification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              machineType: {
                type: "string",
                description: "Tipo da máquina industrial",
              },
              brand: {
                type: "string",
                description: "Marca/fabricante",
              },
              model: {
                type: "string",
                description: "Modelo específico",
              },
              yearOfManufacture: {
                type: "integer",
                description: "Ano aproximado de fabricação",
              },
              confidenceScore: {
                type: "integer",
                description: "Confiança da identificação (0-100)",
              },
              anomalies: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Lista de anomalias detectadas",
              },
              description: {
                type: "string",
                description: "Descrição detalhada",
              },
            },
            required: [
              "machineType",
              "brand",
              "model",
              "confidenceScore",
              "anomalies",
              "description",
            ],
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
    const result = JSON.parse(jsonContent) as MachineIdentification;

    // Validações básicas
    if (!result.machineType || !result.brand || !result.model) {
      throw new Error("Não foi possível identificar a máquina com clareza");
    }

    return result;
  } catch (error) {
    console.error("[ImageAnalysis] Erro ao analisar imagem:", error);
    throw new Error(
      `Falha na análise de imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

/**
 * Upload de imagem para S3 e retorna URL
 */
export async function uploadImageToStorage(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string = "image/jpeg"
): Promise<{ url: string; key: string }> {
  try {
    // Gerar chave única para a imagem
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileKey = `analyses/${timestamp}-${random}-${fileName}`;

    const result = await storagePut(fileKey, imageBuffer, mimeType);

    return {
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error("[ImageUpload] Erro ao fazer upload:", error);
    throw new Error(
      `Falha no upload de imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

/**
 * Processa uma imagem: upload + análise
 */
export async function processImageAnalysis(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string = "image/jpeg"
): Promise<{
  imageUrl: string;
  identification: MachineIdentification;
}> {
  // 1. Upload da imagem
  const { url: imageUrl } = await uploadImageToStorage(
    imageBuffer,
    fileName,
    mimeType
  );

  // 2. Análise da imagem
  const identification = await analyzeMachineImage(imageUrl);

  return {
    imageUrl,
    identification,
  };
}
