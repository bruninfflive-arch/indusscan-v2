import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, TrendingUp, Leaf, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-emerald-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">IndusScan AI</h1>
          </div>
          <a href={getLoginUrl()}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Entrar</Button>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Análise Inteligente de Emissões Industriais
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Fotografe suas máquinas industriais e receba análises detalhadas de emissões de CO₂
            com recomendações de descarbonização em tempo real.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg">
              Começar Análise
            </Button>
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {/* Feature 1 */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-8 hover:border-emerald-600/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600/20 rounded-lg mb-6">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload de Imagem</h3>
            <p className="text-slate-300">
              Fotografe qualquer máquina industrial e nossa IA identificará automaticamente
              o modelo, marca e ano de fabricação.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-8 hover:border-emerald-600/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600/20 rounded-lg mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cálculo de Emissões</h3>
            <p className="text-slate-300">
              Receba cálculos precisos de emissões de CO₂ baseados em dados técnicos reais
              encontrados automaticamente na internet.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-slate-800/50 border-emerald-800/30 p-8 hover:border-emerald-600/50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600/20 rounded-lg mb-6">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Recomendações</h3>
            <p className="text-slate-300">
              Obtenha sugestões personalizadas de sensores IoT, filtros e atuadores para
              reduzir emissões e melhorar eficiência.
            </p>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-8 mt-20 pt-20 border-t border-emerald-800/30">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">1000+</div>
            <p className="text-slate-300">Máquinas Analisadas</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">500K</div>
            <p className="text-slate-300">Toneladas CO₂ Rastreadas</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">50+</div>
            <p className="text-slate-300">Indústrias Parceiras</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">98%</div>
            <p className="text-slate-300">Precisão de Análise</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-600/10 border-t border-emerald-800/30 py-20 mt-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Pronto para descarbonizar sua indústria?
          </h3>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já estão usando IndusScan AI para
            monitorar e reduzir suas emissões de CO₂.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg">
              Começar Agora
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-emerald-800/30 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2026 IndusScan AI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
