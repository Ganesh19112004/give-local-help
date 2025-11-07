import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Heart, PlusCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DonorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getUserAndDonations();
  }, []);

  const getUserAndDonations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const userId = session.user.id;
      setUser(session.user);

      // ✅ Fetch user's donations
      const { data: donationsData, error } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(donationsData || []);
    } catch (error) {
      console.error("Error loading donor dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-10">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {user?.user_metadata?.full_name || "Donor"} 👋
            </h1>
            <p className="text-muted-foreground">
              Manage your donations and track your impact.
            </p>
          </div>

          <Button
            onClick={() => navigate("/donor/create-donation")}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            New Donation
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Total Donations</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{donations.length}</p>
              <p className="text-sm text-muted-foreground">All-time donations</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Approved</CardTitle>
              <Heart className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {donations.filter((d) => d.status === "approved").length}
              </p>
              <p className="text-sm text-muted-foreground">Successful donations</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending</CardTitle>
              <Loader2 className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {donations.filter((d) => d.status === "pending").length}
              </p>
              <p className="text-sm text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Donations */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="p-3">Item</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 5).map((donation) => (
                      <tr
                        key={donation.id}
                        className="border-b hover:bg-muted/40 transition-colors"
                      >
                        <td className="p-3 font-medium">{donation.item_name}</td>
                        <td className="p-3">{donation.category}</td>
                        <td
                          className={`p-3 font-medium ${
                            donation.status === "approved"
                              ? "text-green-600"
                              : donation.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {donation.status}
                        </td>
                        <td className="p-3">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No donations yet. Start by creating one!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
