import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building, User, Shield, Briefcase, Building2, Home as HomeIcon, Plane, Lock, Package, Ship, Anchor } from "lucide-react";

interface InsuranceProduct {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  available: boolean;
}

const MastersProductSelection = () => {
  const navigate = useNavigate();
  const [isComingSoonDialogOpen, setIsComingSoonDialogOpen] = useState(false);

  const insuranceProducts: InsuranceProduct[] = [
    {
      code: 'CAR',
      name: 'Contractors All Risk Insurance',
      description: 'Covers construction projects against risks like damage to property and third-party injury/death during the construction period.',
      icon: <Building className="w-6 h-6" />,
      color: 'primary',
      category: 'CONSTRUCTION',
      available: true
    },
    {
      code: 'PI',
      name: 'Professional Indemnity Insurance',
      description: 'Protects professionals (e.g., architects, consultants, engineers) against claims of negligence, errors, or omissions in their services.',
      icon: <User className="w-6 h-6" />,
      color: 'primary',
      category: 'PROFESSIONAL',
      available: true
    },
    {
      code: 'CGL',
      name: 'Commercial General Liability Insurance',
      description: 'Provides coverage for businesses against third-party bodily injury, property damage, and personal or advertising injury claims.',
      icon: <Shield className="w-6 h-6" />,
      color: 'primary',
      category: 'COMMERCIAL',
      available: false
    },
    {
      code: 'DO',
      name: 'Directors & Officers Liability Insurance',
      description: 'Covers company directors and officers against legal claims arising from their decisions or actions taken while managing the company.',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'primary',
      category: 'COMMERCIAL',
      available: false
    },
    {
      code: 'OFFICE',
      name: 'Office Insurance',
      description: 'Covers office premises, equipment, and business assets against risks like fire, theft, and accidental damage.',
      icon: <Building2 className="w-6 h-6" />,
      color: 'primary',
      category: 'PROPERTY',
      available: false
    },
    {
      code: 'HOME',
      name: 'Home Insurance',
      description: 'Provides protection for residential buildings and household contents against risks like fire, burglary, natural disasters, etc.',
      icon: <HomeIcon className="w-6 h-6" />,
      color: 'primary',
      category: 'PROPERTY',
      available: false
    },
    {
      code: 'TRAVEL',
      name: 'Travel Insurance',
      description: 'Covers risks during travel such as trip cancellation, medical emergencies, lost luggage, and flight delays.',
      icon: <Plane className="w-6 h-6" />,
      color: 'primary',
      category: 'SPECIALTY',
      available: false
    },
    {
      code: 'CYBER',
      name: 'Cyber Liability Insurance',
      description: 'Protects businesses from losses due to cyberattacks, data breaches, and related legal liabilities.',
      icon: <Lock className="w-6 h-6" />,
      color: 'primary',
      category: 'SPECIALTY',
      available: false
    },
    {
      code: 'PAR',
      name: 'Property All Risk Insurance',
      description: 'Provides comprehensive coverage for physical loss or damage to property from any cause not specifically excluded (broader than standard fire insurance).',
      icon: <Package className="w-6 h-6" />,
      color: 'primary',
      category: 'PROPERTY',
      available: false
    },
    {
      code: 'MARINE_HULL',
      name: 'Marine Hull Insurance',
      description: 'Covers loss or damage to ships, vessels, or other watercraft and their machinery.',
      icon: <Ship className="w-6 h-6" />,
      color: 'primary',
      category: 'MARINE',
      available: false
    },
    {
      code: 'MARINE_CARGO',
      name: 'Marine Cargo Insurance',
      description: 'Protects goods in transit via sea, air, road, or rail against loss or damage during transportation.',
      icon: <Anchor className="w-6 h-6" />,
      color: 'primary',
      category: 'MARINE',
      available: false
    }
  ];

  const handleProductSelect = (product: InsuranceProduct) => {
    if (!product.available) {
      setIsComingSoonDialogOpen(true);
      return;
    }

    if (product.code === "CAR") {
      navigate("/market-admin/masters-management/car");
    } else if (product.code === "PI") {
      navigate("/market-admin/masters-management/pi");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Masters Management</h1>
            <p className="text-muted-foreground">Select a product to manage its master data and configurations</p>
          </div>

          {/* Insurance products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {insuranceProducts.map(product => (
              <ProductCard
                key={product.code}
                code={product.code}
                name={product.name}
                description={product.description}
                icon={product.icon}
                color="primary"
                onClick={() => handleProductSelect(product)}
              />
            ))}
          </div>

          {/* Coming Soon Dialog */}
          <Dialog open={isComingSoonDialogOpen} onOpenChange={setIsComingSoonDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Coming Soon</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground">
                  This insurance product configuration is currently under development and will be available soon.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default MastersProductSelection;

