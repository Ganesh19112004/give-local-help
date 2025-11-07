import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  const initialMode = searchParams.get("mode") || "donor";

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"donor" | "ngo" | "volunteer" | "admin">(
    initialMode as any
  );

  // Extra fields
  const [phone, setPhone] = useState("");
  const [ngoName, setNgoName] = useState("");
  const [ngoDescription, setNgoDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [adminDepartment, setAdminDepartment] = useState("");
  const [adminReason, setAdminReason] = useState("");

  // ✅ Check session & redirect user automatically
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await handleRedirect(session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) await handleRedirect(session.user.id);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ✅ Smart Redirect Based on Role
  const handleRedirect = async (userId: string) => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const role = userRole?.role || "donor"; // fallback if not found

      const routes: Record<string, string> = {
        admin: "/admin",
        ngo: "/ngo/dashboard",
        donor: "/donor/dashboard",
        volunteer: "/volunteer/dashboard",
      };

      navigate(routes[role]);
    } catch (error) {
      console.error("Error redirecting user:", error);
      navigate("/");
    }
  };

  // ✅ LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data?.user) {
        toast({ title: "Welcome back!", description: "Redirecting..." });
        await handleRedirect(data.user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth` },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In failed",
        description: error.message,
      });
    }
  };

  // ✅ SIGNUP
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanEmail = signupEmail.trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(cleanEmail))
        throw new Error("Please enter a valid email address.");

      if (!signupPassword || !fullName)
        throw new Error("Please fill in all required fields.");

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { full_name: fullName.trim(), role },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed. Please try again.");

      const userId = data.user.id;

      // Update profile info
      await supabase
        .from("profiles")
        .update({
          phone,
          address: role === "ngo" ? address : null,
          city: role === "ngo" ? city : null,
          state: role === "ngo" ? state : null,
          pincode: role === "ngo" ? pincode : null,
        })
        .eq("id", userId);

      if (role === "ngo") {
        const { data: ngoData, error: ngoError } = await supabase
          .from("ngos")
          .insert({
            profile_id: userId,
            name: ngoName,
            description: ngoDescription,
            address,
            city,
            state,
            pincode,
            active: false,
          })
          .select()
          .single();

        if (ngoError) throw ngoError;

        if (documents && documents.length > 0) {
          const file = documents[0];
          const filePath = `${userId}/registration.${file.name
            .split(".")
            .pop()}`;
          const { error: uploadError } = await supabase.storage
            .from("ngo-documents")
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          await supabase
            .from("ngos")
            .update({ registration_doc_path: filePath })
            .eq("id", ngoData.id);
        }

        toast({
          title: "NGO registration submitted",
          description: "Your application is pending admin approval.",
        });
      }

      if (role === "admin") {
        await supabase.from("pending_admins").insert({
          profile_id: userId,
          department: adminDepartment,
          reason: adminReason,
          status: "pending",
        });

        toast({
          title: "Admin access requested",
          description: "Your request is pending approval.",
        });
      }

      if (role === "donor" || role === "volunteer") {
        toast({
          title: "Signup successful",
          description: "Redirecting to your dashboard...",
        });
        await handleRedirect(userId);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Redirect UI
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Redirecting...</CardTitle>
            <CardDescription>Please wait while we redirect you.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl shadow-elevated">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Welcome to DonateConnect</CardTitle>
          <CardDescription className="text-center">
            Join our community of donors and NGOs
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Label>Email</Label>
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-3 flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </Button>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Label>Email</Label>
                <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                <Label>Password</Label>
                <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />

                <Label>Role</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="donor">Donor</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                {/* Role-specific fields */}
                {role === "ngo" && (
                  <>
                    <Label>NGO Name</Label>
                    <Input value={ngoName} onChange={(e) => setNgoName(e.target.value)} required />
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} required />
                    <Label>State</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} required />
                    <Label>Pincode</Label>
                    <Input value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                    <Label>Upload Registration Document</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocuments(e.target.files)} />
                  </>
                )}

                {role === "admin" && (
                  <>
                    <Label>Department (optional)</Label>
                    <Input value={adminDepartment} onChange={(e) => setAdminDepartment(e.target.value)} />
                    <Label>Reason for Access</Label>
                    <Textarea value={adminReason} onChange={(e) => setAdminReason(e.target.value)} required />
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-3 flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
