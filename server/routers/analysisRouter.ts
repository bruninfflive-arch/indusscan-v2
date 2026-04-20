import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { processImageAnalysis } from "../imageAnalysisService";
import { enrichMachineData } from "../deepResearchService";
import { calculateEmissions, calculateEstimatedEmissions } from "../emissionsCalculationService";
import { generateRecommendations } from "../recommendationsService";
import {
  createAnalysis,
  updateAnalysisStatus,
  updateAnalysisIdentification,
  createOrUpdateMachine,
  createEmissions,
  createRecommendations,
  getAnalysisByUserId,
  getAnalysisById,
  deleteAnalysis,
  getEmissionsByAnalysisId,
  getRecommendationsByAnalysisId,
  updateUserMetrics,
  getUserMetrics,
  getTotalEmissionsByUser,
} from "../db";

export const analysisRouter = router({
  /**
   * Inicia análise de uma imagem de máquina
   */
  startAnalysis: protectedProcedure
    .input(
      z.object({
        imageBuffer: z.string(), // Base64 encoded
        fileName: z.string(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decodificar imagem
        const imageBuffer = Buffer.from(input.imageBuffer, "base64");

        // 1. Criar registro de análise
        const analysisId = await createAnalysis({
          userId: ctx.user.id,
          imageUrl: "", // Será preenchido após upload
          imageFileName: input.fileName,
        });

        // 2. Processar imagem (upload + análise)
        const { imageUrl, identification } = await processImageAnalysis(
          imageBuffer,
          input.fileName,
          input.mimeType || "image/jpeg"
        );

        // 3. Salvar dados identificados na análise
        await updateAnalysisIdentification(analysisId, {
          imageUrl,
          identifiedMachineType: identification.machineType,
          identifiedBrand: identification.brand,
          identifiedModel: identification.model,
          identifiedYear: identification.yearOfManufacture,
          confidenceScore: identification.confidenceScore,
          anomalies: identification.anomalies,
        });

        // 4. Atualizar status
        await updateAnalysisStatus(analysisId, "processing");

        // 5. Deep Research para enriquecer dados
        const enrichedData = await enrichMachineData(
          identification.brand,
          identification.model,
          identification.machineType,
          identification.yearOfManufacture
        );

        // 6. Criar ou atualizar máquina no catálogo
        const machineId = await createOrUpdateMachine({
          machineType: identification.machineType,
          brand: identification.brand,
          model: identification.model,
          yearOfManufacture: identification.yearOfManufacture,
          powerConsumption: enrichedData.powerConsumption,
          energySource: enrichedData.energySource,
          efficiency: enrichedData.efficiency,
          dataSource: "deep_research",
        });

        // 7. Calcular emissões
        const emissionsData = calculateEmissions({
          powerConsumption: enrichedData.powerConsumption || 7.5,
          energySource: (enrichedData.energySource || "electric") as any,
          operatingHoursPerDay: 8,
          operatingDaysPerYear: 250,
          efficiency: enrichedData.efficiency || 90,
          machineAge: identification.yearOfManufacture
            ? new Date().getFullYear() - identification.yearOfManufacture
            : 0,
        });

        // 8. Salvar emissões
        const emissionId = await createEmissions({
          analysisId,
          minEmission: emissionsData.minEmission,
          avgEmission: emissionsData.avgEmission,
          maxEmission: emissionsData.maxEmission,
          annualProjection: emissionsData.annualProjection,
          year1Projection: emissionsData.year1Projection,
          year3Projection: emissionsData.year3Projection,
          year5Projection: emissionsData.year5Projection,
          monthlyProjection: emissionsData.monthlyProjection,
          formulaUsed: emissionsData.formulaUsed,
          calculationInputs: emissionsData.calculationInputs as any,
        });

        // 9. Gerar recomendações
        const recommendations = await generateRecommendations(
          identification.machineType,
          identification.brand,
          identification.model,
          emissionsData.annualProjection,
          enrichedData.powerConsumption || 7.5,
          enrichedData.energySource || "electric",
          enrichedData.efficiency || 90,
          identification.anomalies
        );

        // 9. Salvar recomendações
        await createRecommendations(
          recommendations.map((rec) => ({
            analysisId,
            title: rec.title,
            description: rec.description,
            category: rec.category,
            estimatedCO2ReductionPercent: rec.estimatedCO2ReductionPercent,
            estimatedCO2ReductionKg: rec.estimatedCO2ReductionKg,
            priority: rec.priority,
            timeline: rec.timeline,
            estimatedCost: rec.estimatedCost,
            requiredComponents: rec.requiredComponents,
            implementationSteps: rec.implementationSteps,
          }))
        );

        // 10. Atualizar métricas do usuário
        const currentMetrics = await getUserMetrics(ctx.user.id);
        const totalEmissions = await getTotalEmissionsByUser(ctx.user.id);

        await updateUserMetrics(ctx.user.id, {
          totalAnalyses: (currentMetrics?.totalAnalyses || 0) + 1,
          totalMachines: (currentMetrics?.totalMachines || 0) + 1,
          totalEmissionKgCO2: totalEmissions + emissionsData.annualProjection,
        });

        // 11. Marcar análise como completa
        await updateAnalysisStatus(analysisId, "completed");

        return {
          analysisId,
          machineId,
          emissionId,
          imageUrl,
          identification,
          emissions: emissionsData,
          recommendations,
        };
      } catch (error) {
        console.error("[Analysis] Erro:", error);
        throw new Error(
          `Falha na análise: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
      }
    }),

  /**
   * Obtém histórico de análises do usuário
   */
  getAnalysisHistory: protectedProcedure.query(async ({ ctx }) => {
    const analyses = await getAnalysisByUserId(ctx.user.id);

    // Enriquecer com dados de emissões e recomendações
    const enrichedAnalyses = await Promise.all(
      analyses.map(async (analysis) => {
        const emissions = await getEmissionsByAnalysisId(analysis.id);
        const recommendations = await getRecommendationsByAnalysisId(analysis.id);

        return {
          ...analysis,
          emissions,
          recommendations,
        };
      })
    );

    return enrichedAnalyses;
  }),

  /**
   * Obtém detalhes de uma análise específica
   */
  getAnalysisDetails: protectedProcedure
    .input(z.object({ analysisId: z.number() }))
    .query(async ({ input, ctx }) => {
      const analysis = await getAnalysisById(input.analysisId);

      if (!analysis || analysis.userId !== ctx.user.id) {
        throw new Error("Análise não encontrada ou acesso negado");
      }

      const emissions = await getEmissionsByAnalysisId(analysis.id);
      const recommendations = await getRecommendationsByAnalysisId(analysis.id);

      return {
        ...analysis,
        emissions,
        recommendations,
      };
    }),

  /**
   * Deleta uma análise
   */
  deleteAnalysis: protectedProcedure
    .input(z.object({ analysisId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const analysis = await getAnalysisById(input.analysisId);

      if (!analysis || analysis.userId !== ctx.user.id) {
        throw new Error("Análise não encontrada ou acesso negado");
      }

      await deleteAnalysis(input.analysisId);

      // Atualizar métricas
      const analyses = await getAnalysisByUserId(ctx.user.id);
      const totalEmissions = await getTotalEmissionsByUser(ctx.user.id);

      await updateUserMetrics(ctx.user.id, {
        totalAnalyses: analyses.length,
        totalEmissionKgCO2: totalEmissions,
      });

      return { success: true };
    }),

  /**
   * Obtém métricas consolidadas do usuário
   */
  getUserMetrics: protectedProcedure.query(async ({ ctx }) => {
    const metrics = await getUserMetrics(ctx.user.id);
    const totalEmissions = await getTotalEmissionsByUser(ctx.user.id);

    return {
      ...metrics,
      totalEmissionKgCO2: totalEmissions,
    };
  }),

  /**
   * Obtém dados anuais de emissões para gráficos
   */
  getAnnualEmissionsData: protectedProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const year = input.year || new Date().getFullYear();

      // Simulação: retornar dados agregados por mês
      const monthlyData = Array(12)
        .fill(0)
        .map((_, month) => ({
          month: new Date(year, month, 1).toLocaleDateString("pt-BR", {
            month: "short",
          }),
          emissions: Math.random() * 500 + 100, // Dados simulados
        }));

      return {
        year,
        monthlyData,
        totalAnnual: monthlyData.reduce((sum, d) => sum + d.emissions, 0),
      };
    }),
});
