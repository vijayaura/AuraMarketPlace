import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Shield, Settings, Bell, TrendingUp, LogOut, Package } from "lucide-react";
import auraLogo from "/lovable-uploads/a1521c76-be1d-45e9-8d86-5df99d190608.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/api";
import { getRefreshToken, clearAuth } from "@/lib/auth";
const sidebarItems = [{
  title: "Dashboard",
  url: "/market-admin/dashboard",
  icon: LayoutDashboard
}, {
  title: "Product Management",
  url: "/market-admin/product-management",
  icon: Package
}, {
  title: "Masters Management",
  url: "/market-admin/masters-management",
  icon: Settings
}, {
  title: "Insurer Management",
  url: "/market-admin/insurer-management",
  icon: Building2
}, {
  title: "Broker Management",
  url: "/market-admin/broker-management",
  icon: Users
}];
function MarketAdminSidebar() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const getNavCls = (isActive: boolean) => isActive ? "bg-primary text-primary-foreground font-semibold shadow-md" : "hover:bg-muted/50 transition-all text-muted-foreground";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const rt = getRefreshToken();
      if (rt) {
        await logout({ refreshToken: rt });
      } else {
        // No refresh token found – likely already expired or cleared
        toast({ title: 'Session expired', description: 'No refresh token found. Logging you out.' });
      }
    } catch (err: any) {
      // Best-effort logout; surface error if it looks like a missing/invalid refresh token
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) {
        toast({ title: 'Logout failed', description: message || 'Refresh token is required.' });
      }
    } finally {
      clearAuth();
      sessionStorage.clear();
      toast({ title: 'Logged out successfully' });
      navigate('/admin/login');
      setIsLoggingOut(false);
    }
  };
  return <Sidebar className="border-r bg-gradient-to-b from-background to-muted/30">
      <SidebarHeader className="border-b bg-primary p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img src={auraLogo} alt="Aura Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">CAR Platform</h2>
            <p className="text-sm text-white/80">Market Admin Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
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
              <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>;
}
export function MarketAdminLayout() {
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MarketAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b bg-gradient-to-r from-background to-muted/20 shadow-sm">
            <div className="flex items-center gap-4 px-6 w-full">
              <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Market Admin Portal</h1>
                <p className="text-sm text-muted-foreground">Comprehensive insurance marketplace management</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>;
}