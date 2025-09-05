import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import siteLogo from "@/assets/logo.png";
import illustration from "@/assets/illustration.svg";
import { login, getBroker } from "@/lib/api";
import { setAuthToken } from "@/lib/api";
import { setAuthTokens, setAuthUser, setBrokerCompany } from "@/lib/auth";

const BrokerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await login({ email: formData.email, password: formData.password });
      setAuthToken(res.accessToken);
      setAuthTokens(res.accessToken, res.refreshToken);
      setAuthUser(res.user);

      if (res.user?.company_id) {
        try {
          const company = await getBroker(res.user.company_id);
          setBrokerCompany({ id: company.id, name: company.name, logo: company.companyLogo ?? null });
        } catch (e: any) {
          // Non-blocking if company fetch fails
        }
      }

      toast({ title: "Login Successful", description: `Welcome, ${res.user.email}!` });
      navigate("/broker/dashboard");
    } catch (err: any) {
      const message = err?.message || "Login failed";
      setErrorMessage(message);
      toast({ title: "Login Failed", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary/70 text-white">
        <div className="max-w-xl mx-auto my-auto px-12 py-16">
          <div className="mb-10">
            <img src={illustration} alt="Illustration" className="w-full max-w-md h-auto object-contain" />
          </div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold">CAR Platform</h2>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-4">Hey, Hello!</h1>
          <p className="text-white/70">
            We provide all the advantages that can simplify your marketplace operations without any further requirements.
          </p>
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-background to-secondary/20">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card className="shadow-medium rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Broker Login</CardTitle>
                <CardDescription>Let’s get started with your secure access.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {errorMessage && (
                    <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {errorMessage}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                  <Button type="submit" size="lg" className="w-full">
                    {isSubmitting ? "Signing In..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="pt-6 text-center text-muted-foreground flex items-center justify-center gap-2">
          <span className="text-sm md:text-base font-medium">Powered by</span>
          <img src={siteLogo} alt="AURA" className="h-5 w-auto object-contain" loading="eager" />
        </div>
      </div>
    </div>
  );
};

export default BrokerLogin;