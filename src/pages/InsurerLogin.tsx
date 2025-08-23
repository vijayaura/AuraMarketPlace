import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { Building, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const InsurerLogin = () => {
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "insurer@example.com",
    password: "insurer123"
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Login Successful",
      description: "Welcome to the Insurer Portal!",
    });
    navigate("/insurer/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-medium">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl">Insurer Portal Login</CardTitle>
              <CardDescription>
                Sign in to manage insurance applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="w-full" size="lg">
                  Sign In
                </Button>
              </form>
              
              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Demo credentials are pre-filled for testing
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigateBack("/")}
                  className="text-sm"
                >
                  ← Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InsurerLogin;