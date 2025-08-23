import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CEWSelection } from "@/components/CEWSelection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Building, CheckCircle2, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CEWCustomization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedQuote } = location.state || {};
  const { toast } = useToast();

  // Mock quote data based on selected quote ID
  const selectedQuoteData = {
    id: selectedQuote || 1,
    planName: "Premium Construction Plan",
    insurerName: "Al Buhaira Insurance",
    basePremium: 24850,
    coverageAmount: 2000000,
    deductible: 25000,
  };

  const [premiumAdjustment, setPremiumAdjustment] = useState(0);
  const [tplAdjustment, setTPLAdjustment] = useState(0);
  const [cewAdjustment, setCEWAdjustment] = useState(0);
  const [selectedCEWItems, setSelectedCEWItems] = useState<any[]>([]);
  const [showCEWDialog, setShowCEWDialog] = useState(false);
  const [brokerCommission, setBrokerCommission] = useState(5.0);

  const handleCEWSelectionChange = (selectedItems: any[]) => {
    setSelectedCEWItems(selectedItems);
  };

  const handlePremiumChange = (adjustment: number) => {
    setPremiumAdjustment(adjustment);
  };

  const handleTPLAdjustmentChange = (adjustment: number) => {
    setTPLAdjustment(adjustment);
  };

  const handleCEWAdjustmentChange = (adjustment: number) => {
    setCEWAdjustment(adjustment);
  };

  const handleCommissionChange = (commission: number) => {
    setBrokerCommission(commission);
  };

  const calculateFinalPremium = () => {
    const adjustmentAmount = (selectedQuoteData.basePremium * premiumAdjustment) / 100;
    return selectedQuoteData.basePremium + adjustmentAmount;
  };

  const handleContinue = () => {
    // Pass the CEW selections to the next step
    navigate('/customer/declaration', { 
      state: { 
        selectedQuote: selectedQuote,
        cewSelections: selectedCEWItems,
        finalPremium: calculateFinalPremium(),
        tplAdjustment: tplAdjustment,
        cewAdjustment: cewAdjustment
      } 
    });
  };

  const handleBack = () => {
    navigate('/customer/quotes');
  };

  const handleProceedToPurchase = () => {
    setShowCEWDialog(false);
    toast({
      title: "Extensions Saved",
      description: "Your coverage extensions have been updated.",
    });
    
    setTimeout(() => {
      handleContinue();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-8 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Customize Your Coverage
              </h1>
              <p className="text-muted-foreground text-lg">
                Review your selected plan and customize additional coverage options
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Selected Plan Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building className="w-6 h-6 text-primary" />
                  Selected Plan Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-xl">{selectedQuoteData.insurerName}</h3>
                  <p className="text-muted-foreground">{selectedQuoteData.planName}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Base Premium</span>
                    <p className="font-semibold text-lg">{formatCurrency(selectedQuoteData.basePremium)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Coverage Amount</span>
                    <p className="font-semibold text-lg">{formatCurrency(selectedQuoteData.coverageAmount)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Deductible</span>
                    <p className="font-semibold text-lg">{formatCurrency(selectedQuoteData.deductible)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Summary */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl">Premium Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Base Annual Premium</span>
                    <span className="font-medium">{formatCurrency(selectedQuoteData.basePremium)}</span>
                  </div>
                  
                  {tplAdjustment !== 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span>TPL Limit Adjustments</span>
                        <span className={`font-medium ${
                          tplAdjustment > 0 ? "text-warning" : "text-success"
                        }`}>
                          {tplAdjustment > 0 ? "+" : ""}{tplAdjustment.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>TPL Adjustment Amount</span>
                        <span className={`font-medium ${
                          tplAdjustment > 0 ? "text-warning" : "text-success"
                        }`}>
                          {tplAdjustment > 0 ? "+" : ""}{formatCurrency((selectedQuoteData.basePremium * tplAdjustment) / 100)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {cewAdjustment !== 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span>CEW Adjustments</span>
                        <span className={`font-medium ${
                          cewAdjustment > 0 ? "text-warning" : "text-success"
                        }`}>
                          {cewAdjustment > 0 ? "+" : ""}{cewAdjustment.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>CEW Adjustment Amount</span>
                        <span className={`font-medium ${
                          cewAdjustment > 0 ? "text-warning" : "text-success"
                        }`}>
                          {cewAdjustment > 0 ? "+" : ""}{formatCurrency((selectedQuoteData.basePremium * cewAdjustment) / 100)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total Annual Premium</span>
                    <span className="font-bold text-xl text-primary">
                      {formatCurrency(calculateFinalPremium())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected CEW Items Summary */}
            {selectedCEWItems.filter(item => item.isSelected).length > 0 && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    Selected Extensions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCEWItems.filter(item => item.isSelected).map(item => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-accent/10 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.code}
                            </Badge>
                          </div>
                          {item.selectedOptionId && (
                            <p className="text-sm text-muted-foreground">
                              {item.options.find((opt: any) => opt.id === item.selectedOptionId)?.label}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            item.impact.premiumAmount > 0 ? "text-warning" : 
                            item.impact.premiumAmount < 0 ? "text-success" : "text-muted-foreground"
                          }`}>
                            {item.impact.premiumAmount > 0 ? "+" : ""}
                            {item.impact.premiumAmount}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={showCEWDialog} onOpenChange={setShowCEWDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 gap-2" size="lg">
                    <Settings className="w-5 h-5" />
                    Customize Extensions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Customize Coverage Extensions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                        <CEWSelection 
                          onSelectionChange={handleCEWSelectionChange}
                          onPremiumChange={handlePremiumChange}
                          onTPLAdjustmentChange={handleTPLAdjustmentChange}
                          onCEWAdjustmentChange={handleCEWAdjustmentChange}
                          onCommissionChange={handleCommissionChange}
                        />
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <Button variant="outline" onClick={() => setShowCEWDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleProceedToPurchase} className="gap-2">
                        Save & Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default CEWCustomization;