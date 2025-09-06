import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProposalForm } from "@/components/ProposalForm";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Proposal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quoteReference, setQuoteReference] = useState<string>(() => {
    const saved = localStorage.getItem('quoteReference');
    return saved || '';
  });

  // Handle discontinuing quote creation
  const handleDiscontinueQuote = () => {
    // Clear all stored quote data
    localStorage.removeItem('projectDataExists');
    localStorage.removeItem('currentQuoteId');
    localStorage.removeItem('quoteReference');
    localStorage.removeItem('stepCompletionFlags');
    
    // Close dialog
    setShowDiscontinueDialog(false);
    
    // Navigate to dashboard
    navigate('/broker/dashboard');
    
    toast({
      title: "Quote Creation Discontinued",
      description: `Quote ${quoteReference} has been discontinued.`,
    });
  };

  // Handle back to dashboard click
  const handleBackToDashboard = () => {
    if (currentStep === 0) {
      // On project details page, navigate directly
      navigate('/broker/dashboard');
    } else {
      // On other pages, show confirmation dialog
      setShowDiscontinueDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onBackToDashboard={handleBackToDashboard}
        showBackConfirmation={currentStep > 0}
      />
      <ProposalForm 
        onStepChange={setCurrentStep}
        onQuoteReferenceChange={setQuoteReference}
      />
      <Footer />

      {/* Discontinue Quote Confirmation Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Discontinue Quote Creation?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to discontinue creating this quote? All unsaved changes will be lost.
            </p>
            {quoteReference && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Quote Reference: <span className="text-primary">{quoteReference}</span>
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDiscontinueDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDiscontinueQuote}
              >
                Discontinue Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposal;