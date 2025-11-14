import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Plus, Trash2, Edit, TestTube, CheckCircle2, XCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  getIntegrations, 
  createIntegration, 
  updateIntegration, 
  deleteIntegration,
  testIntegration,
  type Integration,
  type IntegrationTriggerPage,
  type AuthType,
  type FieldMapping,
  type ResponseMapping,
  type SuccessAction,
  type FailureAction
} from "@/lib/api/integrations";
import { getProposalFormDesign, type Page, type Field } from "@/lib/api/proposalFormDesign";

const IntegrationsConfigurator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [proposalFormFields, setProposalFormFields] = useState<Array<{ name: string; label: string; type: string }>>([]);
  const [proposalFormPages, setProposalFormPages] = useState<Array<{ id: string; title: string }>>([]);

  const [formData, setFormData] = useState<Partial<Integration>>({
    name: "",
    description: "",
    apiUrl: "",
    method: "POST",
    credentials: {
      type: "apiKey",
    },
    triggerPage: "home",
    requestMapping: [],
    responseMapping: {
      onSuccess: {},
      onFailure: {},
    },
    enabled: true,
  });

  const [newFieldMapping, setNewFieldMapping] = useState<FieldMapping>({
    sourceField: "",
    targetField: "",
    required: false,
  });
  const [showCustomSourceField, setShowCustomSourceField] = useState(false);
  const [showCustomTargetField, setShowCustomTargetField] = useState(false);

  // Common API target field suggestions
  const commonTargetFields = [
    { value: "id", label: "ID" },
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "country", label: "Country" },
    { value: "chassis_number", label: "Chassis Number" },
    { value: "registration_number", label: "Registration Number" },
    { value: "date_of_birth", label: "Date of Birth" },
    { value: "id_number", label: "ID Number" },
    { value: "customer_name", label: "Customer Name" },
    { value: "customer_id", label: "Customer ID" },
    { value: "customer_email", label: "Customer Email" },
    { value: "project_name", label: "Project Name" },
    { value: "project_value", label: "Project Value" },
    { value: "sum_insured", label: "Sum Insured" },
    { value: "premium", label: "Premium" },
  ];

  const triggerPageOptions: { value: IntegrationTriggerPage; label: string; description: string }[] = [
    { value: "home", label: "Home Page", description: "Called when user enters home page" },
    { value: "quotesList", label: "Quotes List Page", description: "Called when viewing quotes list" },
    { value: "beforePayment", label: "Before Payment", description: "Called before payment page" },
    { value: "afterPayment", label: "After Payment", description: "Called after successful payment" },
    { value: "policyDetails", label: "Policy Details", description: "Called when viewing policy details" },
    { value: "custom", label: "Custom", description: "Custom trigger point" },
  ];

  const authTypeOptions: { value: AuthType; label: string }[] = [
    { value: "none", label: "No Authentication" },
    { value: "apiKey", label: "API Key" },
    { value: "bearer", label: "Bearer Token" },
    { value: "basic", label: "Basic Auth" },
    { value: "oauth2", label: "OAuth 2.0" },
  ];

  const httpMethods = ["GET", "POST", "PUT", "PATCH"];

  // Fallback test data for development
  const getFallbackIntegrations = (): Integration[] => [
    {
      id: '1',
      productId: productId || '',
      name: 'Xadata Integration',
      description: 'Vehicle data lookup integration',
      apiUrl: 'https://api.xadata.com/v1/vehicle-lookup',
      method: 'POST',
      credentials: {
        type: 'apiKey',
        apiKey: 'xadata_api_key_here',
        apiKeyHeader: 'X-API-Key',
      },
      triggerPage: 'home',
      triggerCondition: {
        field: 'chassisNumber',
        condition: 'exists',
      },
      requestMapping: [
        { sourceField: 'chassisNumber', targetField: 'chassis_number', required: true },
      ],
      responseMapping: {
        successField: 'status',
        successValue: 'success',
        dataField: 'data',
        onSuccess: {
          forwardToPage: 'page2', // Example: forward to quotes page
          showInPage: 'page2', // Example: show in quotes list page
        },
        onFailure: {
          showError: true,
        },
      },
      enabled: true,
    },
    {
      id: '2',
      productId: productId || '',
      name: 'AML Check',
      description: 'Anti-Money Laundering verification',
      apiUrl: 'https://api.amlservice.com/v1/verify',
      method: 'POST',
      credentials: {
        type: 'bearer',
        bearerToken: 'aml_bearer_token_here',
      },
      triggerPage: 'beforePayment',
      requestMapping: [
        { sourceField: 'customerName', targetField: 'name', required: true },
        { sourceField: 'customerId', targetField: 'id_number', required: true },
        { sourceField: 'customerEmail', targetField: 'email', required: true },
      ],
      responseMapping: {
        successField: 'verified',
        successValue: true,
        dataField: 'result',
        onSuccess: {},
        onFailure: {
          blockNavigation: true,
          showError: true,
        },
      },
      enabled: true,
    },
  ];

  // Extract field names from proposal form design
  const extractFieldsFromPages = (pages: Page[]): Array<{ name: string; label: string; type: string }> => {
    const fields: Array<{ name: string; label: string; type: string }> = [];
    const seenFields = new Set<string>();

    pages.forEach((page) => {
      // Extract fields from sections
      page.sections?.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.name && !seenFields.has(field.name)) {
            seenFields.add(field.name);
            fields.push({
              name: field.name,
              label: field.label || field.name,
              type: field.type || 'text',
            });
          }
          // Extract sub-fields from combination fields
          if (field.type === 'combination' && field.subFields) {
            field.subFields.forEach((subField) => {
              if (subField.name && !seenFields.has(subField.name)) {
                seenFields.add(subField.name);
                fields.push({
                  name: subField.name,
                  label: subField.label || subField.name,
                  type: subField.type || 'text',
                });
              }
            });
          }
        });
      });
      // Extract fields from navigation fields
      page.navigationFields?.forEach((field) => {
        if (field.name && !seenFields.has(field.name)) {
          seenFields.add(field.name);
          fields.push({
            name: field.name,
            label: field.label || field.name,
            type: field.type || 'button',
          });
        }
      });
    });

    return fields.sort((a, b) => a.label.localeCompare(b.label));
  };

  // Load proposal form fields and pages
  useEffect(() => {
    const loadProposalFormFields = async () => {
      if (productId) {
        try {
          const design = await getProposalFormDesign(productId);
          if (design.pages && design.pages.length > 0) {
            const fields = extractFieldsFromPages(design.pages);
            setProposalFormFields(fields);
            // Extract pages for navigation options
            const pages = design.pages.map(page => ({
              id: page.id,
              title: page.title || page.id,
            }));
            setProposalFormPages(pages);
          }
        } catch (error: any) {
          // If API fails, use empty array (will show text input fallback)
          if (error.status !== 404) {
            console.warn('Failed to load proposal form fields:', error);
          }
        }
      }
    };
    loadProposalFormFields();
  }, [productId]);

  // Load integrations
  useEffect(() => {
    const loadIntegrations = async () => {
      if (productId) {
        try {
          setIsLoading(true);
          const response = await getIntegrations(productId);
          if (response.integrations && response.integrations.length > 0) {
            setIntegrations(response.integrations);
          } else {
            // Use fallback test data
            setIntegrations(getFallbackIntegrations());
          }
        } catch (error: any) {
          // Use fallback test data when API is not available
          if (error.status === 404 || error.status === 0) {
            setIntegrations(getFallbackIntegrations());
          } else {
            toast({
              title: "Error",
              description: error.message || "Failed to load integrations",
              variant: "destructive",
            });
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // If no productId, use fallback data
        setIntegrations(getFallbackIntegrations());
        setIsLoading(false);
      }
    };
    loadIntegrations();
  }, [productId, toast]);

  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      apiUrl: "",
      method: "POST",
      credentials: {
        type: "apiKey",
      },
      triggerPage: "home",
      requestMapping: [],
      responseMapping: {
        onSuccess: {},
        onFailure: {},
      },
      enabled: true,
    });
    setNewFieldMapping({
      sourceField: "",
      targetField: "",
      required: false,
    });
    setShowCustomSourceField(false);
    setShowCustomTargetField(false);
    setSelectedIntegration(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (integration: Integration) => {
    setFormData(integration);
    setSelectedIntegration(integration);
    setIsEditing(true);
    setNewFieldMapping({
      sourceField: "",
      targetField: "",
      required: false,
    });
    setShowCustomSourceField(false);
    setShowCustomTargetField(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) {
      return;
    }

    try {
      if (productId) {
        await deleteIntegration(productId, integrationId);
        toast({
          title: "Integration Deleted",
          description: "Integration has been deleted successfully.",
        });
        // Reload integrations
        try {
          const response = await getIntegrations(productId);
          setIntegrations(response.integrations || []);
        } catch {
          // If API fails, remove from local state
          setIntegrations(integrations.filter(i => i.id !== integrationId));
        }
      } else {
        // If no productId, just remove from local state
        setIntegrations(integrations.filter(i => i.id !== integrationId));
        toast({
          title: "Integration Deleted",
          description: "Integration has been removed.",
        });
      }
      // Clear selection if deleted integration was selected
      if (selectedIntegration?.id === integrationId) {
        setSelectedIntegration(null);
      }
    } catch (error: any) {
      // If API fails, remove from local state for development
      if (error.status === 0 || error.message?.includes('Network')) {
        setIntegrations(integrations.filter(i => i.id !== integrationId));
        if (selectedIntegration?.id === integrationId) {
          setSelectedIntegration(null);
        }
        toast({
          title: "Integration Deleted (Local)",
          description: "Integration has been removed from the list.",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete integration",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!productId) {
      toast({
        title: "Error",
        description: "Product ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.apiUrl) {
      toast({
        title: "Validation Error",
        description: "Name and API URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedIntegration?.id) {
        await updateIntegration(productId, selectedIntegration.id, formData);
        toast({
          title: "Integration Updated",
          description: "Integration has been updated successfully.",
        });
      } else {
        await createIntegration(productId, formData as Integration);
        toast({
          title: "Integration Created",
          description: "Integration has been created successfully.",
        });
      }
      setIsDialogOpen(false);
      setSelectedIntegration(null);
      // Reload integrations
      try {
        const response = await getIntegrations(productId);
        setIntegrations(response.integrations || []);
      } catch {
        // If API fails, reload fallback data
        setIntegrations(getFallbackIntegrations());
      }
    } catch (error: any) {
      // If API fails, add to local state for development
      if (error.status === 0 || error.message?.includes('Network')) {
        const newIntegration: Integration = {
          ...formData as Integration,
          id: `integration_${Date.now()}`,
          productId: productId || '',
        };
        setIntegrations([...integrations, newIntegration]);
        setSelectedIntegration(newIntegration);
        setIsDialogOpen(false);
        toast({
          title: "Integration Created (Local)",
          description: "Integration has been added to the list.",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save integration",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddFieldMapping = () => {
    if (!newFieldMapping.sourceField || !newFieldMapping.targetField) {
      toast({
        title: "Validation Error",
        description: "Source and target fields are required",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      requestMapping: [...(prev.requestMapping || []), { ...newFieldMapping }],
    }));

    setNewFieldMapping({
      sourceField: "",
      targetField: "",
      required: false,
    });
    setShowCustomSourceField(false);
    setShowCustomTargetField(false);
  };

  const handleRemoveFieldMapping = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requestMapping: prev.requestMapping?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleTestIntegration = async () => {
    if (!productId || !selectedIntegration?.id) {
      toast({
        title: "Error",
        description: "Please save the integration first before testing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);
      // Create test data from field mappings
      const testData: Record<string, any> = {};
      formData.requestMapping?.forEach(mapping => {
        testData[mapping.sourceField] = mapping.defaultValue || `test_${mapping.sourceField}`;
      });

      const result = await testIntegration(productId, selectedIntegration.id, { testData });
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: "Integration test completed successfully.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Integration test failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message || "Failed to test integration",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Integrations List */}
        <div className="w-64 border-r bg-muted/30 flex flex-col min-w-0">
          <div className="p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold mb-2">Integrations</h2>
            <p className="text-xs text-muted-foreground truncate">
              {productName}{productVersion ? ` v${productVersion}` : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No integrations configured
              </div>
            ) : (
              integrations.map((integration) => (
                <Card
                  key={integration.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedIntegration?.id === integration.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedIntegration(integration);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{integration.name}</h3>
                        {integration.enabled ? (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {triggerPageOptions.find(opt => opt.value === integration.triggerPage)?.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Main Content - Integration Form */}
        <div className="flex-1 overflow-y-auto px-0 py-6 min-w-0">
          <div className="w-full px-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Integration Configuration</h1>
                  <p className="text-muted-foreground mt-1">
                    Configure API integrations for {productName}{productVersion ? ` v${productVersion}` : ''}
                  </p>
                </div>
              </div>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="w-4 h-4" />
                New Integration
              </Button>
            </div>

            {selectedIntegration ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedIntegration.name}</CardTitle>
                      <CardDescription>{selectedIntegration.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(selectedIntegration)} variant="outline" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      {selectedIntegration.id && (
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(selectedIntegration.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>API URL</Label>
                      <p className="text-sm text-muted-foreground break-all">{selectedIntegration.apiUrl}</p>
                    </div>
                    <div>
                      <Label>HTTP Method</Label>
                      <p className="text-sm text-muted-foreground">{selectedIntegration.method}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Trigger Page</Label>
                      <p className="text-sm text-muted-foreground">
                        {triggerPageOptions.find(opt => opt.value === selectedIntegration.triggerPage)?.label}
                      </p>
                    </div>
                    <div>
                      <Label>Authentication</Label>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedIntegration.credentials?.type || "None"}
                      </p>
                    </div>
                  </div>
                  {selectedIntegration.requestMapping && selectedIntegration.requestMapping.length > 0 && (
                    <div>
                      <Label>Request Field Mappings</Label>
                      <div className="mt-2 space-y-1">
                        {selectedIntegration.requestMapping.map((mapping, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            {mapping.sourceField} → {mapping.targetField}
                            {mapping.required && <span className="text-destructive ml-1">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Response Handling</Label>
                    <div className="mt-2 space-y-2">
                      {selectedIntegration.responseMapping?.onSuccess && (
                        <div>
                          <p className="text-xs font-semibold text-green-600 mb-1">On Success:</p>
                          <div className="space-y-1 text-sm text-muted-foreground ml-2">
                            {selectedIntegration.responseMapping.onSuccess.forwardToPage && (
                              <div>• Forward to: {proposalFormPages.find(p => p.id === selectedIntegration.responseMapping?.onSuccess?.forwardToPage)?.title || selectedIntegration.responseMapping.onSuccess.forwardToPage}</div>
                            )}
                            {selectedIntegration.responseMapping.onSuccess.showInPage && (
                              <div>• Show in: {proposalFormPages.find(p => p.id === selectedIntegration.responseMapping?.onSuccess?.showInPage)?.title || selectedIntegration.responseMapping.onSuccess.showInPage}</div>
                            )}
                            {selectedIntegration.responseMapping.onSuccess.navigateToPage && (
                              <div>• Navigate to: {proposalFormPages.find(p => p.id === selectedIntegration.responseMapping?.onSuccess?.navigateToPage)?.title || selectedIntegration.responseMapping.onSuccess.navigateToPage}</div>
                            )}
                            {selectedIntegration.responseMapping.onSuccess.customAction?.apiUrl && (
                              <div>• Custom API: {selectedIntegration.responseMapping.onSuccess.customAction.apiUrl}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedIntegration.responseMapping?.onFailure && (
                        <div>
                          <p className="text-xs font-semibold text-red-600 mb-1">On Failure:</p>
                          <div className="space-y-1 text-sm text-muted-foreground ml-2">
                            {selectedIntegration.responseMapping.onFailure.blockNavigation && (
                              <div>• Block Navigation</div>
                            )}
                            {selectedIntegration.responseMapping.onFailure.navigateToPage && (
                              <div>• Navigate to: {proposalFormPages.find(p => p.id === selectedIntegration.responseMapping?.onFailure?.navigateToPage)?.title || selectedIntegration.responseMapping.onFailure.navigateToPage}</div>
                            )}
                            {selectedIntegration.responseMapping.onFailure.showError && (
                              <div>• Show Error Message</div>
                            )}
                            {selectedIntegration.responseMapping.onFailure.customAction?.apiUrl && (
                              <div>• Custom API: {selectedIntegration.responseMapping.onFailure.customAction.apiUrl}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {integrations.length === 0 
                      ? "No integrations configured. Click 'New Integration' to create one."
                      : "Select an integration from the sidebar to view details or create a new one."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Integration" : "Create New Integration"}</DialogTitle>
            <DialogDescription>
              Configure API integration settings, authentication, and response handling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Integration Name *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Vehicle Data Lookup, Customer Verification"
                  />
                </div>
                <div className="space-y-2">
                  <Label>HTTP Method *</Label>
                  <Select
                    value={formData.method || "POST"}
                    onValueChange={(value: "GET" | "POST" | "PUT" | "PATCH") =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {httpMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this integration does..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>API URL *</Label>
                <Input
                  value={formData.apiUrl || ""}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
            </div>

            <Separator />

            {/* Trigger Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold">Trigger Configuration</h3>
              <div className="space-y-2">
                <Label>Trigger Page *</Label>
                <Select
                  value={formData.triggerPage || "home"}
                  onValueChange={(value: IntegrationTriggerPage) =>
                    setFormData({ ...formData, triggerPage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerPageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Authentication */}
            <div className="space-y-4">
              <h3 className="font-semibold">Authentication</h3>
              <div className="space-y-2">
                <Label>Authentication Type</Label>
                <Select
                  value={formData.credentials?.type || "apiKey"}
                  onValueChange={(value: AuthType) =>
                    setFormData({
                      ...formData,
                      credentials: { ...formData.credentials, type: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {authTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.credentials?.type === "apiKey" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key *</Label>
                    <Input
                      type="password"
                      value={formData.credentials?.apiKey || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, apiKey: e.target.value },
                        })
                      }
                      placeholder="Enter API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Header Name</Label>
                    <Input
                      value={formData.credentials?.apiKeyHeader || "X-API-Key"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, apiKeyHeader: e.target.value },
                        })
                      }
                      placeholder="X-API-Key"
                    />
                  </div>
                </div>
              )}

              {formData.credentials?.type === "bearer" && (
                <div className="space-y-2">
                  <Label>Bearer Token *</Label>
                  <Input
                    type="password"
                    value={formData.credentials?.bearerToken || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentials: { ...formData.credentials, bearerToken: e.target.value },
                      })
                    }
                    placeholder="Enter bearer token"
                  />
                </div>
              )}

              {formData.credentials?.type === "basic" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username *</Label>
                    <Input
                      value={formData.credentials?.username || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, username: e.target.value },
                        })
                      }
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={formData.credentials?.password || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, password: e.target.value },
                        })
                      }
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Request Mapping */}
            <div className="space-y-4">
              <h3 className="font-semibold">Request Field Mapping</h3>
              <p className="text-sm text-muted-foreground">
                Map form fields to API request fields (e.g., chassisNumber → chassis_number)
              </p>
              <div className="space-y-2">
                {formData.requestMapping?.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input value={mapping.sourceField} disabled size="sm" />
                      <span className="text-center text-muted-foreground">→</span>
                      <Input value={mapping.targetField} disabled size="sm" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFieldMapping(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {showCustomSourceField ? (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Enter custom field name"
                          value={newFieldMapping.sourceField}
                          onChange={(e) =>
                            setNewFieldMapping({ ...newFieldMapping, sourceField: e.target.value })
                          }
                          size="sm"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setShowCustomSourceField(false);
                            setNewFieldMapping({ ...newFieldMapping, sourceField: "" });
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={newFieldMapping.sourceField || ""}
                        onValueChange={(value) => {
                          if (value === "__custom__") {
                            setShowCustomSourceField(true);
                            setNewFieldMapping({ ...newFieldMapping, sourceField: "" });
                          } else {
                            setNewFieldMapping({ ...newFieldMapping, sourceField: value });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select source field" />
                        </SelectTrigger>
                        <SelectContent>
                          {proposalFormFields.length > 0 ? (
                            <>
                              {proposalFormFields.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{field.label}</span>
                                    <span className="text-xs text-muted-foreground">({field.name})</span>
                                  </div>
                                </SelectItem>
                              ))}
                              <Separator className="my-1" />
                              <SelectItem value="__custom__">
                                <div className="flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  <span>Enter custom field</span>
                                </div>
                              </SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="__custom__">
                                <div className="flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  <span>Enter custom field</span>
                                </div>
                              </SelectItem>
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                No proposal form fields found. Create a proposal form first.
                              </div>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    <span className="text-center text-muted-foreground">→</span>
                    {showCustomTargetField ? (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Enter custom field name"
                          value={newFieldMapping.targetField}
                          onChange={(e) =>
                            setNewFieldMapping({ ...newFieldMapping, targetField: e.target.value })
                          }
                          size="sm"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setShowCustomTargetField(false);
                            setNewFieldMapping({ ...newFieldMapping, targetField: "" });
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={newFieldMapping.targetField || ""}
                        onValueChange={(value) => {
                          if (value === "__custom__") {
                            setShowCustomTargetField(true);
                            setNewFieldMapping({ ...newFieldMapping, targetField: "" });
                          } else {
                            setNewFieldMapping({ ...newFieldMapping, targetField: value });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select target field" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonTargetFields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <SelectItem value="__custom__">
                            <div className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              <span>Enter custom field</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={newFieldMapping.required || false}
                        onChange={(e) =>
                          setNewFieldMapping({ ...newFieldMapping, required: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      Required
                    </Label>
                    <Button onClick={handleAddFieldMapping} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Response Mapping */}
            <div className="space-y-4">
              <h3 className="font-semibold">Response Handling</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Success Field Path</Label>
                  <Input
                    value={formData.responseMapping?.successField || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responseMapping: {
                          ...formData.responseMapping,
                          successField: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., status or data.success"
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON path to check for success (e.g., "status" or "data.success")
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Success Value</Label>
                  <Input
                    value={formData.responseMapping?.successValue?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responseMapping: {
                          ...formData.responseMapping,
                          successValue: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., success or true"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data Field Path</Label>
                <Input
                  value={formData.responseMapping?.dataField || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responseMapping: {
                        ...formData.responseMapping,
                        dataField: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., data or result"
                />
                <p className="text-xs text-muted-foreground">
                  JSON path to extract data from response
                </p>
              </div>
              {/* Success Actions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-green-600">If Success</h4>
                <div className="space-y-4 pl-4 border-l-2 border-green-200">
                  <div className="space-y-2">
                    <Label>Forward to Page</Label>
                    <Select
                      value={formData.responseMapping?.onSuccess?.forwardToPage || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          responseMapping: {
                            ...formData.responseMapping,
                            onSuccess: {
                              ...formData.responseMapping?.onSuccess,
                              forwardToPage: value === "none" ? undefined : value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select page (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {proposalFormPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Forward response data to selected page
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Show in Page</Label>
                    <Select
                      value={formData.responseMapping?.onSuccess?.showInPage || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          responseMapping: {
                            ...formData.responseMapping,
                            onSuccess: {
                              ...formData.responseMapping?.onSuccess,
                              showInPage: value === "none" ? undefined : value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select page (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {proposalFormPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Display response data in selected page
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Navigate to Page</Label>
                    <Select
                      value={formData.responseMapping?.onSuccess?.navigateToPage || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          responseMapping: {
                            ...formData.responseMapping,
                            onSuccess: {
                              ...formData.responseMapping?.onSuccess,
                              navigateToPage: value === "none" ? undefined : value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select page (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {proposalFormPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Navigate to a specific page on success
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom API Action (Optional)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="API URL"
                        value={formData.responseMapping?.onSuccess?.customAction?.apiUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            responseMapping: {
                              ...formData.responseMapping,
                              onSuccess: {
                                ...formData.responseMapping?.onSuccess,
                                customAction: {
                                  ...formData.responseMapping?.onSuccess?.customAction,
                                  apiUrl: e.target.value,
                                },
                              },
                            },
                          })
                        }
                      />
                      <Select
                        value={formData.responseMapping?.onSuccess?.customAction?.method || "POST"}
                        onValueChange={(value: "GET" | "POST" | "PUT" | "PATCH") =>
                          setFormData({
                            ...formData,
                            responseMapping: {
                              ...formData.responseMapping,
                              onSuccess: {
                                ...formData.responseMapping?.onSuccess,
                                customAction: {
                                  ...formData.responseMapping?.onSuccess?.customAction,
                                  method: value,
                                },
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {httpMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Call a custom API on success
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Failure Actions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-red-600">If Failure</h4>
                <div className="space-y-4 pl-4 border-l-2 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Block Navigation</Label>
                      <p className="text-xs text-muted-foreground">
                        Block navigation if integration fails
                      </p>
                    </div>
                    <Switch
                      checked={formData.responseMapping?.onFailure?.blockNavigation || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          responseMapping: {
                            ...formData.responseMapping,
                            onFailure: {
                              ...formData.responseMapping?.onFailure,
                              blockNavigation: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Error Message</Label>
                      <p className="text-xs text-muted-foreground">
                        Display error message to user
                      </p>
                    </div>
                    <Switch
                      checked={formData.responseMapping?.onFailure?.showError || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          responseMapping: {
                            ...formData.responseMapping,
                            onFailure: {
                              ...formData.responseMapping?.onFailure,
                              showError: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Navigate to Page</Label>
                    <Select
                      value={formData.responseMapping?.onFailure?.navigateToPage || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          responseMapping: {
                            ...formData.responseMapping,
                            onFailure: {
                              ...formData.responseMapping?.onFailure,
                              navigateToPage: value === "none" ? undefined : value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select page (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {proposalFormPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Navigate to a specific page on failure (e.g., failure page)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom API Action (Optional)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="API URL"
                        value={formData.responseMapping?.onFailure?.customAction?.apiUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            responseMapping: {
                              ...formData.responseMapping,
                              onFailure: {
                                ...formData.responseMapping?.onFailure,
                                customAction: {
                                  ...formData.responseMapping?.onFailure?.customAction,
                                  apiUrl: e.target.value,
                                },
                              },
                            },
                          })
                        }
                      />
                      <Select
                        value={formData.responseMapping?.onFailure?.customAction?.method || "POST"}
                        onValueChange={(value: "GET" | "POST" | "PUT" | "PATCH") =>
                          setFormData({
                            ...formData,
                            responseMapping: {
                              ...formData.responseMapping,
                              onFailure: {
                                ...formData.responseMapping?.onFailure,
                                customAction: {
                                  ...formData.responseMapping?.onFailure?.customAction,
                                  method: value,
                                },
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {httpMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Call a custom API on failure
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable this integration
                </p>
              </div>
              <Switch
                checked={formData.enabled !== false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {isEditing && selectedIntegration?.id && (
              <Button
                variant="outline"
                onClick={handleTestIntegration}
                disabled={isTesting}
                className="gap-2"
              >
                <TestTube className="w-4 h-4" />
                {isTesting ? "Testing..." : "Test"}
              </Button>
            )}
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>

          {testResult && (
            <div className="mt-4 p-4 border rounded">
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {testResult.success ? "Test Successful" : "Test Failed"}
                </span>
              </div>
              {testResult.statusCode && (
                <p className="text-sm text-muted-foreground">
                  Status Code: {testResult.statusCode}
                </p>
              )}
              {testResult.error && (
                <p className="text-sm text-red-500">{testResult.error}</p>
              )}
              {testResult.response && (
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-40">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsConfigurator;

