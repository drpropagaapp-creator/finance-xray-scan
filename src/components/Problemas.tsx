import { Button } from "@/components/ui/button";

const problemas = [
  "Crédito negado sem explicação",
  "Banco diz \"perfil não aprovado\"",
  "Renda existe, mas o limite nunca vem",
  "Cartão não aumenta",
  "Financiamento ou empréstimo sempre recusado",
];

const Problemas = () => {
  return (
    <section className="py-12 animate-fade-in-up">
      <div className="container">
        <h2 className="font-display text-2xl md:text-3xl text-primary text-center mb-8">
          Você se identifica com alguma dessas situações?
        </h2>
        
        <div className="space-y-3 max-w-md mx-auto mb-8">
          {problemas.map((problema, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 text-foreground"
            >
              <span className="text-lg">❌</span>
              <span>{problema}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="cta" 
            size="lg" 
            asChild
            className="w-full sm:w-auto"
          >
            <a href="#oferta" className="flex flex-col sm:flex-row items-center justify-center">
              <span>DESCUBRA O MOTIVO</span>
              <span className="sm:ml-1">AGORA!</span>
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Problemas;
