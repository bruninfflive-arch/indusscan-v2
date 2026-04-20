import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Leaf, Loader2, AlertCircle, ArrowLeft, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AnalysisDetail() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const analysisId = parseInt(params?.id || "0");

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const analysisQuery = trpc.analysis.getAnalysisDetails.useQuery({ analysisId });
  const analysis = analysisQuery.data;

  if (analysisQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <header className="border-b border-emerald-800/30 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">IndusScan AI</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <Card className="bg-slate-800/50 border-emerald-800/30 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 mb-6">Análise não encontrada.</p>
            <Button onClick={() => navigate("/history")} className="bg-emerald-600 hover:bg-emerald-700">
              Voltar ao Histórico
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const emissions = analysis.emissions;
  const recommendations = analysis.recommendations || [];

  // Dados para gráfico de projeção
  const projectionData = [
    { year: "Atual", value: parseFloat(emissions?.annualProjection?.toString() || "0") },
    { year: "1 ano", value: parseFloat(emissions?.year1Projection?.toString() || "0") },
    { year: "3 anos", value: parseFloat(emissions?.year3Projection?.toString() || "0") },
    { year: "5 anos", value: parseFloat(emissions?.year5Projection?.toString() || "0") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-emerald-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Detalhes da Análise</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Machine Info */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-6">Informações da Máquina</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Tipo de Máquina</p>
                <p className="text-white font-semibold text-lg">{analysis.identifiedMachineType || "Desconhecido"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Marca</p>
                <p className="text-white font-semibold text-lg">{analysis.identifiedBrand || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Modelo</p>
                <p className="text-white font-semibold text-lg">{analysis.identifiedModel || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Ano de Fabricação</p>
                {analysis.identifiedYear ? (
                  <p className="text-white font-semibold text-lg">{analysis.identifiedYear}</p>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-700/50 rounded px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <p className="text-amber-300 text-sm">Ano não identificado</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Data da Análise</p>
                <p className="text-white font-semibold text-lg">
                  {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  <span className="text-white font-semibold">
                    {analysis.status === "completed" ? "Concluída" : "Processando"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Emissions Summary */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Emissões de CO₂</h2>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Mínima</p>
                <p className="text-2xl font-bold text-blue-400">{parseFloat(emissions?.minEmission?.toString() || "0").toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Média</p>
                <p className="text-2xl font-bold text-yellow-400">{parseFloat(emissions?.avgEmission?.toString() || "0").toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Máxima</p>
                <p className="text-2xl font-bold text-red-400">{parseFloat(emissions?.maxEmission?.toString() || "0").toFixed(2)} kg</p>
              </div>
              <div className="pt-4 border-t border-emerald-800/30">
                <p className="text-slate-400 text-sm mb-1">Anual</p>
                <p className="text-3xl font-bold text-orange-400">{parseFloat(emissions?.annualProjection?.toString() || "0").toFixed(0)} kg</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Projection Chart */}
        <Card className="bg-slate-800/50 border-emerald-800/30 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Projeção de Emissões
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #10b981",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 6 }}
                activeDot={{ r: 8 }}
                name="Emissão (kg CO₂)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recomendações de Descarbonização</h2>
            <div className="space-y-4">
              {recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-emerald-800/20">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{rec.title}</p>
                      <p className="text-slate-300 text-sm mt-1">{rec.description}</p>
                      {rec.estimatedCO2ReductionKg && (
                        <p className="text-emerald-400 text-sm mt-2">
                          💚 Economia potencial: {rec.estimatedCO2ReductionKg.toFixed(0)} kg CO₂/ano
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
