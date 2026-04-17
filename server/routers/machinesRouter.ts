import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getAllMachines } from "../db";

export const machinesRouter = router({
  /**
   * Busca máquinas por marca e modelo
   */
  search: publicProcedure
    .input(
      z.object({
        brand: z.string().optional(),
        model: z.string().optional(),
        machineType: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const machines = await getAllMachines();

        let filtered = machines;

        if (input.brand) {
          filtered = filtered.filter((m: any) =>
            m.brand.toLowerCase().includes(input.brand!.toLowerCase())
          );
        }

        if (input.model) {
          filtered = filtered.filter((m: any) =>
            m.model.toLowerCase().includes(input.model!.toLowerCase())
          );
        }

        if (input.machineType) {
          filtered = filtered.filter((m: any) =>
            m.machineType.toLowerCase().includes(input.machineType!.toLowerCase())
          );
        }

        const total = filtered.length;
        const paginated = filtered.slice(input.offset, input.offset + input.limit);

        return {
          machines: paginated,
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error("[Machines] Erro ao buscar:", error);
        return {
          machines: [],
          total: 0,
          hasMore: false,
        };
      }
    }),

  /**
   * Obtém detalhes de uma máquina específica
   */
  getById: publicProcedure
    .input(z.object({ machineId: z.number() }))
    .query(async ({ input }) => {
      try {
        const machines = await getAllMachines();
        return machines.find((m: any) => m.id === input.machineId) || null;
      } catch (error) {
        console.error("[Machines] Erro ao buscar máquina:", error);
        return null;
      }
    }),

  /**
   * Obtém marcas únicas
   */
  getBrands: publicProcedure.query(async () => {
    try {
      const machines = await getAllMachines();
      const brands: string[] = [];
      const seen = new Set<string>();

      machines.forEach((m: any) => {
        if (!seen.has(m.brand)) {
          brands.push(m.brand);
          seen.add(m.brand);
        }
      });

      return brands.sort();
    } catch (error) {
      console.error("[Machines] Erro ao buscar marcas:", error);
      return [];
    }
  }),

  /**
   * Obtém tipos de máquinas únicos
   */
  getMachineTypes: publicProcedure.query(async () => {
    try {
      const machines = await getAllMachines();
      const types: string[] = [];
      const seen = new Set<string>();

      machines.forEach((m: any) => {
        if (!seen.has(m.machineType)) {
          types.push(m.machineType);
          seen.add(m.machineType);
        }
      });

      return types.sort();
    } catch (error) {
      console.error("[Machines] Erro ao buscar tipos:", error);
      return [];
    }
  }),

  /**
   * Obtém estatísticas do catálogo
   */
  getStats: publicProcedure.query(async () => {
    try {
      const machines = await getAllMachines();

      const avgPowerConsumption =
        machines.reduce((sum: number, m: any) => sum + (m.powerConsumption || 0), 0) /
          machines.length || 0;

      const avgEfficiency =
        machines.reduce((sum: number, m: any) => sum + (m.efficiency || 0), 0) /
          machines.length || 0;

      const energySources: string[] = [];
      const brands: string[] = [];
      const types: string[] = [];
      const seenEnergy = new Set<string>();
      const seenBrands = new Set<string>();
      const seenTypes = new Set<string>();

      machines.forEach((m: any) => {
        if (!seenEnergy.has(m.energySource)) {
          energySources.push(m.energySource);
          seenEnergy.add(m.energySource);
        }
        if (!seenBrands.has(m.brand)) {
          brands.push(m.brand);
          seenBrands.add(m.brand);
        }
        if (!seenTypes.has(m.machineType)) {
          types.push(m.machineType);
          seenTypes.add(m.machineType);
        }
      });

      return {
        totalMachines: machines.length,
        avgPowerConsumption: avgPowerConsumption.toFixed(2),
        avgEfficiency: avgEfficiency.toFixed(2),
        energySources,
        brands: brands.length,
        machineTypes: types.length,
      };
    } catch (error) {
      console.error("[Machines] Erro ao buscar estatísticas:", error);
      return {
        totalMachines: 0,
        avgPowerConsumption: "0",
        avgEfficiency: "0",
        energySources: [],
        brands: 0,
        machineTypes: 0,
      };
    }
  }),
});
