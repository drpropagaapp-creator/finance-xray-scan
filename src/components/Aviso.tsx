import { AlertTriangle } from "lucide-react";

const Aviso = () => {
  return (
    <section className="pb-12 animate-fade-in-up">
      <div className="container">
        <div className="bg-warning-bg border border-warning rounded-lg p-5 flex gap-3 items-start">
          <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
          <p className="text-sm text-warning-foreground leading-relaxed">
            <strong>Importante:</strong> Isso não é promessa de aprovação. É diagnóstico, clareza e estratégia. Você vai saber exatamente onde está o problema e o que precisa ser corrigido.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Aviso;
