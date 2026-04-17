import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Upload, Loader2, AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Analysis() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const startAnalysisMutation = trpc.analysis.startAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success("Análise concluída com sucesso!");
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    // Validação de formato
    const allowedFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedFormats.includes(file.type)) {
      toast.error("Formato não suportado. Use JPEG, PNG ou WebP.");
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    // Converter arquivo para base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      if (!base64) {
        toast.error("Erro ao processar arquivo");
        setIsLoading(false);
        return;
      }

      await startAnalysisMutation.mutateAsync({
        imageBuffer: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

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
        <div className="max-w-2xl mx-auto">
          {!analysisResult ? (
            <>
              {/* Upload Section */}
              <Card className="bg-slate-800/50 border-emerald-800/30 p-12 mb-8">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                      <Upload className="w-10 h-10 text-emerald-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Faça Upload de uma Imagem
                  </h2>
                  <p className="text-slate-300 mb-8">
                    Fotografe sua máquina industrial e nossa IA analisará automaticamente
                    a emissão de CO₂ e fornecerá recomendações de descarbonização.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                    className="hidden"
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Imagem
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 mt-6">
                    Formatos suportados: JPEG, PNG, WebP (máximo 10MB)
                  </p>
                </div>
              </Card>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-slate-800/50 border-emerald-800/30 p-4">
                  <h3 className="font-bold text-white mb-2">Identificação</h3>
                  <p className="text-sm text-slate-300">
                    Modelo, marca e ano de fabricação
                  </p>
                </Card>
                <Card className="bg-slate-800/50 border-emerald-800/30 p-4">
                  <h3 className="font-bold text-white mb-2">Dados Técnicos</h3>
                  <p className="text-sm text-slate-300">
                    Potência, eficiência e fonte de energia
                  </p>
                </Card>
                <Card className="bg-slate-800/50 border-emerald-800/30 p-4">
                  <h3 className="font-bold text-white mb-2">Emissões</h3>
                  <p className="text-sm text-slate-300">
                    Cálculos precisos de CO₂ anual
                  </p>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Results Section */}
              <Card className="bg-slate-800/50 border-emerald-800/30 p-8 mb-8">
                <div className="flex items-center gap-4 mb-8">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">Análise Concluída</h2>
                </div>

                {/* Machine Identification */}
                <div className="mb-8 pb-8 border-b border-emerald-800/30">
                  <h3 className="text-lg font-bold text-white mb-4">Máquina Identificada</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Tipo</p>
                      <p className="text-white font-semibold">
                        {analysisResult?.identification?.machineType}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Marca</p>
                      <p className="text-white font-semibold">
                        {analysisResult?.identification?.brand}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Modelo</p>
                      <p className="text-white font-semibold">
                        {analysisResult?.identification?.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Ano de Fabricação</p>
                      <p className="text-white font-semibold">
                        {analysisResult?.identification?.yearOfManufacture}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emissions Data */}
                <div className="mb-8 pb-8 border-b border-emerald-800/30">
                  <h3 className="text-lg font-bold text-white mb-4">Emissões de CO₂</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Emissão Mínima</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {analysisResult?.emissions?.minEmission?.toFixed(2)} kg
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Emissão Média</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {analysisResult?.emissions?.avgEmission?.toFixed(2)} kg
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Emissão Máxima</p>
                      <p className="text-2xl font-bold text-red-400">
                        {analysisResult?.emissions?.maxEmission?.toFixed(2)} kg
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Projeção Anual</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {analysisResult?.emissions?.annualProjection?.toFixed(0)} kg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">
                    Recomendações de Descarbonização
                  </h3>
                  <div className="space-y-4">
                    {analysisResult?.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-emerald-800/30">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-white">{rec.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded ${
                            rec.priority === 'high' ? 'bg-red-900/30 text-red-300' :
                            rec.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
                            'bg-green-900/30 text-green-300'
                          }`}>
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{rec.description}</p>
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-400">Redução Estimada:</span>
                            <span className="text-emerald-400 font-semibold ml-2">
                              {rec.estimatedCO2ReductionPercent}% ({rec.estimatedCO2ReductionKg} kg)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Prazo:</span>
                            <span className="text-white font-semibold ml-2">{rec.timeline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setAnalysisResult(null);
                    setIsLoading(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  Nova Análise
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
