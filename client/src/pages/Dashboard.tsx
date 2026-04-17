import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Upload, BarChart3, History, Leaf, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  // Carregar métricas do usuário
  const metricsQuery = trpc.analysis.getUserMetrics.useQuery();
  const annualDataQuery = trpc.analysis.getAnnualEmissionsData.useQuery({});

  const metrics = metricsQuery.data;
  const annualData = annualDataQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-emerald-800/30 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">IndusScan AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{user?.name}</span>
            <Button variant="outline" onClick={() => navigate("/analysis")} style={{color: '#ffffff', backgroundColor: '#036d05'}}>
              Nova Análise
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {/* Total Analyses */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Total de Análises</p>
                <p className="text-3xl font-bold text-white">{metrics?.totalAnalyses || 0}</p>
              </div>
              <Upload className="w-10 h-10 text-emerald-400 opacity-20" />
            </div>
          </Card>

          {/* Total Machines */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Máquinas Catalogadas</p>
                <p className="text-3xl font-bold text-white">{metrics?.totalMachines || 0}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-emerald-400 opacity-20" />
            </div>
          </Card>

          {/* Total Emissions */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Emissão Total (kg CO₂)</p>
                <p className="text-3xl font-bold text-white">
                  {typeof metrics?.totalEmissionKgCO2 === 'number'
                    ? Math.round(metrics.totalEmissionKgCO2).toLocaleString()
                    : 0}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-400 opacity-20" />
            </div>
          </Card>

          {/* Potential Reduction */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Economia Potencial (kg CO₂)</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {typeof metrics?.potentialReductionKgCO2 === 'number'
                    ? Math.round(metrics.potentialReductionKgCO2).toLocaleString()
                    : 0}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-emerald-400 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Annual Emissions Chart */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Emissões Mensais</h3>
            {annualData?.monthlyData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={annualData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #10b981",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="emissions"
                    stroke="#10b981"
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Net Zero Progress */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Progresso Net Zero</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Redução de Emissões</span>
                  <span className="text-emerald-400 font-bold">{metrics?.netZeroProgress || 0}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${metrics?.netZeroProgress || 0}%` }}
                  />
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Você está no caminho certo para atingir seus objetivos de sustentabilidade.
              </p>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/analysis")}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Nova Análise
          </Button>
          <Button
            onClick={() => navigate("/history")}
            variant="outline"
            className="flex items-center gap-2" style={{color: '#fcfcfc', backgroundColor: '#09ce72'}}
          >
            <History className="w-4 h-4" />
            Ver Histórico
          </Button>
        </div>
      </main>
    </div>
  );
}
