import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Shield, Settings, Bell, TrendingUp, LogOut, AlertTriangle, Upload, Cog, Calculator } from "lucide-react";
import InsurerUserManagement from "@/pages/InsurerUserManagement";
import InsurerProductConfig from "@/pages/InsurerProductConfig";
import InsurerBrokerAssignments from "@/pages/InsurerBrokerAssignments";
import insurerLogo from "@/assets/insurer-logo.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logout, type LogoutResponse } from "@/lib/api/auth";
import { getRefreshToken, clearAuth, getInsurerCompany, getInsurerCompanyId, setInsurerCompany, getAuthUser } from "@/lib/auth";
import { getInsurer } from "@/lib/api";
import type { AuthUser } from "@/lib/api/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UnsavedChangesProvider } from "@/hooks/use-unsaved-changes";
import SaveBar from "@/components/ui/SaveBar";
const sidebarItems = [{
  title: "Dashboard",
  url: "/insurer/dashboard",
  icon: LayoutDashboard
}, {
  title: "User Management",
  url: "/insurer/user-management",
  icon: Users
}, {
  title: "Product Management",
  url: "/insurer/product-config",
  icon: Cog
}, {
  title: "Broker Assignments",
  url: "/insurer/broker-assignments",
  icon: Calculator
}];
function toSentenceCase(value: string | null | undefined): string {
  if (!value) return '';
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function InsurerSidebar() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [company, setCompany] = useState(getInsurerCompany());
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const authUser = getAuthUser<AuthUser>();
  const visibleItems = (() => {
    const isAdmin = (authUser?.user_type || '').toLowerCase() === 'admin';
    if (isAdmin) return sidebarItems;
    return sidebarItems.filter((i) => i.url !== '/insurer/user-management');
  })();

  useEffect(() => {
    // Fetch company details if missing but we have a company_id
    if (!company) {
      const cid = getInsurerCompanyId();
      if (cid) {
        setCompanyLoading(true);
        setCompanyError(null);
        getInsurer(cid)
          .then((data) => {
            const stored = { id: data.id, name: data.name, logo: data.companyLogo ?? null };
            setInsurerCompany(stored);
            setCompany(stored);
          })
          .catch((err: any) => {
            const status = err?.status as number | undefined;
            const message = err?.message as string | undefined;
            if (status === 400) setCompanyError(message || 'Bad request while loading company.');
            else if (status === 401) setCompanyError('Unauthorized. Please log in again.');
            else if (status === 403) setCompanyError("You don't have access to this company.");
            else if (status && status >= 500) setCompanyError('Server error. Please try again later.');
            else setCompanyError(message || 'Failed to load company details.');
          })
          .finally(() => setCompanyLoading(false));
      }
    }
  }, []);
  const getNavCls = (isActive: boolean) => isActive ? "bg-primary text-primary-foreground font-semibold shadow-md" : "hover:bg-muted/50 transition-all text-muted-foreground";
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setLogoutError(null);
      const rt = getRefreshToken();
      if (rt) {
        await logout({ refreshToken: rt });
      }
      // Even if no refresh token, proceed to clear client state
      clearAuth();
      toast({ title: 'Logged out', description: 'You have been securely logged out.' });
      navigate('/');
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) setLogoutError(message || 'Bad request.');
      else if (status === 401) setLogoutError('Session expired.');
      else if (status === 403) setLogoutError("You don't have permission to logout.");
      else if (status && status >= 500) setLogoutError('Server error. Please try again later.');
      else setLogoutError(message || 'Failed to logout.');
    } finally {
      setLoggingOut(false);
    }
  };
  return <Sidebar className="border-r bg-gradient-to-b from-background to-muted/30">
      <SidebarHeader className="border-b bg-primary p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            {companyLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              <img src={company?.logo || insurerLogo} alt="Insurer Logo" className="w-8 h-8 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = insurerLogo; }} />
            )}
          </div>
          <div>
            {companyLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-white">{company?.name || 'Insurer Portal'}</h2>
                <p className="text-sm text-white/80">AURA CAR Platform</p>
              </>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {companyError && (
          <Alert variant="destructive" className="mb-3">
            <AlertTitle>Failed to load company</AlertTitle>
            <AlertDescription>{companyError}</AlertDescription>
          </Alert>
        )}
        {logoutError && (
          <Alert variant="destructive" className="mb-3">
            <AlertTitle>Logout failed</AlertTitle>
            <AlertDescription>{logoutError}</AlertDescription>
          </Alert>
        )}
        <SidebarGroup>
          <div className="mb-6 p-3 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg border">
            {companyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground mb-1">{authUser?.name || authUser?.email || 'User'}</p>
                <p className="text-xs text-muted-foreground">{toSentenceCase(authUser?.user_type)}</p>
              </>
            )}
          </div>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {visibleItems.map(item => <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} end className={({
                isActive
              }) => `${getNavCls(isActive)} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm`}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t bg-gradient-to-r from-muted/30 to-muted/50 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-destructive/10 hover:text-destructive transition-all" disabled={loggingOut}>
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{loggingOut ? 'Logging out...' : 'Log Out'}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You will need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>;
}
export function InsurerLayout() {
  const {
    toast
  } = useToast();
  const location = useLocation();
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [licenseData, setLicenseData] = useState({
    licenseNumber: "",
    validityFrom: "",
    validityTo: "",
    licenseImage: null as File | null
  });
  const handleLicenseUpdate = () => {
    // In real app, this would upload the license data to the backend
    toast({
      title: "License updated successfully",
      description: "Your insurer license has been updated and is under review."
    });
    setLicenseDialogOpen(false);
    setLicenseData({
      licenseNumber: "",
      validityFrom: "",
      validityTo: "",
      licenseImage: null
    });
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLicenseData(prev => ({
        ...prev,
        licenseImage: file
      }));
    }
  };
  return <UnsavedChangesProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <InsurerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b bg-gradient-to-r from-background to-muted/20 shadow-sm">
            <div className="flex items-center gap-4 px-6 w-full">
              <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Insurer Portal</h1>
                <p className="text-sm text-muted-foreground">Insurance provider management platform</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {location.pathname === "/insurer/user-management" ? <InsurerUserManagement /> : location.pathname === "/insurer/product-config" ? <InsurerProductConfig /> : location.pathname === "/insurer/broker-assignments" ? <InsurerBrokerAssignments /> : <Outlet />}
          </main>
        </div>
        <SaveBar />
      </div>
    </SidebarProvider>
  </UnsavedChangesProvider>;
}