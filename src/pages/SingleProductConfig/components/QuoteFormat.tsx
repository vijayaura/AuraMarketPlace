import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Image, Save, Upload } from "lucide-react";

export type QuoteFormatProps = {
  quoteFormatError: string | null;
  isLoadingQuoteFormat: boolean;
  isSavingQuoteFormat: boolean;
  onShowPreview: () => void;
  onSave: () => Promise<void> | void;
  quoteConfig: any;
  updateQuoteConfig: (section: string, field: string, value: any) => void;
  quoteLogoFile: File | null;
  setQuoteLogoFile: (file: File | null) => void;
  isUploadingLogo: boolean;
  uploadedLogoUrl: string | null;
  onLogoUpload: (file: File) => void;
};

const QuoteFormat: React.FC<QuoteFormatProps> = ({
  quoteFormatError,
  isLoadingQuoteFormat,
  isSavingQuoteFormat,
  onShowPreview,
  onSave,
  quoteConfig,
  updateQuoteConfig,
  quoteLogoFile,
  setQuoteLogoFile,
  isUploadingLogo,
  uploadedLogoUrl,
  onLogoUpload,
}) => {
  return (
    <div className="space-y-6">
      {!quoteConfig?.header?.companyName && !isLoadingQuoteFormat && (
        <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
          <p className="font-medium">Yet to configure this section</p>
          <p className="text-sm mt-1">Configure quote format settings, header, footer, and content sections below.</p>
        </div>
      )}

      {isLoadingQuoteFormat && (
        <div className="space-y-6">
          <div className="p-4 border rounded-md space-y-4">
            <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-4 border rounded-md space-y-4">
            <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 border rounded-md space-y-4">
            <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 border rounded-md space-y-4">
            <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}

      {!isLoadingQuoteFormat && (
        <>
          {/* Header Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Header Configuration
                  </CardTitle>
                  <CardDescription>Configure quote header with logo and company information</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={onShowPreview} size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Template
                  </Button>
                  <Button onClick={onSave} size="sm" disabled={isSavingQuoteFormat}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingQuoteFormat ? 'Saving...' : 'Save Quote Format'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name" 
                    name="company_name"
                    autoComplete="organization" 
                    value={quoteConfig.header.companyName}
                    onChange={(e) => updateQuoteConfig('header', 'companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-prefix">Quotation Number Prefix</Label>
                  <Input 
                    id="quote-prefix" 
                    name="quotation_prefix"
                    autoComplete="off" 
                    value={quoteConfig.details.quotePrefix}
                    onChange={(e) => updateQuoteConfig('details', 'quotePrefix', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="logo-upload" 
                      name="logo" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          setQuoteLogoFile(file);
                          onLogoUpload(file);
                        }
                      }}
                      disabled={isUploadingLogo}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isUploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  {isUploadingLogo && (
                    <div className="text-sm text-blue-600 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Uploading logo...
                    </div>
                  )}
                  {uploadedLogoUrl && !isUploadingLogo && (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Logo uploaded successfully
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-address">Company Address</Label>
                  <Textarea 
                    id="company-address" 
                    name="company_address"
                    autoComplete="street-address" 
                    value={quoteConfig.header.companyAddress}
                    onChange={(e) => updateQuoteConfig('header', 'companyAddress', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-info">Contact Information</Label>
                  <Textarea 
                    id="contact-info" 
                    name="contact_info"
                    autoComplete="on" 
                    value={quoteConfig.header.contactInfo}
                    onChange={(e) => updateQuoteConfig('header', 'contactInfo', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="header-color">Header Background Color</Label>
                  <Input 
                    id="header-color" 
                    name="header_bg_color"
                    type="color" 
                    value={quoteConfig.header.headerColor}
                    onChange={(e) => updateQuoteConfig('header', 'headerColor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-text-color">Header Text Color</Label>
                  <Input 
                    id="header-text-color" 
                    name="header_text_color" 
                    type="color" 
                    value={quoteConfig.header.headerTextColor}
                    onChange={(e) => updateQuoteConfig('header', 'headerTextColor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-position">Logo Position</Label>
                  <Select 
                    name="logo_position"
                    value={quoteConfig.header.logoPosition}
                    onValueChange={(value) => updateQuoteConfig('header', 'logoPosition', value)}
                  >
                    <SelectTrigger id="logo-position" aria-label="Logo Position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Details Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Details Configuration</CardTitle>
              <CardDescription>Configure how risk information is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-project-details" 
                    checked={quoteConfig.risk.showProjectDetails}
                    onCheckedChange={(checked) => updateQuoteConfig('risk', 'showProjectDetails', checked)}
                  />
                  <Label htmlFor="show-project-details">Show Project Details (Name, Location, Duration)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-coverage-types" 
                    checked={quoteConfig.risk.showCoverageTypes}
                    onCheckedChange={(checked) => updateQuoteConfig('risk', 'showCoverageTypes', checked)}
                  />
                  <Label htmlFor="show-coverage-types">Show Coverage Types</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-coverage-limits" 
                    checked={quoteConfig.risk.showCoverageLimits}
                    onCheckedChange={(checked) => updateQuoteConfig('risk', 'showCoverageLimits', checked)}
                  />
                  <Label htmlFor="show-coverage-limits">Show Coverage Limits</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-deductibles" 
                    checked={quoteConfig.risk.showDeductibles}
                    onCheckedChange={(checked) => updateQuoteConfig('risk', 'showDeductibles', checked)}
                  />
                  <Label htmlFor="show-deductibles">Show Deductibles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-contractor-info" 
                    checked={quoteConfig.risk.showContractorInfo}
                    onCheckedChange={(checked) => updateQuoteConfig('risk', 'showContractorInfo', checked)}
                  />
                  <Label htmlFor="show-contractor-info">Show Contractor Information</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-section-title">Risk Section Title</Label>
                <Input 
                  id="risk-section-title" 
                  value={quoteConfig.risk.riskSectionTitle}
                  onChange={(e) => updateQuoteConfig('risk', 'riskSectionTitle', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Premium Breakdown Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Breakdown Configuration</CardTitle>
              <CardDescription>Configure how premium calculations are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={quoteConfig.premium.currency}
                    onValueChange={(value) => updateQuoteConfig('premium', 'currency', value)}
                  >
                    <SelectTrigger id="currency" aria-label="Currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premium-section-title">Premium Section Title</Label>
                  <Input 
                    id="premium-section-title" 
                    value={quoteConfig.premium.premiumSectionTitle}
                    onChange={(e) => updateQuoteConfig('premium', 'premiumSectionTitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-base-premium" 
                    checked={quoteConfig.premium.showBasePremium}
                    onCheckedChange={(checked) => updateQuoteConfig('premium', 'showBasePremium', checked)}
                  />
                  <Label htmlFor="show-base-premium">Show Base Premium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-risk-adjustments" 
                    checked={quoteConfig.premium.showRiskAdjustments}
                    onCheckedChange={(checked) => updateQuoteConfig('premium', 'showRiskAdjustments', checked)}
                  />
                  <Label htmlFor="show-risk-adjustments">Show Risk Adjustments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-fees" 
                    checked={quoteConfig.premium.showFees}
                    onCheckedChange={(checked) => updateQuoteConfig('premium', 'showFees', checked)}
                  />
                  <Label htmlFor="show-fees">Show Fees & Charges</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-taxes" 
                    checked={quoteConfig.premium.showTaxes}
                    onCheckedChange={(checked) => updateQuoteConfig('premium', 'showTaxes', checked)}
                  />
                  <Label htmlFor="show-taxes">Show Taxes (VAT)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-total-premium" 
                    checked={quoteConfig.premium.showTotalPremium}
                    onCheckedChange={(checked) => updateQuoteConfig('premium', 'showTotalPremium', checked)}
                  />
                  <Label htmlFor="show-total-premium">Show Total Premium</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions Configuration</CardTitle>
              <CardDescription>Configure warranties, exclusions, and deductibles display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-warranties" 
                    checked={quoteConfig.terms.showWarranties}
                    onCheckedChange={(checked) => updateQuoteConfig('terms', 'showWarranties', checked)}
                  />
                  <Label htmlFor="show-warranties">Show Warranties</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-exclusions" 
                    checked={quoteConfig.terms.showExclusions}
                    onCheckedChange={(checked) => updateQuoteConfig('terms', 'showExclusions', checked)}
                  />
                  <Label htmlFor="show-exclusions">Show Exclusions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-deductible-details" 
                    checked={quoteConfig.terms.showDeductibleDetails}
                    onCheckedChange={(checked) => updateQuoteConfig('terms', 'showDeductibleDetails', checked)}
                  />
                  <Label htmlFor="show-deductible-details">Show Deductible Details</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-policy-conditions" 
                    checked={quoteConfig.terms.showPolicyConditions}
                    onCheckedChange={(checked) => updateQuoteConfig('terms', 'showPolicyConditions', checked)}
                  />
                  <Label htmlFor="show-policy-conditions">Show Policy Conditions</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms-section-title">Terms Section Title</Label>
                <Input 
                  id="terms-section-title" 
                  value={quoteConfig.terms.termsSectionTitle}
                  onChange={(e) => updateQuoteConfig('terms', 'termsSectionTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional-terms">Additional Terms Text</Label>
                <Textarea 
                  id="additional-terms" 
                  value={quoteConfig.terms.additionalTerms}
                  onChange={(e) => updateQuoteConfig('terms', 'additionalTerms', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Signature Block Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Signature Block Configuration</CardTitle>
              <CardDescription>Configure signature areas and authorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-signature-block" 
                  checked={quoteConfig.signature.showSignatureBlock}
                  onCheckedChange={(checked) => updateQuoteConfig('signature', 'showSignatureBlock', checked)}
                />
                <Label htmlFor="show-signature-block">Show Signature Block</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorized-signatory">Authorized Signatory Name</Label>
                  <Input 
                    id="authorized-signatory" 
                    value={quoteConfig.signature.authorizedSignatory}
                    onChange={(e) => updateQuoteConfig('signature', 'authorizedSignatory', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signatory-title">Signatory Title</Label>
                  <Input 
                    id="signatory-title" 
                    value={quoteConfig.signature.signatoryTitle}
                    onChange={(e) => updateQuoteConfig('signature', 'signatoryTitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature-text">Signature Block Text</Label>
                <Textarea 
                  id="signature-text" 
                  value={quoteConfig.signature.signatureText}
                  onChange={(e) => updateQuoteConfig('signature', 'signatureText', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer & Disclaimers Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Footer & Disclaimers Configuration</CardTitle>
              <CardDescription>Configure footer information and legal disclaimers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-footer" 
                    checked={quoteConfig.footer.showFooter}
                    onCheckedChange={(checked) => updateQuoteConfig('footer', 'showFooter', checked)}
                  />
                  <Label htmlFor="show-footer">Show Footer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-disclaimer" 
                    checked={quoteConfig.footer.showDisclaimer}
                    onCheckedChange={(checked) => updateQuoteConfig('footer', 'showDisclaimer', checked)}
                  />
                  <Label htmlFor="show-disclaimer">Show General Disclaimer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-regulatory-info" 
                    checked={quoteConfig.footer.showRegulatoryInfo}
                    onCheckedChange={(checked) => updateQuoteConfig('footer', 'showRegulatoryInfo', checked)}
                  />
                  <Label htmlFor="show-regulatory-info">Show Regulatory Information</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="general-disclaimer">General Disclaimer Text</Label>
                <Textarea 
                  id="general-disclaimer" 
                  value={quoteConfig.footer.generalDisclaimer}
                  onChange={(e) => updateQuoteConfig('footer', 'generalDisclaimer', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regulatory-text">Regulatory Information</Label>
                <Textarea 
                  id="regulatory-text" 
                  value={quoteConfig.footer.regulatoryText}
                  onChange={(e) => updateQuoteConfig('footer', 'regulatoryText', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer-bg-color">Footer Background Color</Label>
                  <Input 
                    id="footer-bg-color" 
                    type="color" 
                    value={quoteConfig.footer.footerBgColor}
                    onChange={(e) => updateQuoteConfig('footer', 'footerBgColor', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-text-color">Footer Text Color</Label>
                  <Input 
                    id="footer-text-color" 
                    type="color" 
                    value={quoteConfig.footer.footerTextColor}
                    onChange={(e) => updateQuoteConfig('footer', 'footerTextColor', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QuoteFormat;


