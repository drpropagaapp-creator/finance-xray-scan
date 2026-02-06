import { Button } from "@/components/ui/button";
import logoFallback from "@/assets/logo-new.png";

const logoSrc = import.meta.env.VITE_LOGO_URL || logoFallback;

const Hero = () => {
  return <section className="bg-gradient-to-b from-card to-background pt-6 pb-12 md:pb-16 text-center animate-fade-in-up">
      <div className="container">
        <img src={logoSrc} alt="Checkup Financeiro" className="h-36 md:h-48 w-auto mx-auto mb-6" />
        
        
        
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-primary mb-4 leading-tight">
          Seu crédito não é negado por acaso.
        </h1>
        
        <p className="text-lg font-medium text-foreground mb-3">
          Existe um motivo — e ele aparece nos sistemas bancários.
        </p>
        
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
          Descubra o que realmente está travando seu crédito, mesmo que seu nome pareça "limpo".
        </p>

        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-[280px] aspect-[9/16] rounded-xl overflow-hidden shadow-xl">
            <iframe src="https://www.youtube.com/embed/08d6b7Pm4H4" title="Diagnóstico Financeiro" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
          </div>
        </div>
        
        <Button variant="cta" size="lg" asChild className="w-full sm:w-auto">
          <a href="#oferta" className="flex flex-col sm:flex-row items-center justify-center">
            <span>QUERO FAZER MEU</span>
            <span className="sm:ml-1">DIAGNÓSTICO FINANCEIRO!</span>
          </a>
        </Button>
      </div>
    </section>;
};
export default Hero;