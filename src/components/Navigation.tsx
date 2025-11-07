import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Package, Users, Shield, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  role?: string;
  userName?: string;
}

export default function Navigation({ role, userName }: NavigationProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState(role || "");

  useEffect(() => {
    if (!role) fetchUserRole();
  }, [role]);

  // ✅ Fetch user role if not provided
  const fetchUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setUserRole(userRole?.role || "donor");
    }
  };

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  // ✅ Get dashboard link dynamically
  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "ngo") return "/ngo/dashboard";
    if (userRole === "donor") return "/donor/dashboard";
    if (userRole === "volunteer") return "/volunteer/dashboard";
    return "/";
  };

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">DonateConnect</span>
          </Link>

          <div className="flex items-center gap-4">
            {userRole ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                {userRole === "donor" && (
                  <>
                    <Link to="/donor/create-donation">
                      <Button variant="ghost" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Create Donation
                      </Button>
                    </Link>
                    <Link to="/donor/donations">
                      <Button variant="ghost" size="sm">
                        My Donations
                      </Button>
                    </Link>
                  </>
                )}

                {userRole === "ngo" && (
                  <Link to="/ngo/profile">
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                )}

                {userRole === "admin" && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{userName || "User"}</span>
                </div>

                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In / Sign Up</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
