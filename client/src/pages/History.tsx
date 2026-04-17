import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Trash2, Leaf, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function History() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const historyQuery = trpc.analysis.getAnalysisHistory.useQuery();
  const deleteAnalysisMutation = trpc.analysis.deleteAnalysis.useMutation({
    onSuccess: () => {
      toast.success("Análise deletada com sucesso");
      historyQuery.refetch();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
      setDeletingId(null);
    },
  });

  const handleDelete = async (analysisId: number) => {
    if (confirm("Tem certeza que deseja deletar esta análise?")) {
      setDeletingId(analysisId);
      await deleteAnalysisMutation.mutateAsync({ analysisId });
    }
  };

  const analyses = historyQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-emerald-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">IndusScan AI</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-white mb-8">Histórico de Análises</h2>

        {historyQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : analyses.length === 0 ? (
          <Card className="bg-slate-800/50 border-emerald-800/30 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300">Nenhuma análise realizada ainda.</p>
            <Button
              onClick={() => navigate("/analysis")}
              className="bg-emerald-600 hover:bg-emerald-700 mt-6"
            >
              Fazer Primeira Análise
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {analyses.map((analysis: any) => (
              <Card key={analysis.id} className="bg-slate-800/50 border-emerald-800/30 p-6">
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  {/* Machine Info */}
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Máquina</p>
                    <p className="text-white font-semibold">
                      {analysis.machineType || "Desconhecido"}
                    </p>
                    <p className="text-slate-300 text-sm">
                      {analysis.brand} {analysis.model}
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Data</p>
                    <p className="text-white font-semibold">
                      {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-slate-300 text-sm">
                      {new Date(analysis.createdAt).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>

                  {/* Emissions */}
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Emissão Anual</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {analysis.emissions?.[0]?.annualProjection?.toFixed(0) || 0} kg
                    </p>
                  </div>

                  {/* Status */}
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

                {/* Recommendations Preview */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="mb-6 pb-6 border-t border-emerald-800/30 pt-6">
                    <p className="text-slate-400 text-sm mb-3">Recomendações Principais:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-emerald-900/30 text-emerald-300 text-sm rounded-full"
                        >
                          {rec.category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(`/analysis/${analysis.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    Ver Detalhes
                  </Button>
                  <Button
                    onClick={() => handleDelete(analysis.id)}
                    disabled={deletingId === analysis.id}
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                  >
                    {deletingId === analysis.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
