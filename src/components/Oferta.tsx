import logoMain from "@/assets/logo-new.png";
const Oferta = () => {
  return <section id="oferta" className="py-12 md:py-16 bg-primary animate-fade-in-up">
      <div className="container">
        <div className="text-center text-primary-foreground">
          {/* Document mockup with logo */}
          <div className="relative mb-8 flex justify-center perspective-1000">
            <div className="relative" style={{
            perspective: '1000px'
          }}>
              {/* Stacked papers effect */}
              <div className="absolute top-3 left-3 w-48 h-64 md:w-56 md:h-72 bg-primary-foreground/20 rounded transform rotate-6"></div>
              <div className="absolute top-1.5 left-1.5 w-48 h-64 md:w-56 md:h-72 bg-primary-foreground/40 rounded transform rotate-3"></div>
              
              {/* Flipping pages animation */}
              <div className="absolute top-0 left-0 w-48 h-64 md:w-56 md:h-72 bg-primary-foreground rounded shadow-lg origin-left" style={{
              animation: 'pageFlip 3s ease-in-out infinite',
              animationDelay: '0.5s',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}>
                <div className="p-4 h-full flex flex-col">
                  <div className="h-1.5 bg-muted rounded w-full mb-2"></div>
                  <div className="h-1.5 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-1.5 bg-muted rounded w-5/6"></div>
                </div>
              </div>
              
              <div className="absolute top-0 left-0 w-48 h-64 md:w-56 md:h-72 bg-primary-foreground rounded shadow-lg origin-left" style={{
              animation: 'pageFlip 3s ease-in-out infinite',
              animationDelay: '1s',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}>
                <div className="p-4 h-full flex flex-col">
                  <div className="h-1.5 bg-muted rounded w-full mb-2"></div>
                  <div className="h-1.5 bg-muted rounded w-4/5 mb-2"></div>
                  <div className="h-1.5 bg-muted rounded w-2/3"></div>
                </div>
              </div>
              
              <div className="absolute top-0 left-0 w-48 h-64 md:w-56 md:h-72 bg-primary-foreground rounded shadow-lg origin-left" style={{
              animation: 'pageFlip 3s ease-in-out infinite',
              animationDelay: '1.5s',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}>
                <div className="p-4 h-full flex flex-col">
                  <div className="h-1.5 bg-muted rounded w-5/6 mb-2"></div>
                  <div className="h-1.5 bg-muted rounded w-full mb-2"></div>
                  <div className="h-1.5 bg-muted rounded w-3/4"></div>
                </div>
              </div>
              
              {/* Main document */}
              <div className="relative w-48 h-64 md:w-56 md:h-72 bg-primary-foreground rounded shadow-xl p-4 flex flex-col">
                {/* Document header */}
                <div className="flex items-center justify-center mb-3">
                  <img src={logoMain} alt="Checkup Financeiro" className="w-20 md:w-24 h-auto" />
                </div>
                {/* Document title */}
                <div className="text-center mb-3">
                  <div className="text-[8px] md:text-[10px] font-bold text-primary uppercase tracking-wider">Relatório de Análise</div>
                  <div className="text-[6px] md:text-[8px] text-muted-foreground">Diagnóstico Financeiro</div>
                </div>
                {/* Fake document lines */}
                <div className="flex-1 space-y-2">
                  <div className="h-1.5 bg-muted rounded w-full"></div>
                  <div className="h-1.5 bg-muted rounded w-4/5"></div>
                  <div className="h-1.5 bg-muted rounded w-full"></div>
                  <div className="h-1.5 bg-muted rounded w-3/4"></div>
                  <div className="mt-3 p-2 bg-muted/50 rounded">
                    <div className="h-1 bg-primary/30 rounded w-full mb-1"></div>
                    <div className="h-1 bg-primary/30 rounded w-2/3"></div>
                  </div>
                  <div className="h-1.5 bg-muted rounded w-full"></div>
                  <div className="h-1.5 bg-muted rounded w-5/6"></div>
                </div>
                {/* Document footer */}
                <div className="mt-auto pt-2 border-t border-muted">
                  <div className="h-1 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="font-display text-3xl md:text-4xl mb-2">
            Oferta especial
          </h2>
          <h3 className="font-display text-2xl md:text-3xl mb-6">
            Somente HOJE!
          </h3>
          
          <p className="text-primary-foreground/80 mb-2">
            Valor normal da avaliação individual...
          </p>
          <p className="text-destructive text-xl line-through mb-6">R$199,00</p>
          
          <p className="font-semibold mb-2">
            Somente hoje:
          </p>
          <p className="text-5xl md:text-7xl font-bold leading-none text-accent mb-6">
            R$99
          </p>
          
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Avaliação individual, personalizada, com análise real dos seus dados.
          </p>
          
          <a href="https://payfast.greenn.com.br/d542hpu" className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 bg-accent text-accent-foreground hover:bg-accent-light shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 min-h-14 px-6 py-4 text-base font-semibold rounded-lg transition-all duration-200 w-full sm:w-auto">
            <span>QUERO FAZER MEU</span>
            <span>DIAGNÓSTICO FINANCEIRO!</span>
          </a>
        </div>
      </div>
    </section>;
};
export default Oferta;