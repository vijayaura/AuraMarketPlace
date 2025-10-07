import { useParams, Navigate } from "react-router-dom";
import Proposal from "./Proposal"; // This is the CAR proposal form

// Placeholder components for other products (to be implemented later)
const ComingSoonProposal = ({ productName }: { productName: string }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {productName} - Coming Soon
          </h1>
          <p className="text-muted-foreground mb-6">
            This insurance product is currently under development and will be available soon.
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Product Selection
          </button>
        </div>
      </div>
    </div>
  );
};

const ProposalRouter = () => {
  const { productCode } = useParams<{ productCode: string }>();

  // Product mapping
  const productComponents: Record<string, { component: React.ComponentType; name: string }> = {
    'CAR': { component: Proposal, name: 'Contractors All Risk Insurance' },
    'PI': { component: () => <ComingSoonProposal productName="Professional Indemnity Insurance" />, name: 'Professional Indemnity Insurance' },
    'CGL': { component: () => <ComingSoonProposal productName="Commercial General Liability Insurance" />, name: 'Commercial General Liability Insurance' },
    'DO': { component: () => <ComingSoonProposal productName="Directors & Officers Liability Insurance" />, name: 'Directors & Officers Liability Insurance' },
    'OFFICE': { component: () => <ComingSoonProposal productName="Office Insurance" />, name: 'Office Insurance' },
    'HOME': { component: () => <ComingSoonProposal productName="Home Insurance" />, name: 'Home Insurance' },
    'TRAVEL': { component: () => <ComingSoonProposal productName="Travel Insurance" />, name: 'Travel Insurance' },
    'CYBER': { component: () => <ComingSoonProposal productName="Cyber Liability Insurance" />, name: 'Cyber Liability Insurance' },
    'PAR': { component: () => <ComingSoonProposal productName="Property All Risk Insurance" />, name: 'Property All Risk Insurance' },
    'MARINE_HULL': { component: () => <ComingSoonProposal productName="Marine Hull Insurance" />, name: 'Marine Hull Insurance' },
    'MARINE_CARGO': { component: () => <ComingSoonProposal productName="Marine Cargo Insurance" />, name: 'Marine Cargo Insurance' },
  };

  // Validate product code
  const normalizedProductCode = productCode?.toUpperCase();
  
  if (!normalizedProductCode || !productComponents[normalizedProductCode]) {
    // Invalid product code - redirect to product selection
    return <Navigate to="/broker/product-selection" replace />;
  }

  const ProductComponent = productComponents[normalizedProductCode].component;

  return <ProductComponent />;
};

export default ProposalRouter;

