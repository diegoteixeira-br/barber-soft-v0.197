import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Scissors, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gold/10 group-hover:bg-gold/20 transition-colors">
              <Scissors className="h-6 w-6 text-gold" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Barber<span className="text-gold">Soft</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("funcionalidades")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection("precos")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Preços
            </button>
            <button
              onClick={() => scrollToSection("depoimentos")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Depoimentos
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button className="bg-gold hover:bg-gold/90 text-black font-semibold glow-gold" asChild>
              <Link to="/auth?tab=signup">Testar Grátis</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("funcionalidades")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection("precos")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Preços
              </button>
              <button
                onClick={() => scrollToSection("depoimentos")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Depoimentos
              </button>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button className="w-full bg-gold hover:bg-gold/90 text-black font-semibold" asChild>
                  <Link to="/auth?tab=signup">Testar Grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
