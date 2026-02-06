import CountdownBar from "@/components/CountdownBar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problemas from "@/components/Problemas";
import Educativo from "@/components/Educativo";
import Produto from "@/components/Produto";
import Aviso from "@/components/Aviso";
import Oferta from "@/components/Oferta";
import Footer from "@/components/Footer";
import PixelScripts from "@/components/PixelScripts";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pt-10">
      <PixelScripts />
      <CountdownBar />
      <Header />
      <main>
        <Hero />
        <Problemas />
        <Educativo />
        <Produto />
        <Aviso />
        <Oferta />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
