import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, ArrowLeft, Download, Eye, FileText, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { CEWSelection } from "./CEWSelection";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

const allQuotes = [
  // Al Buhaira Insurance - Best plan only
  {
    id: 1,
    planName: "Premium Construction Plan",
    insurerName: "Al Buhaira Insurance",
    annualPremium: 24850,
    coverageAmount: 2000000,
    rating: 4.8,
    deductible: formatCurrency(25000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability", 
      "Professional Indemnity",
      "Plant & Equipment"
    ],
    benefits: [
      "24/7 Claims Support",
      "Fast Settlement", 
      "Risk Management Services",
      "Free risk assessment"
    ]
  },
  // Union Insurance
  {
    id: 3,
    planName: "Comprehensive Builder Plan",
    insurerName: "Union Insurance",
    annualPremium: 26200,
    coverageAmount: 2500000,
    rating: 4.7,
    deductible: formatCurrency(25000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability",
      "Professional Indemnity",
      "Advanced Loss of Profits"
    ],
    benefits: [
      "Premium financing available",
      "Construction risk consulting",
      "24/7 emergency hotline",
      "Mobile claims app"
    ]
  },
  // AWNIC
  {
    id: 4,
    planName: "National Builder Protection",
    insurerName: "Al Wathba National Insurance Co. (AWNIC)",
    annualPremium: 22750,
    coverageAmount: 2000000,
    rating: 4.6,
    deductible: formatCurrency(30000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability",
      "Professional Indemnity",
      "Public Liability"
    ],
    benefits: [
      "Local claims network",
      "Arabic language support",
      "Government project expertise",
      "Quick approval process"
    ]
  },
  // Sukoon Insurance
  {
    id: 5,
    planName: "Sukoon Complete Coverage",
    insurerName: "Sukoon Insurance",
    annualPremium: 25100,
    coverageAmount: 2200000,
    rating: 4.7,
    deductible: formatCurrency(25000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability",
      "Professional Indemnity",
      "Terrorism Coverage"
    ],
    benefits: [
      "Flexible payment terms",
      "Risk management workshops",
      "Dedicated account manager",
      "Priority claims processing"
    ]
  }
];

