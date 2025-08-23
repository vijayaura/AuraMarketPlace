import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Shield, 
  Calendar, 
  CheckCircle, 
  DollarSign,
  Lock,
  Receipt,
  AlertCircle
} from "lucide-react";

export const PaymentSection = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();

  const handlePayment = () => {
    // In a real app, you would process payment here
    navigate('/customer/declaration');
  };

  const selectedQuote = {
    insurer: "SecureShield Insurance",
    premium: 24850,
    coverageLimit: formatCurrency(2000000),
    deductible: formatCurrency(25000)
  };


  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Complete Your Payment
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-medium sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5" />
                  <span>Payment Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{selectedQuote.insurer}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage Limit:</span>
                      <span>{selectedQuote.coverageLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductible:</span>
                      <span>{selectedQuote.deductible}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Premium:</span>
                    <span>{formatCurrency(selectedQuote.premium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Policy Fee:</span>
                    <span>{formatCurrency(50)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Tax:</span>
                    <span>{formatCurrency(125)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Due:</span>
                  <span className="text-primary">{formatCurrency(selectedQuote.premium + 175)}</span>
                </div>

                <div className="bg-success-light p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-success">Instant Policy Issuance</p>
                      <p className="text-success/80">Your policy certificate will be emailed immediately after payment.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Secure Payment</span>
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>256-bit SSL encryption</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Payment Method */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Payment Method</Label>
                  <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="card">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Credit/Debit Card
                      </TabsTrigger>
                      <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                      <TabsTrigger value="finance">Financing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="card" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" placeholder="Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input 
                          id="cardNumber" 
                          placeholder="1234 5678 9012 3456"
                          className="font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="expiry">Expiry Date *</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingAddress">Billing Address *</Label>
                        <Input id="billingAddress" placeholder="123 Main Street" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" placeholder="New York" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input id="state" placeholder="NY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">ZIP Code *</Label>
                          <Input id="zip" placeholder="10001" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="bank" className="space-y-4 mt-6">
                      <div className="bg-primary-light p-6 rounded-lg">
                        <h4 className="font-semibold mb-3">Bank Transfer Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Bank Name:</span>
                            <span>SecureShield Insurance Bank</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Account Number:</span>
                            <span>1234567890</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Routing Number:</span>
                            <span>987654321</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reference:</span>
                            <span>CAR-INS-2024-001</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-warning-light rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                            <p className="text-sm text-warning">
                              Policy will be issued after payment confirmation (1-3 business days).
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="finance" className="space-y-4 mt-6">
                      <div className="bg-muted/50 p-6 rounded-lg text-center">
                        <h4 className="font-semibold mb-3">Premium Financing Available</h4>
                        <p className="text-muted-foreground mb-4">
                          Spread your premium over 12 months with competitive financing rates starting at 4.9% APR.
                        </p>
                        <Button variant="outline">Apply for Financing</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Terms and Payment Button */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" id="terms" className="mt-1" />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and 
                      <a href="#" className="text-primary hover:underline ml-1">Privacy Policy</a>
                    </Label>
                  </div>

                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full"
                    onClick={handlePayment}
                    disabled={paymentMethod === "bank"}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {paymentMethod === "bank" 
                      ? "Complete Bank Transfer" 
                      : `Pay ${formatCurrency(selectedQuote.premium + 175)} Now`
                    }
                  </Button>

                  <div className="flex justify-center">
                    <Button variant="outline" asChild>
                      <Link to="/customer/quotes">← Back</Link>
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>Powered by SecurePay | Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};