import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Building2, Users, Package, Shield, FileText, BarChart3, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface PendingNGO {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

interface PendingAdmin {
  id: string;
  profile_id: string;
  department: string;
  reason: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingNGOs, setPendingNGOs] = useState<PendingNGO[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [allNGOs, setAllNGOs] = useState<any[]>([]);
  const [allDonors, setAllDonors] = useState<any[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    totalNGOs: 0, 
    totalDonors: 0, 
    totalDonations: 0,
    activeNGOs: 0,
    totalVolunteers: 0,
    pendingApprovals: 0
  });
  const [user, setUser] = useState<any>(null);

  // Filters
  const [donationStatusFilter, setDonationStatusFilter] = useState("all");
  const [donationCategoryFilter, setDonationCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have admin privileges.",
      });
      navigate("/");
      return;
    }

    setUser(session.user);
    await Promise.all([
      fetchPendingNGOs(),
      fetchPendingAdmins(),
      fetchAllNGOs(),
      fetchAllDonors(),
      fetchAllVolunteers(),
      fetchAllDonations(),
      fetchAuditLogs(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchPendingNGOs = async () => {
    const { data, error } = await supabase
      .from("ngos")
      .select(`
        *,
        profiles!ngos_profile_id_fkey (
          full_name,
          phone
        )
      `)
      .eq("active", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingNGOs(data as any);
    }
  };

  const fetchPendingAdmins = async () => {
    const { data, error } = await supabase
      .from("pending_admins")
      .select(`
        *,
        profiles!pending_admins_profile_id_fkey (
          full_name,
          email:id
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch emails separately
      const adminsWithEmails = await Promise.all(
        data.map(async (admin: any) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(admin.profile_id);
          return {
            ...admin,
            profiles: {
              ...admin.profiles,
              email: user?.email || 'Unknown'
            }
          };
        })
      );
      setPendingAdmins(adminsWithEmails as any);
    }
  };

  const fetchAllNGOs = async () => {
    const { data } = await supabase
      .from("ngos")
      .select(`
        *,
        profiles!ngos_profile_id_fkey (full_name, phone)
      `)
      .order("created_at", { ascending: false });

    if (data) setAllNGOs(data);
  };

  const fetchAllDonors = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        donations:donations!donations_donor_id_fkey(count)
      `)
      .eq("role", "donor")
      .order("created_at", { ascending: false });

    if (data) setAllDonors(data);
  };

  const fetchAllVolunteers = async () => {
    const { data } = await supabase
      .from("volunteers")
      .select(`
        *,
        profiles!volunteers_profile_id_fkey (full_name, phone, email:id),
        ngos!volunteers_ngo_id_fkey (name),
        pickups:pickups!pickups_volunteer_id_fkey(count)
      `)
      .order("created_at", { ascending: false });

    if (data) setAllVolunteers(data);
  };

  const fetchAllDonations = async () => {
    const { data } = await supabase
      .from("donations")
      .select(`
        *,
        profiles!donations_donor_id_fkey (full_name, email:id),
        ngos!donations_ngo_id_fkey (name, city)
      `)
      .order("created_at", { ascending: false });

    if (data) setAllDonations(data);
  };

  const fetchAuditLogs = async () => {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setAuditLogs(data);
  };

  const fetchStats = async () => {
    const [ngosRes, activeNGOsRes, donorsRes, donationsRes, volunteersRes, pendingNGOsRes] = await Promise.all([
      supabase.from("ngos").select("id", { count: "exact", head: true }),
      supabase.from("ngos").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "donor"),
      supabase.from("donations").select("id", { count: "exact", head: true }),
      supabase.from("volunteers").select("id", { count: "exact", head: true }),
      supabase.from("ngos").select("id", { count: "exact", head: true }).eq("active", false),
    ]);

    setStats({
      totalNGOs: ngosRes.count || 0,
      activeNGOs: activeNGOsRes.count || 0,
      totalDonors: donorsRes.count || 0,
      totalDonations: donationsRes.count || 0,
      totalVolunteers: volunteersRes.count || 0,
      pendingApprovals: pendingNGOsRes.count || 0,
    });
  };

  const handleApproveNGO = async (ngoId: string, profileId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get NGO details before updating
    const ngo = pendingNGOs.find(n => n.id === ngoId);
    if (!ngo) return;

    const { error } = await supabase
      .from("ngos")
      .update({
        active: true,
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", ngoId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve NGO.",
      });
    } else {
      // Get user email for notification
      const { data: { user } } = await supabase.auth.admin.getUserById(profileId);
      
      // Send approval email
      if (user?.email) {
        try {
          await supabase.functions.invoke("send-approval-email", {
            body: {
              email: user.email,
              name: ngo.profiles.full_name,
              type: "ngo",
              status: "approved",
            },
          });
        } catch (emailError) {
          console.error("Failed to send approval email:", emailError);
        }
      }

      toast({
        title: "Success",
        description: "NGO approved successfully and notified via email!",
      });
      
      await supabase.from("audit_logs").insert({
        actor_id: session.user.id,
        action: "NGO_APPROVED",
        target_table: "ngos",
        target_id: ngoId,
        details: { ngo_id: ngoId, profile_id: profileId },
      });

      fetchPendingNGOs();
      fetchAllNGOs();
      fetchStats();
    }
  };

  const handleRejectNGO = async (ngoId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get NGO details before deleting
    const ngo = pendingNGOs.find(n => n.id === ngoId);

    const { error } = await supabase
      .from("ngos")
      .delete()
      .eq("id", ngoId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject NGO.",
      });
    } else {
      // Send rejection email if NGO details are available
      if (ngo) {
        const { data: { user } } = await supabase.auth.admin.getUserById(ngo.profile_id);
        
        if (user?.email) {
          try {
            await supabase.functions.invoke("send-approval-email", {
              body: {
                email: user.email,
                name: ngo.profiles.full_name,
                type: "ngo",
                status: "rejected",
                reason: "Your NGO registration did not meet our verification requirements.",
              },
            });
          } catch (emailError) {
            console.error("Failed to send rejection email:", emailError);
          }
        }
      }

      toast({
        title: "NGO rejected",
        description: "The NGO application has been rejected and user notified.",
      });

      await supabase.from("audit_logs").insert({
        actor_id: session.user.id,
        action: "NGO_REJECTED",
        target_table: "ngos",
        target_id: ngoId,
        details: { ngo_id: ngoId },
      });

      fetchPendingNGOs();
      fetchStats();
    }
  };

  const handleApproveAdmin = async (adminRequestId: string, profileId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get admin details before updating
    const adminRequest = pendingAdmins.find(a => a.id === adminRequestId);
    if (!adminRequest) return;

    // Update pending_admins status
    const { error: updateError } = await supabase
      .from("pending_admins")
      .update({
        status: "approved",
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", adminRequestId);

    if (updateError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve admin request.",
      });
      return;
    }

    // Add admin role to user_roles
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: profileId,
        role: "admin",
      });

    if (roleError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign admin role.",
      });
      return;
    }

    // Update profile role
    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", profileId);

    // Send approval email
    try {
      await supabase.functions.invoke("send-approval-email", {
        body: {
          email: adminRequest.profiles.email,
          name: adminRequest.profiles.full_name,
          type: "admin",
          status: "approved",
        },
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the approval if email fails
    }

    toast({
      title: "Admin approved",
      description: "User has been granted admin access and notified via email.",
    });

    await supabase.from("audit_logs").insert({
      actor_id: session.user.id,
      action: "ADMIN_APPROVED",
      target_table: "pending_admins",
      target_id: adminRequestId,
      details: { profile_id: profileId },
    });

    fetchPendingAdmins();
  };

  const handleRejectAdmin = async (adminRequestId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get admin details before updating
    const adminRequest = pendingAdmins.find(a => a.id === adminRequestId);
    if (!adminRequest) return;

    const { error } = await supabase
      .from("pending_admins")
      .update({
        status: "rejected",
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", adminRequestId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject admin request.",
      });
    } else {
      // Send rejection email
      try {
        await supabase.functions.invoke("send-approval-email", {
          body: {
            email: adminRequest.profiles.email,
            name: adminRequest.profiles.full_name,
            type: "admin",
            status: "rejected",
            reason: "Your application did not meet our current requirements.",
          },
        });
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      toast({
        title: "Request rejected",
        description: "Admin access request has been rejected and user notified.",
      });

      await supabase.from("audit_logs").insert({
        actor_id: session.user.id,
        action: "ADMIN_REJECTED",
        target_table: "pending_admins",
        target_id: adminRequestId,
      });

      fetchPendingAdmins();
    }
  };

  const toggleNGOStatus = async (ngoId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ngos")
      .update({ active: !currentStatus })
      .eq("id", ngoId);

    if (!error) {
      toast({
        title: "Status updated",
        description: `NGO is now ${!currentStatus ? "active" : "inactive"}.`,
      });
      fetchAllNGOs();
      fetchStats();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Requested: "bg-blue-100 text-blue-800",
      Accepted: "bg-green-100 text-green-800",
      "Volunteer Assigned": "bg-purple-100 text-purple-800",
      "Picked Up": "bg-indigo-100 text-indigo-800",
      Delivered: "bg-emerald-100 text-emerald-800",
      Cancelled: "bg-red-100 text-red-800",
      Rejected: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredDonations = allDonations.filter((donation) => {
    const matchesStatus = donationStatusFilter === "all" || donation.status === donationStatusFilter;
    const matchesCategory = donationCategoryFilter === "all" || donation.category === donationCategoryFilter;
    const matchesSearch = searchTerm === "" || 
      donation.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.ngos?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage platform & approvals</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total NGOs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.totalNGOs}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.activeNGOs} active</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-secondary">{stats.totalDonors}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">{stats.totalDonations}</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volunteers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalVolunteers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending-ngos" className="w-full">
          <TabsList className="mb-8 flex-wrap h-auto">
            <TabsTrigger value="pending-ngos">
              Pending NGOs
              {pendingNGOs.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingNGOs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending-admins">
              Pending Admins
              {pendingAdmins.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingAdmins.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-ngos">All NGOs</TabsTrigger>
            <TabsTrigger value="all-donors">All Donors</TabsTrigger>
            <TabsTrigger value="all-volunteers">All Volunteers</TabsTrigger>
            <TabsTrigger value="all-donations">All Donations</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
          </TabsList>

          {/* Pending NGOs Tab */}
          <TabsContent value="pending-ngos">
            <h2 className="text-2xl font-bold mb-6">Pending NGO Approvals</h2>
            {pendingNGOs.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending NGO applications.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingNGOs.map((ngo) => (
                  <Card key={ngo.id} className="shadow-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{ngo.name}</CardTitle>
                          <CardDescription>
                            Applied on {new Date(ngo.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Description:</p>
                          <p className="text-sm text-muted-foreground">
                            {ngo.description || "No description provided"}
                          </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Contact Person:</p>
                            <p className="text-sm text-muted-foreground">{ngo.profiles?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Phone:</p>
                            <p className="text-sm text-muted-foreground">
                              {ngo.profiles?.phone || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Address:</p>
                          <p className="text-sm text-muted-foreground">
                            {ngo.address}, {ngo.city}, {ngo.state} - {ngo.pincode}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="default"
                            onClick={() => handleApproveNGO(ngo.id, ngo.profiles?.full_name)}
                          >
                            Approve NGO
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectNGO(ngo.id)}
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
          </TabsContent>

          {/* Pending Admins Tab */}
          <TabsContent value="pending-admins">
            <h2 className="text-2xl font-bold mb-6">Pending Admin Requests</h2>
            {pendingAdmins.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending admin requests.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingAdmins.map((admin) => (
                  <Card key={admin.id} className="shadow-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{admin.profiles?.full_name}</CardTitle>
                          <CardDescription>{admin.profiles?.email}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500">
                          Pending Review
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {admin.department && (
                          <div>
                            <p className="text-sm font-medium mb-1">Department:</p>
                            <p className="text-sm text-muted-foreground">{admin.department}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium mb-1">Reason for Admin Access:</p>
                          <p className="text-sm text-muted-foreground">{admin.reason}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Requested on:</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(admin.created_at), "PPP")}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="default"
                            onClick={() => handleApproveAdmin(admin.id, admin.profile_id)}
                          >
                            Approve Admin
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectAdmin(admin.id)}
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
          </TabsContent>

          {/* All NGOs Tab */}
          <TabsContent value="all-ngos">
            <h2 className="text-2xl font-bold mb-6">All NGOs</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allNGOs.map((ngo) => (
                      <TableRow key={ngo.id}>
                        <TableCell className="font-medium">{ngo.name}</TableCell>
                        <TableCell>{ngo.city}, {ngo.state}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{ngo.profiles?.full_name}</div>
                            <div className="text-muted-foreground">{ngo.profiles?.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ngo.active ? "default" : "secondary"}>
                            {ngo.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleNGOStatus(ngo.id, ngo.active)}
                          >
                            {ngo.active ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Donors Tab */}
          <TabsContent value="all-donors">
            <h2 className="text-2xl font-bold mb-6">All Donors</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total Donations</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDonors.map((donor) => (
                      <TableRow key={donor.id}>
                        <TableCell className="font-medium">{donor.full_name}</TableCell>
                        <TableCell>
                          {donor.city ? `${donor.city}, ${donor.state}` : "Not specified"}
                        </TableCell>
                        <TableCell>{donor.phone || "Not provided"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{donor.donations?.[0]?.count || 0}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(donor.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Volunteers Tab */}
          <TabsContent value="all-volunteers">
            <h2 className="text-2xl font-bold mb-6">All Volunteers</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>NGO</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Pickups Completed</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVolunteers.map((volunteer) => (
                      <TableRow key={volunteer.id}>
                        <TableCell className="font-medium">{volunteer.profiles?.full_name}</TableCell>
                        <TableCell>{volunteer.ngos?.name}</TableCell>
                        <TableCell>{volunteer.phone || volunteer.profiles?.phone || "Not provided"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{volunteer.pickups?.[0]?.count || 0}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(volunteer.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Donations Tab */}
          <TabsContent value="all-donations">
            <h2 className="text-2xl font-bold mb-6">All Donations</h2>
            <Card className="shadow-card mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <Input
                      placeholder="Search by donor or NGO..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={donationStatusFilter} onValueChange={setDonationStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Requested">Requested</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Volunteer Assigned">Volunteer Assigned</SelectItem>
                        <SelectItem value="Picked Up">Picked Up</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={donationCategoryFilter} onValueChange={setDonationCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="clothes">Clothes</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="stationary">Stationary</SelectItem>
                        <SelectItem value="money">Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>NGO</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="font-medium capitalize">{donation.category}</TableCell>
                        <TableCell>{donation.profiles?.full_name || "Unknown"}</TableCell>
                        <TableCell>{donation.ngos?.name || "Not assigned"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(donation.status)}>
                            {donation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {donation.amount ? `₹${donation.amount}` : "-"}
                        </TableCell>
                        <TableCell>{format(new Date(donation.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDonations.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No donations found matching your filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs">
            <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target Table</TableHead>
                      <TableHead>Actor ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), "PPpp")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.target_table}</TableCell>
                        <TableCell className="font-mono text-xs">{log.actor_id?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {JSON.stringify(log.details)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {auditLogs.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Overview Tab */}
          <TabsContent value="overview">
            <h2 className="text-2xl font-bold mb-6">System Overview</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Users (All Roles)</span>
                      <span className="text-lg font-semibold">
                        {stats.totalDonors + stats.totalVolunteers + allNGOs.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active NGOs</span>
                      <span className="text-lg font-semibold">{stats.activeNGOs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pending Approvals</span>
                      <Badge variant="destructive">{stats.pendingApprovals}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <span className="text-lg font-semibold">
                        {stats.totalDonations > 0 
                          ? Math.round((allDonations.filter(d => d.status === "Delivered").length / stats.totalDonations) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <Badge variant="outline" className="text-xs">{log.action}</Badge>
                        <span className="text-muted-foreground">
                          {format(new Date(log.created_at), "PPp")}
                        </span>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-muted-foreground text-sm">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Donation Statistics by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
                  {["books", "clothes", "electronics", "stationary", "money"].map((category) => {
                    const count = allDonations.filter(d => d.category === category).length;
                    return (
                      <div key={category} className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground capitalize">{category}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;