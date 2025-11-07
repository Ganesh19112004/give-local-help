import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, MapPin, Calendar, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { format } from "date-fns";

interface Pickup {
  id: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  donation: {
    id: string;
    category: string;
    pickup_address: string;
    description: string;
    donor: {
      full_name: string;
      phone: string;
    };
    ngo: {
      name: string;
    };
    donation_items: Array<{
      item_name: string;
      quantity: number;
    }>;
  };
}

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [user, setUser] = useState<any>(null);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    const { data: volunteer } = await supabase
      .from("volunteers")
      .select("id")
      .eq("profile_id", session.user.id)
      .single();

    if (volunteer) {
      setVolunteerId(volunteer.id);
      fetchPickups(volunteer.id);
    } else {
      setLoading(false);
    }
  };

  const fetchPickups = async (volId: string) => {
    const { data, error } = await supabase
      .from("pickups")
      .select(`
        *,
        donation:donations(
          id,
          category,
          pickup_address,
          description,
          donor:profiles!donations_donor_id_fkey(full_name, phone),
          ngo:ngos(name),
          donation_items(item_name, quantity)
        )
      `)
      .eq("volunteer_id", volId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pickups:", error);
      toast({ title: "Error loading pickups", variant: "destructive" });
    } else {
      setPickups(data || []);
    }
    setLoading(false);
  };

  const updatePickupStatus = async (pickupId: string, newStatus: string) => {
    const { error } = await supabase
      .from("pickups")
      .update({ status: newStatus as "Assigned" | "En route" | "Picked Up" | "Delivered" | "Cancelled" })
      .eq("id", pickupId);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      toast({ title: `Status updated to ${newStatus}` });
      if (volunteerId) fetchPickups(volunteerId);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Assigned": "bg-blue-500",
      "En route": "bg-purple-500",
      "Picked Up": "bg-orange-500",
      "Delivered": "bg-green-500",
      "Cancelled": "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!volunteerId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Navigation role="volunteer" userName={user?.email} />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Not Registered as Volunteer</h2>
            <p className="text-muted-foreground">Please contact your NGO to register as a volunteer.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation role="volunteer" userName={user?.email} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Pickups</h1>

        {pickups.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No pickups assigned yet</p>
            <p className="text-muted-foreground">Check back later for new assignments</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pickups.map((pickup) => (
              <Card key={pickup.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold capitalize mb-1">
                      {pickup.donation.category} Donation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For {pickup.donation.ngo.name}
                    </p>
                  </div>
                  <Badge className={getStatusColor(pickup.status)}>
                    {pickup.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Pickup Address:</p>
                      <p className="text-sm text-muted-foreground">{pickup.donation.pickup_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Donor:</p>
                      <p className="text-sm text-muted-foreground">
                        {pickup.donation.donor.full_name} • {pickup.donation.donor.phone}
                      </p>
                    </div>
                  </div>

                  {pickup.scheduled_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        Scheduled: {format(new Date(pickup.scheduled_at), "PPp")}
                      </p>
                    </div>
                  )}

                  {pickup.donation.donation_items.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Items to pickup:</p>
                      <div className="flex flex-wrap gap-2">
                        {pickup.donation.donation_items.map((item, idx) => (
                          <Badge key={idx} variant="secondary">
                            {item.item_name} x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {pickup.status === "Assigned" && (
                    <Button onClick={() => updatePickupStatus(pickup.id, "En route")}>
                      Start Pickup
                    </Button>
                  )}
                  {pickup.status === "En route" && (
                    <Button onClick={() => updatePickupStatus(pickup.id, "Picked Up")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Picked Up
                    </Button>
                  )}
                  {pickup.status === "Picked Up" && (
                    <Button onClick={() => updatePickupStatus(pickup.id, "Delivered")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
