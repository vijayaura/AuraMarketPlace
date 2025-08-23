import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Users, Building, Shield } from "lucide-react";

const FlowSelection = () => {
  const navigate = useNavigate();
  // Clear navigation history on landing page to start fresh
  const { navigateBack } = useNavigationHistory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Contractor All Risk Platform
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose your access type to continue
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Broker Portal</CardTitle>
                <CardDescription className="text-base">
                  Manage contractor insurance quotes and applications
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Access your broker dashboard to manage quotes, track applications, and create new policies for clients.
                </p>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate("/broker/login")}
                >
                  Access Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Building className="w-8 h-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-2xl">Insurer Portal</CardTitle>
                <CardDescription className="text-base">
                  Review and manage insurance applications
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Access submitted applications, review quote requests, and manage policies for your customers.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/insurer/login")}
                >
                  Access Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Shield className="w-8 h-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">Market Admin</CardTitle>
                <CardDescription className="text-base">
                  Manage brokers and oversee all operations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Administrative access to manage broker users, view all quotes, and control platform settings.
                </p>
                <Button 
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate("/admin/login")}
                >
                  Access Admin Panel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FlowSelection;