export const QuotesComparison = () => {
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [showCEWDialog, setShowCEWDialog] = useState(false);
  const [selectedQuoteForCEW, setSelectedQuoteForCEW] = useState<any>(null);
  const [premiumAdjustment, setPremiumAdjustment] = useState(0);
  const [tplAdjustment, setTPLAdjustment] = useState(0);
  const [cewAdjustment, setCEWAdjustment] = useState(0);
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(10);
  const [selectedCEWItems, setSelectedCEWItems] = useState<any[]>([]);
  // Store updated premiums and CEW selections per quote
  const [updatedQuotes, setUpdatedQuotes] = useState<Record<number, { 
    premium: number; 
    cewItems: any[]; 
    isUpdated: boolean 
  }>>({});
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();

  const handleQuoteSelect = (quoteId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuotes(prev => [...prev, quoteId]);
    } else {
      setSelectedQuotes(prev => prev.filter(id => id !== quoteId));
    }
  };

  const handleCompare = () => {
    if (selectedQuotes.length === 2) {
      setIsCompareDialogOpen(true);
    }
  };

  const handleDownload = () => {
    // Create and download PDF comparison
    const selectedData = allQuotes.filter(q => selectedQuotes.includes(q.id));
    const content = selectedData.map(quote => 
      `${quote.planName} - ${quote.insurerName}\nPremium: ${formatCurrency(quote.annualPremium)}\nCoverage: ${formatCurrency(quote.coverageAmount)}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insurance-comparison.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSelectPlan = (quoteId: number) => {
    navigate('/customer/declaration', { state: { selectedQuote: quoteId } });
  };

  const handleExtensionsClick = (quote: any) => {
    console.log('Extensions button clicked for quote:', quote);
    setSelectedQuoteForCEW(quote);
    
    // Load existing CEW selections and premium if available
    const existingData = updatedQuotes[quote.id];
    if (existingData) {
      setPremiumAdjustment(((existingData.premium - quote.annualPremium) / quote.annualPremium) * 100);
      setSelectedCEWItems(existingData.cewItems);
    } else {
      setPremiumAdjustment(0);
      setSelectedCEWItems([]);
    }
    
    setShowCEWDialog(true);
  };


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

  const calculateFinalPremium = () => {
    if (!selectedQuoteForCEW) return 0;
    const netPremium = 22365; // Fixed net premium
    const defaultCommissionRate = 10; // Default commission rate
    const basePremium = netPremium + (netPremium * defaultCommissionRate) / 100; // Base = Net + Default Commission
    
    const currentBrokerCommissionAmount = (netPremium * brokerCommissionPercent) / 100;
    const adjustmentAmount = (basePremium * premiumAdjustment) / 100;
    
    return netPremium + currentBrokerCommissionAmount + adjustmentAmount;
  };

  const handleUpdatePremium = () => {
    if (!selectedQuoteForCEW) return;
    
    const finalPremium = calculateFinalPremium();
    
    // Update the quotes data with new premium and CEW selections
    setUpdatedQuotes(prev => ({
      ...prev,
      [selectedQuoteForCEW.id]: {
        premium: finalPremium,
        cewItems: selectedCEWItems.filter(item => item.isSelected),
        isUpdated: true
      }
    }));
    
    toast({
      title: "Premium Updated",
      description: `New annual premium: ${formatCurrency(finalPremium)}`,
    });
    
    // Close the dialog
    setShowCEWDialog(false);
  };

  const handleProceedToPurchase = () => {
    setShowCEWDialog(false);
    navigate('/customer/declaration', { 
      state: { 
        selectedQuote: selectedQuoteForCEW?.id,
        cewSelections: selectedCEWItems,
        finalPremium: calculateFinalPremium()
      } 
    });
  };

  const handleDownloadQuotation = () => {
    if (selectedQuotes.length === 0) {
      toast({
        title: "No Plan Selected",
        description: "Please select a plan to download the quotation.",
        variant: "destructive"
      });
      return;
    }

    const selectedQuoteData = allQuotes.filter(q => selectedQuotes.includes(q.id));
    
    // Create quotation content
    const quotationContent = selectedQuoteData.map(quote => {
      return `
CONSTRUCTION INSURANCE QUOTATION
================================

Plan Details:
- Plan Name: ${quote.planName}
- Insurer: ${quote.insurerName}
- Annual Premium: ${formatCurrency(quote.annualPremium)}
- Coverage Amount: ${formatCurrency(quote.coverageAmount)}
- Deductible: ${quote.deductible}
- Rating: ${quote.rating}/5.0

Key Coverage:
${quote.keyCoverage.map(coverage => `• ${coverage}`).join('\n')}

Benefits:
${quote.benefits.map(benefit => `• ${benefit}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
Valid until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

---
This quotation is subject to terms and conditions.
Contact us for more details or to proceed with the application.
      `.trim();
    }).join('\n\n' + '='.repeat(50) + '\n\n');

    // Create and download file
    const blob = new Blob([quotationContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Insurance_Quotation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Quotation Downloaded",
      description: `Downloaded quotation for ${selectedQuoteData.length} plan(s)`,
    });
  };

  const handleDownloadProposal = () => {
    if (selectedQuotes.length === 0) {
      toast({
        title: "No Plan Selected",
        description: "Please select a plan to download the proposal.",
        variant: "destructive"
      });
      return;
    }

    const selectedQuoteData = allQuotes.filter(q => selectedQuotes.includes(q.id));
    
    const pdf = new jsPDF();
    let yPos = 20;
    const lineHeight = 8;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;

    // Helper function to add text with page break if needed
    const addText = (text: string, fontSize = 12, isBold = false) => {
      if (yPos > pageHeight - marginBottom) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.text(text, 20, yPos);
      yPos += lineHeight;
    };

    // Title
    addText('CONSTRUCTION INSURANCE PROPOSAL', 16, true);
    yPos += 10;

    selectedQuoteData.forEach((quote, index) => {
      if (index > 0) {
        pdf.addPage();
        yPos = 20;
      }

      // Plan Header
      addText(`PLAN ${index + 1}: ${quote.planName.toUpperCase()}`, 14, true);
      addText(`Insurer: ${quote.insurerName}`, 12, true);
      yPos += 5;

      // Plan Details
      addText('PLAN DETAILS', 12, true);
      addText(`Plan Name: ${quote.planName}`);
      addText(`Insurer: ${quote.insurerName}`);
      addText(`Annual Premium: ${formatCurrency(getCurrentPremium(quote))}`);
      addText(`Coverage Amount: ${formatCurrency(quote.coverageAmount)}`);
      addText(`Deductible: ${quote.deductible}`);
      addText(`Rating: ${quote.rating}/5.0`);
      yPos += 5;

      // Key Coverage
      addText('KEY COVERAGE', 12, true);
      quote.keyCoverage.forEach(coverage => {
        addText(`• ${coverage}`);
      });
      yPos += 5;

      // Benefits
      addText('BENEFITS', 12, true);
      quote.benefits.forEach(benefit => {
        addText(`• ${benefit}`);
      });
      yPos += 5;

      // CEW Items if available
      const cewItems = getCEWItems(quote.id);
      if (cewItems.length > 0) {
        addText('SELECTED EXTENSIONS', 12, true);
        cewItems.forEach(item => {
          addText(`• ${item.name}: ${item.selectedOption || 'Selected'}`);
        });
        yPos += 5;
      }

      // Footer for each plan
      addText(`Generated on: ${new Date().toLocaleDateString()}`);
      addText(`Valid until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
      yPos += 10;

      // Signature Section for each plan
      addText('SIGNATURES', 12, true);
      yPos += 10;

      // Broker Signature
      addText('BROKER SIGNATURE:', 11, true);
      yPos += 15;
      pdf.line(20, yPos, 120, yPos); // Signature line
      yPos += 5;
      addText('Broker Name: _______________________', 9);
      addText('Date: _______________', 9);
      yPos += 15;

      // Customer Signature
      addText('CUSTOMER SIGNATURE:', 11, true);
      yPos += 15;
      pdf.line(20, yPos, 120, yPos); // Signature line
      yPos += 5;
      addText('Customer Name: _______________________', 9);
      addText('Date: _______________', 9);
      yPos += 5;
    });

    // Save PDF
    pdf.save(`Insurance_Proposal_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Proposal Downloaded",
      description: `Downloaded proposal for ${selectedQuoteData.length} plan(s)`,
    });
  };

  const comparedQuotes = allQuotes.filter(q => selectedQuotes.includes(q.id));
  
  // Helper function to get current premium for a quote (updated or original)
  const getCurrentPremium = (quote: any) => {
    const updatedData = updatedQuotes[quote.id];
    return updatedData ? updatedData.premium : quote.annualPremium;
  };
  
  // Helper function to get CEW items for a quote
  const getCEWItems = (quoteId: number) => {
    const updatedData = updatedQuotes[quoteId];
    return updatedData ? updatedData.cewItems : [];
  };

  return (
    <section className="py-4 lg:py-6 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            CAR Insurance Plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Select up to 2 plans to compare
          </p>
        </div>

        {/* Action Buttons */}
        {selectedQuotes.length > 0 && (
          <div className="mb-6 flex justify-center gap-4">
            <Button 
              onClick={handleCompare}
              disabled={selectedQuotes.length !== 2}
              className="gap-2"
              variant="outline"
            >
              <Eye className="w-4 h-4" />
              Compare Selected Plans ({selectedQuotes.length}/2)
            </Button>
            
            <Button 
              onClick={handleDownloadProposal}
              className="gap-2"
              variant="outline"
            >
              <FileText className="w-4 h-4" />
              Download Proposal
            </Button>
            
            <Button 
              onClick={handleDownloadQuotation}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Quotation
            </Button>
          </div>
        )}


        <div className="space-y-4">
          {allQuotes.map((quote) => {
            const isUpdated = updatedQuotes[quote.id]?.isUpdated;
            const currentPremium = getCurrentPremium(quote);
            
            return (
            <Card 
              key={quote.id} 
              className={`border transition-all duration-200 ${
                isUpdated 
                  ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20' 
                  : 'border-border hover:shadow-md'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedQuotes.includes(quote.id)}
                      onCheckedChange={(checked) => handleQuoteSelect(quote.id, !!checked)}
                      disabled={selectedQuotes.length >= 2 && !selectedQuotes.includes(quote.id)}
                    />
                    
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg">{quote.insurerName}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className={`text-2xl font-bold ${isUpdated ? 'text-primary' : 'text-foreground'}`}>
                            {formatCurrency(currentPremium)}
                          </div>
                          {isUpdated && (
                            <Badge variant="secondary" className="text-xs">
                              Updated
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Annual Premium
                          {isUpdated && (
                            <span className="block text-xs text-muted-foreground/70">
                              Original: {formatCurrency(quote.annualPremium)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => handleExtensionsClick(quote)}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Extensions
                        </Button>
                        <Button 
                          onClick={() => handleSelectPlan(quote.id)}
                        >
                          Select Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Dialog */}
        <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Compare Insurance Plans</DialogTitle>
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Comparison
                </Button>
              </div>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6 mt-6">
              {comparedQuotes.map((quote) => (
                <div key={quote.id} className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Building className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">{quote.insurerName}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Premium</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(getCurrentPremium(quote))}</span>
                        {updatedQuotes[quote.id]?.isUpdated && (
                          <div className="text-xs text-muted-foreground">
                            Original: {formatCurrency(quote.annualPremium)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Key Coverage</h4>
                    <ul className="text-sm space-y-1">
                      {quote.keyCoverage.map((coverage, index) => (
                        <li key={index} className="text-muted-foreground">• {coverage}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Benefits</h4>
                    <ul className="text-sm space-y-1">
                      {quote.benefits.map((benefit, index) => (
                        <li key={index} className="text-muted-foreground">• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* CEW Extensions Comparison */}
                  {getCEWItems(quote.id).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Selected Extensions</h4>
                      <ul className="text-sm space-y-1">
                        {getCEWItems(quote.id).map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="text-muted-foreground">• {item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.impact.premiumAmount > 0 ? "+" : ""}{item.impact.premiumAmount}%
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleSelectPlan(quote.id)}
                  >
                    Select This Plan
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* CEW Customization Dialog */}
        <Dialog open={showCEWDialog} onOpenChange={(open) => {
          console.log('Dialog onOpenChange called with:', open);
          setShowCEWDialog(open);
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto z-50">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Customize Your Coverage - {selectedQuoteForCEW?.insurerName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid lg:grid-cols-3 gap-6 mt-6">
              {/* CEW Selection */}
              <div className="lg:col-span-2">
                <CEWSelection 
                  onSelectionChange={handleCEWSelectionChange}
                  onPremiumChange={handlePremiumChange}
                  onTPLAdjustmentChange={handleTPLAdjustmentChange}
                  onCEWAdjustmentChange={handleCEWAdjustmentChange}
                />
              </div>

              {/* Premium Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-4">
                  {/* Selected Plan Card */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building className="w-5 h-5 text-primary" />
                        Selected Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedQuoteForCEW && (
                        <>
                          <div>
                            <h3 className="font-semibold text-lg">{selectedQuoteForCEW.insurerName}</h3>
                            <p className="text-sm text-muted-foreground">{selectedQuoteForCEW.planName}</p>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Base Premium</span>
                              <span className="font-medium">{formatCurrency(selectedQuoteForCEW.annualPremium)}</span>
                            </div>
                            
                             <div className="flex justify-between items-center">
                               <span className="text-sm">Coverage Amount</span>
                               <span className="font-medium">{formatCurrency(selectedQuoteForCEW.coverageAmount)}</span>
                             </div>
                             
                             <div className="flex justify-between items-center">
                               <span className="text-sm">Default TPL Limit</span>
                               <span className="font-medium">AED 1.00M</span>
                             </div>
                             
                             <div className="flex justify-between items-center">
                               <span className="text-sm">Deductible</span>
                               <span className="font-medium">{selectedQuoteForCEW.deductible}</span>
                             </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Premium Summary */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Premium Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                           <span className="text-sm">Nett Premium</span>
                           <span className="font-medium">
                             {formatCurrency(22365)}
                           </span>
                         </div>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm">Broker Commission</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{brokerCommissionPercent}%</span>
                              <button
                                className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer"
                                onClick={() => {
                                  const newValue = prompt(`Enter broker commission (${5}% - ${15}%):`, brokerCommissionPercent.toString());
                                  if (newValue && !isNaN(Number(newValue))) {
                                    const value = Math.min(15, Math.max(5, Number(newValue)));
                                    setBrokerCommissionPercent(value);
                                  }
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <span className="font-medium text-muted-foreground">
                            {formatCurrency((22365 * brokerCommissionPercent) / 100)}
                          </span>
                        </div>
                        
                         {(tplAdjustment !== 0 || cewAdjustment !== 0) && (
                           <>
                             {tplAdjustment !== 0 && (
                               <>
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">TPL Limit Adjustments</span>
                                   <span className={`font-medium ${
                                     tplAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {tplAdjustment > 0 ? "+" : ""}{tplAdjustment.toFixed(1)}%
                                   </span>
                                 </div>
                                 
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">TPL Adjustment Amount</span>
                                   <span className={`font-medium ${
                                     tplAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {tplAdjustment > 0 ? "+" : ""}{formatCurrency((24601.5 * tplAdjustment) / 100)}
                                   </span>
                                 </div>
                               </>
                             )}
                             
                             {cewAdjustment !== 0 && (
                               <>
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">CEW Adjustments</span>
                                   <span className={`font-medium ${
                                     cewAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {cewAdjustment > 0 ? "+" : ""}{cewAdjustment.toFixed(1)}%
                                   </span>
                                 </div>
                                 
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">CEW Adjustment Amount</span>
                                   <span className={`font-medium ${
                                     cewAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {cewAdjustment > 0 ? "+" : ""}{formatCurrency((24601.5 * cewAdjustment) / 100)}
                                   </span>
                                 </div>
                               </>
                             )}
                           </>
                         )}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Annual Premium</span>
                          <span className="font-bold text-lg text-primary">
                            {formatCurrency(calculateFinalPremium())}
                          </span>
                        </div>
                      </div>

                      {/* Update Premium Button */}
                      <Button 
                        onClick={handleUpdatePremium}
                        variant="outline"
                        className="w-full"
                      >
                        Update Premium
                      </Button>

                    </CardContent>
                  </Card>

                  {/* Selected CEW Items */}
                  {selectedCEWItems.filter(item => item.isSelected).length > 0 && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-lg">Selected Extensions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedCEWItems.filter(item => item.isSelected).map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                              <div>
                                <span className="text-sm font-medium">{item.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">{item.code}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {item.impact.premiumAmount > 0 ? "+" : ""}{item.impact.premiumAmount}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};