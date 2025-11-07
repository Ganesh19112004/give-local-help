import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Package, Calendar, MapPin, Eye } from "lucide-react";
import Navigation from "@/components/Navigation";
import { format } from "date-fns";

interface Donation {
  id: string;
  category: string;
  status: string;
  description: string;
  amount: number | null;
  pickup_address: string;
  preferred_pickup_date: string | null;
  created_at: string;
  ngo: {
    name: string;
    city: string;
  } | null;
  donation_items: Array<{
    item_name: string;
    quantity: number;
    condition: string;
    image_path: string | null;
  }>;
}

export default function DonorDonations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [searchTerm, filterStatus, donations]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchDonations(session.user.id);
  };

  const fetchDonations = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
        ngo:ngos(name, city),
        donation_items(item_name, quantity, condition, image_path)
      `)
      .eq("donor_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching donations:", error);
    } else {
      setDonations(data || []);
      setFilteredDonations(data || []);
    }
    setLoading(false);
  };

  const filterDonations = () => {
    let filtered = donations;

    if (filterStatus !== "all") {
      filtered = filtered.filter(d => d.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ngo?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDonations(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Requested": "bg-yellow-500",
      "Accepted": "bg-blue-500",
      "Volunteer Assigned": "bg-purple-500",
      "Picked Up": "bg-orange-500",
      "Delivered": "bg-green-500",
      "Cancelled": "bg-red-500",
      "Rejected": "bg-gray-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("donation-items").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation role="donor" userName={user?.email} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Donations</h1>
          <Button onClick={() => navigate("/donor/create-donation")}>
            + Create Donation
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by category, description, or NGO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="requested">Requested</option>
              <option value="accepted">Accepted</option>
              <option value="volunteer assigned">Volunteer Assigned</option>
              <option value="picked up">Picked Up</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </Card>

        {/* Donations List */}
        {filteredDonations.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No donations found</p>
            <p className="text-muted-foreground mb-4">Start making a difference today</p>
            <Button onClick={() => navigate("/donor/create-donation")}>
              Create Your First Donation
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDonations.map((donation) => (
              <Card key={donation.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Images */}
                  {donation.donation_items.length > 0 && donation.donation_items[0].image_path && (
                    <div className="flex gap-2">
                      {donation.donation_items.slice(0, 3).map((item, idx) => (
                        item.image_path && (
                          <img
                            key={idx}
                            src={getImageUrl(item.image_path) || ''}
                            alt={item.item_name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )
                      ))}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1 capitalize">{donation.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          {donation.ngo?.name || "NGO not assigned"} • {donation.ngo?.city}
                        </p>
                      </div>
                      <Badge className={getStatusColor(donation.status)}>
                        {donation.status}
                      </Badge>
                    </div>

                    {donation.description && (
                      <p className="text-sm mb-3">{donation.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {donation.category === "money" ? (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Amount: ₹{donation.amount}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {donation.donation_items.length} item(s)
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(donation.created_at), "PPP")}
                      </div>
                      {donation.pickup_address && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <MapPin className="h-4 w-4" />
                          {donation.pickup_address}
                        </div>
                      )}
                    </div>

                    {donation.donation_items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {donation.donation_items.map((item, idx) => (
                            <Badge key={idx} variant="secondary">
                              {item.item_name} x{item.quantity} ({item.condition})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
