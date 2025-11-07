import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle2, XCircle, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PendingStatus {
  type: "admin" | "ngo" | null;
  status: string;
  submittedAt: string;
  reason?: string;
  department?: string;
}

export default function Pending() {
  const [loading, setLoading] = useState(true);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus>({
    type: null,
    status: "pending",
    submittedAt: "",
  });
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkPendingStatus();
  }, []);

  const checkPendingStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || "");

      // Check if user already has a role
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (userRole?.role) {
        // User already approved, redirect to appropriate dashboard
        if (userRole.role === "admin") navigate("/admin");
        else if (userRole.role === "ngo") navigate("/ngo/dashboard");
        else if (userRole.role === "donor") navigate("/donor/dashboard");
        else if (userRole.role === "volunteer") navigate("/volunteer/dashboard");
        return;
      }

      // Check pending admin status
      const { data: pendingAdmin } = await supabase
        .from("pending_admins")
        .select("status, created_at, reason, department")
        .eq("profile_id", session.user.id)
        .maybeSingle();

      if (pendingAdmin) {
        setPendingStatus({
          type: "admin",
          status: pendingAdmin.status,
          submittedAt: pendingAdmin.created_at,
          reason: pendingAdmin.reason,
          department: pendingAdmin.department,
        });
        setLoading(false);
        return;
      }

      // Check pending NGO status
      const { data: ngo } = await supabase
        .from("ngos")
        .select("active, created_at")
        .eq("profile_id", session.user.id)
        .maybeSingle();

      if (ngo) {
        setPendingStatus({
          type: "ngo",
          status: ngo.active ? "approved" : "pending",
          submittedAt: ngo.created_at,
        });
        setLoading(false);
        return;
      }

      // If no pending status found, redirect to home
      navigate("/");
    } catch (error) {
      console.error("Error checking pending status:", error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getEstimatedWaitTime = () => {
    const submittedDate = new Date(pendingStatus.submittedAt);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysPassed < 1) return "Typically reviewed within 24-48 hours";
    if (daysPassed < 3) return "Should be reviewed soon";
    return "Taking longer than usual - contact support if urgent";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl shadow-elevated">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {pendingStatus.status === "pending" ? (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-10 w-10 text-primary" />
              </div>
            ) : pendingStatus.status === "approved" ? (
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {pendingStatus.status === "pending" && "Application Under Review"}
            {pendingStatus.status === "approved" && "Application Approved!"}
            {pendingStatus.status === "rejected" && "Application Not Approved"}
          </CardTitle>
          <CardDescription>
            {pendingStatus.type === "admin" ? "Admin Access Request" : "NGO Registration"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingStatus.status === "pending" ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Your application is being reviewed</AlertTitle>
                <AlertDescription>
                  Thank you for your patience. Our team is carefully reviewing your{" "}
                  {pendingStatus.type === "admin" ? "admin access request" : "NGO registration"}.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Review Time</p>
                    <p className="text-sm text-muted-foreground">{getEstimatedWaitTime()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Email Notification</p>
                    <p className="text-sm text-muted-foreground">
                      We'll send an email to <strong>{userEmail}</strong> once your application is reviewed.
                    </p>
                  </div>
                </div>

                {pendingStatus.department && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{pendingStatus.department}</p>
                  </div>
                )}

                {pendingStatus.reason && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">Your Request</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pendingStatus.reason}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">What happens next?</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Our team reviews your application and supporting documents</li>
                  <li>You'll receive an email with the decision</li>
                  <li>If approved, you can immediately access your dashboard</li>
                  <li>If additional information is needed, we'll reach out</li>
                </ol>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-2">Need urgent assistance?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Contact our support team at <a href="mailto:support@donateconnect.com" className="text-primary hover:underline">support@donateconnect.com</a>
                </p>
              </div>
            </>
          ) : pendingStatus.status === "approved" ? (
            <div className="text-center space-y-4">
              <p className="text-lg">
                Congratulations! Your {pendingStatus.type === "admin" ? "admin access" : "NGO registration"} has been approved.
              </p>
              <p className="text-muted-foreground">
                Click the button below to access your dashboard.
              </p>
              <Button 
                onClick={() => {
                  if (pendingStatus.type === "admin") navigate("/admin");
                  else navigate("/ngo/dashboard");
                }}
                size="lg"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Application Not Approved</AlertTitle>
                <AlertDescription>
                  Unfortunately, your application was not approved at this time.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                If you believe this was a mistake or would like to reapply with additional information, 
                please contact our support team at <a href="mailto:support@donateconnect.com" className="text-primary hover:underline">support@donateconnect.com</a>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleSignOut} className="flex-1">
              Sign Out
            </Button>
            {pendingStatus.status === "pending" && (
              <Button 
                variant="default" 
                onClick={checkPendingStatus}
                className="flex-1"
              >
                Refresh Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
