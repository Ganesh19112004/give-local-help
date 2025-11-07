import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedNGOs from "@/components/FeaturedNGOs";
import NearbyNGOs from "@/components/NearbyNGOs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ✅ Header now from your UI */}
      <Header />

      {/* ✅ Main content from your favorite UI */}
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedNGOs />
        <NearbyNGOs />
      </main>

      {/* ✅ Add a small CTA section using your backend’s style */}
      <section className="py-20 bg-gradient-hero text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
            Join thousands of donors and NGOs working together to create positive change.
          </p>
          <Link to="/auth">
            <Button
              variant="secondary"
              size="lg"
              className="shadow-elevated transition-bounce hover:scale-105"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* ✅ Your beautiful footer */}
      <footer className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">DenaSetu</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connecting communities with local NGOs to create meaningful impact through direct donations.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">How it Works</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">NGO Registration</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Impact Stories</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Volunteer</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Categories</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Education</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Healthcare</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Shelter Support</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Emergency Relief</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 DenaSetu. Making local impact through community donations.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
