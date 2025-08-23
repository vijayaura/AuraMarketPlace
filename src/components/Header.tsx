import { Link, useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Shield, Phone, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
export const Header = () => {
  const navigate = useNavigate();
  const {
    navigateBack
  } = useNavigationHistory();
  return <header className="bg-card border-b shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/broker/dashboard")} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold text-foreground">CAR Insurance Application</h1>
            <Link to="/" className="flex items-center space-x-3">
              <img src="/lovable-uploads/bdde1c6a-a5e3-472f-8114-0bc05f7a216d.png" alt="AURA Logo" className="h-12 w-auto" />
            </Link>
          </div>
          
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>info@aurainsure.tech</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>;
};