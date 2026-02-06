import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const informacoes = [
  "Dívidas internas registradas no Banco Central",
  "Prejuízos lançados por instituições financeiras",
  "Risco de crédito do seu CPF",
  "Classificação do seu rating bancário",
  "Capacidade real de pagamento mensal",
  "Limite de crédito sugerido pelo sistema",
  "Alertas internos de restrição",
  "CCF (cheque sem fundo), se existir",
  "Protestos ativos, se houver",
];

const Educativo = () => {
  return (
    <section className="py-12 bg-card animate-fade-in-up">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl text-primary mb-2">
            Os bancos não analisam somente o SPC e o Serasa...
          </h2>
          <p className="text-muted-foreground">
            Eles usam sistemas internos, que mostram informações como:
          </p>
        </div>
        
        <div className="space-y-2.5 mb-6">
          {informacoes.map((info, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 bg-background rounded-md text-sm"
            >
              <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{info}</span>
            </div>
          ))}
        </div>
        
        <div className="text-center font-medium p-4 border-l-4 border-accent bg-background rounded-r-md text-foreground mb-8">
          E se você não vê isso, você não sabe o motivo real da negativa.
        </div>

        <div className="text-center">
          <Button 
            variant="cta" 
            size="lg" 
            asChild
            className="w-full sm:w-auto"
          >
            <a href="#oferta" className="flex flex-col sm:flex-row items-center justify-center">
              <span>VEJA O QUE OS BANCOS</span>
              <span className="sm:ml-1">ENXERGAM SOBRE VOCÊ!</span>
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Educativo;
