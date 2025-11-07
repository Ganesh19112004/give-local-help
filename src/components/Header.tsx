import { Button } from "@/components/ui/button";
import { Heart, LogIn, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const { toast } = useToast();
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">LocalGive</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-smooth">
              Categories
            </Link>
            <Link to="/ngos" className="text-muted-foreground hover:text-foreground transition-smooth">
              NGOs
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth">
              How it Works
            </Link>
            <Link to="/impact" className="text-muted-foreground hover:text-foreground transition-smooth">
              Impact
            </Link>
          </nav>

          {/* Auth Buttons */}
          {loading ? (
            <div className="w-24 h-10 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link to={isAdmin ? "/admin-dashboard" : "/dashboard"}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
            >
              {/* ✅ Updated path from /signin → /auth */}
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
