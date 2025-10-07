import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Building, User, Shield, Briefcase, Home as HomeIcon, Plane, Lock, Package, Ship, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsuranceProduct {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const ProductSelection = () => {
  const navigate = useNavigate();

  const insuranceProducts: InsuranceProduct[] = [
    {
      code: 'CAR',
      name: 'Contractors All Risk Insurance',
      description: 'Covers construction projects against risks like damage to property and third-party injury/death during the construction period.',
      icon: <Building className="w-6 h-6" />,
      color: 'primary',
      category: 'CONSTRUCTION'
    },
    {
      code: 'PI',
      name: 'Professional Indemnity Insurance',
      description: 'Protects professionals (e.g., architects, consultants, engineers) against claims of negligence, errors, or omissions in their services.',
      icon: <User className="w-6 h-6" />,
      color: 'primary',
      category: 'PROFESSIONAL'
    },
    {
      code: 'CGL',
      name: 'Commercial General Liability Insurance',
      description: 'Provides coverage for businesses against third-party bodily injury, property damage, and personal or advertising injury claims.',
      icon: <Shield className="w-6 h-6" />,
      color: 'primary',
      category: 'COMMERCIAL'
    },
    {
      code: 'DO',
      name: 'Directors & Officers Liability Insurance',
      description: 'Covers company directors and officers against legal claims arising from their decisions or actions taken while managing the company.',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'primary',
      category: 'COMMERCIAL'
    },
    {
      code: 'OFFICE',
      name: 'Office Insurance',
      description: 'Covers office premises, equipment, and business assets against risks like fire, theft, and accidental damage.',
      icon: <Building className="w-6 h-6" />,
      color: 'primary',
      category: 'PROPERTY'
    },
    {
      code: 'HOME',
      name: 'Home Insurance',
      description: 'Provides protection for residential buildings and household contents against risks like fire, burglary, natural disasters, etc.',
      icon: <HomeIcon className="w-6 h-6" />,
      color: 'primary',
      category: 'PROPERTY'
    },
    {
      code: 'TRAVEL',
      name: 'Travel Insurance',
      description: 'Covers risks during travel such as trip cancellation, medical emergencies, lost luggage, and flight delays.',
      icon: <Plane className="w-6 h-6" />,
      color: 'primary',
      category: 'SPECIALTY'
    },
    {
      code: 'CYBER',
      name: 'Cyber Liability Insurance',
      description: 'Protects businesses from losses due to cyberattacks, data breaches, and related legal liabilities.',
      icon: <Lock className="w-6 h-6" />,
      color: 'primary',
      category: 'SPECIALTY'
    },
    {
      code: 'PAR',
      name: 'Property All Risk Insurance',
      description: 'Provides comprehensive coverage for physical loss or damage to property from any cause not specifically excluded (broader than standard fire insurance).',
      icon: <Package className="w-6 h-6" />,
      color: 'primary',
      category: 'PROPERTY'
    },
    {
      code: 'MARINE_HULL',
      name: 'Marine Hull Insurance',
      description: 'Covers loss or damage to ships, vessels, or other watercraft and their machinery.',
      icon: <Ship className="w-6 h-6" />,
      color: 'primary',
      category: 'MARINE'
    },
    {
      code: 'MARINE_CARGO',
      name: 'Marine Cargo Insurance',
      description: 'Provides coverage for loss or damage to goods while being transported by sea, air, or land.',
      icon: <Anchor className="w-6 h-6" />,
      color: 'primary',
      category: 'MARINE'
    }
  ];

  const handleProductSelect = (productCode: string) => {
    navigate(`/customer/proposal/${productCode}?new=true`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Select Insurance Product" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* All Products in One Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {insuranceProducts.map(product => (
            <ProductCard
              key={product.code}
              code={product.code}
              name={product.name}
              description={product.description}
              icon={product.icon}
              color="primary"
              onClick={() => handleProductSelect(product.code)}
            />
          ))}
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default ProductSelection;

