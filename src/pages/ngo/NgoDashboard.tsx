import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, AlertCircle, Package, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NGOData {
  id: string;
  name: string;
  active: boolean;
}

interface Donation {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  pickup_address: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

const NgoDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ngoData, setNgoData] = useState<NGOData | null>(null);
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [activeDonations, setActiveDonations] = useState<Donation[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "ngo") {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "This area is for NGOs only.",
      });
      navigate("/");
      return;
    }

    setUser(profile);
    await fetchNGOData(session.user.id);
    setLoading(false);
  };

  const fetchNGOData = async (userId: string) => {
    const { data: ngo, error } = await supabase
      .from("ngos")
      .select("*")
      .eq("profile_id", userId)
      .single();

    if (error) {
      console.error("Error fetching NGO data:", error);
      return;
    }

    setNgoData(ngo);

    if (ngo?.active) {
      fetchDonations(ngo.id);
    }
  };

  const fetchDonations = async (ngoId: string) => {
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
        profiles (
          full_name,
          phone
        )
      `)
      .eq("ngo_id", ngoId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching donations:", error);
      return;
    }

    const pending = data?.filter((d) => d.status === "Requested") || [];
    const active = data?.filter((d) => d.status !== "Requested" && d.status !== "Delivered" && d.status !== "Cancelled" && d.status !== "Rejected") || [];
    
    setPendingDonations(pending);
    setActiveDonations(active);
  };

  const handleAcceptDonation = async (donationId: string) => {
    const { error } = await supabase
      .from("donations")
      .update({ status: "Accepted" })
      .eq("id", donationId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept donation.",
      });
    } else {
      toast({
        title: "Success",
        description: "Donation accepted successfully!",
      });
      if (ngoData) fetchDonations(ngoData.id);
    }
  };

  const handleRejectDonation = async (donationId: string) => {
    const { error } = await supabase
      .from("donations")
      .update({ status: "Rejected" })
      .eq("id", donationId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject donation.",
      });
    } else {
      toast({
        title: "Success",
        description: "Donation rejected.",
      });
      if (ngoData) fetchDonations(ngoData.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ngoData?.active) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-2xl shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-yellow-500" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Your NGO application is under review</AlertTitle>
              <AlertDescription>
                Thank you for registering! Our admin team is reviewing your application. 
                You'll receive an email notification once your NGO is approved and you can start 
                accepting donations.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">{ngoData.name}</h1>
            <p className="text-sm text-muted-foreground">NGO Dashboard</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{pendingDonations.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{activeDonations.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-500">Active</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Pending Donation Requests */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Pending Donation Requests</h2>
          
          {pendingDonations.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending donation requests at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingDonations.map((donation) => (
                <Card key={donation.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{donation.profiles?.full_name}</CardTitle>
                        <CardDescription>
                          Category: {donation.category} | {new Date(donation.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{donation.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm text-muted-foreground">
                          {donation.description || "No description provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Pickup Address:</p>
                        <p className="text-sm text-muted-foreground">{donation.pickup_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Contact:</p>
                        <p className="text-sm text-muted-foreground">{donation.profiles?.phone || "No phone provided"}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="success"
                          onClick={() => handleAcceptDonation(donation.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectDonation(donation.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Active Donations */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Active Donations</h2>
          
          {activeDonations.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active donations to track.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {activeDonations.map((donation) => (
                <Card key={donation.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-500">{donation.status}</Badge>
                      <Badge variant="outline">{donation.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{donation.profiles?.full_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {donation.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NgoDashboard;
