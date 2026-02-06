import logoMain from "@/assets/logo-new.png";
const Footer = () => {
  return <footer className="bg-card py-6 border-t border-border">
      <div className="container flex flex-col items-center gap-3">
        
        <img src={logoMain} alt="Checkup Financeiro" className="h-12 mb-2" />
        <p className="text-sm text-muted-foreground">
          © 2024 Checkup Financeiro. Todos os direitos reservados.
        </p>
      </div>
    </footer>;
};
export default Footer;