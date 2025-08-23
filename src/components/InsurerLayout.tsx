import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Shield, Settings, Bell, TrendingUp, LogOut, AlertTriangle, Upload, Cog, Calculator } from "lucide-react";
import InsurerUserManagement from "@/pages/InsurerUserManagement";
import InsurerProductConfig from "@/pages/InsurerProductConfig";
import InsurerBrokerAssignments from "@/pages/InsurerBrokerAssignments";
import insurerLogo from "@/assets/insurer-logo.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
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
function InsurerSidebar() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const getNavCls = (isActive: boolean) => isActive ? "bg-primary text-primary-foreground font-semibold shadow-md" : "hover:bg-muted/50 transition-all text-muted-foreground";
  const handleLogout = () => {
    // In real app, this would clear auth tokens, user session, etc.
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    toast({
      title: "Logged out successfully",
      description: "You have been securely logged out of the system."
    });

    // Redirect to login or home page
    navigate('/');
  };
  return <Sidebar className="border-r bg-gradient-to-b from-background to-muted/30">
      <SidebarHeader className="border-b bg-primary p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img src={insurerLogo} alt="Insurer Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Insurer Portal</h2>
            <p className="text-sm text-white/80">Emirates Insurance</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <div className="mb-6 p-3 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg border">
            <p className="text-sm font-medium text-foreground mb-1">Sarah Wilson</p>
            <p className="text-xs text-muted-foreground">Insurance Administrator</p>
          </div>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {sidebarItems.map(item => <SidebarMenuItem key={item.title}>
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
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
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
  return <SidebarProvider>
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
      </div>
    </SidebarProvider>;
}