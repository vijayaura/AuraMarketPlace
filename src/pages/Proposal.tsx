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
  const [stepCompletionStatus, setStepCompletionStatus] = useState<Record<string, boolean>>({
    project_details: false,
    contract_structure: false,
    cover_requirements: false,
    insured_details: false,
    site_risks: false,
    underwriting_documents: false,
    coverages_selected: false,
    plans_selected: false,
    policy_required_documents: false,
    policy_issued: false
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

  // Handle step completion status changes
  const handleStepCompletionChange = (completionStatus: Record<string, boolean>) => {
    console.log('📥 Received step completion status from ProposalForm:', completionStatus);
    setStepCompletionStatus(completionStatus);
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
        onStepCompletionChange={handleStepCompletionChange}
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

            {/* Show completed steps */}
            {console.log('🔍 Dialog stepCompletionStatus:', stepCompletionStatus)}
            {Object.values(stepCompletionStatus).some(Boolean) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-3">Completed Steps:</h4>
                <div className="space-y-2">
                  {stepCompletionStatus.project_details && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Project Details</span>
                    </div>
                  )}
                  {stepCompletionStatus.insured_details && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Insured Details</span>
                    </div>
                  )}
                  {stepCompletionStatus.contract_structure && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Contract Structure</span>
                    </div>
                  )}
                  {stepCompletionStatus.cover_requirements && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Cover Requirements</span>
                    </div>
                  )}
                  {stepCompletionStatus.site_risks && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Site Risks</span>
                    </div>
                  )}
                  {stepCompletionStatus.underwriting_documents && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Underwriting Documents</span>
                    </div>
                  )}
                  {stepCompletionStatus.coverages_selected && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Coverages Selected</span>
                    </div>
                  )}
                  {stepCompletionStatus.plans_selected && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Plans Selected</span>
                    </div>
                  )}
                  {stepCompletionStatus.policy_required_documents && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Policy Required Documents</span>
                    </div>
                  )}
                  {stepCompletionStatus.policy_issued && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Policy Issued</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  These completed steps will be lost if you discontinue the quote.
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