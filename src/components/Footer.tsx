import logoFallback from "@/assets/logo-new.png";

const logoSrc = import.meta.env.VITE_LOGO_URL || logoFallback;

const Footer = () => {
  return <footer className="bg-card py-6 border-t border-border">
      <div className="container flex flex-col items-center gap-3">
        
        <img src={logoSrc} alt="Checkup Financeiro" className="h-12 mb-2" />
        <p className="text-sm text-muted-foreground">
          © 2024 Checkup Financeiro. Todos os direitos reservados.
        </p>
      </div>
    </footer>;
};
export default Footer;