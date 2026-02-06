import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const beneficios = [
  "Se existem dívidas internas no Banco Central",
  "Se há restrições no SPC, Serasa ou Boa Vista",
  "Se seu CPF está marcado como prejuízo",
  "Qual é sua classificação atual de rating",
  "Qual o risco de crédito que o sistema enxerga",
  "Qual limite de crédito você teria possibilidade de aprovação",
];

const Produto = () => {
  return (
    <section className="py-12 animate-fade-in-up">
      <div className="container">
        <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
          <div className="text-center mb-7">
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-2">
              Raio-X do Crédito
            </h2>
            <p className="text-muted-foreground">Diagnóstico Completo</p>
          </div>
          
          <p className="text-center text-muted-foreground mb-6">
            O Raio-X do Crédito é uma análise detalhada que mostra, de forma clara e objetiva:
          </p>
          
          <div className="space-y-3 mb-6">
            {beneficios.map((beneficio, index) => (
              <div 
                key={index}
                className="flex items-start gap-3"
              >
                <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{beneficio}</span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground text-center italic mb-6">
            Tudo isso antes de você perder tempo tentando crédito às cegas.
          </p>

          <div className="text-center">
            <Button 
              variant="cta" 
              size="lg" 
              asChild
              className="w-full sm:w-auto"
            >
              <a href="#oferta" className="flex flex-col sm:flex-row items-center justify-center">
                <span>QUERO MEU</span>
                <span className="sm:ml-1">DIAGNÓSTICO AGORA!</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Produto;
