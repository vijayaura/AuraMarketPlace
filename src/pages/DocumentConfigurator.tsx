import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, Trash2, Image, FileText, Table, Type, GripVertical, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Types
interface RatingParameter {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "dropdown" | "date" | "checkbox" | "multiselect";
}

interface DocumentElement {
  id: string;
  type: "field" | "logo" | "text" | "table";
  content?: string; // For text, logo URL, etc.
  fieldId?: string; // For rating parameter fields
  position: { x: number; y: number };
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    alignment?: "left" | "center" | "right";
    width?: number;
    height?: number;
  };
}

interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  header: DocumentElement[];
  body: DocumentElement[];
  footer: DocumentElement[];
  createdAt: string;
  updatedAt: string;
}

const DocumentConfigurator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  // Mock rating parameters - these would come from the rating configurator
  const [ratingParameters] = useState<RatingParameter[]>([
    // Proposal Form Parameters
    { id: "param1", name: "projectType", label: "Project Type", type: "dropdown" },
    { id: "param2", name: "constructionType", label: "Construction Type", type: "dropdown" },
    { id: "param3", name: "projectValue", label: "Project Value (AED)", type: "number" },
    { id: "param4", name: "sumInsured", label: "Sum Insured (AED)", type: "number" },
    { id: "param5", name: "contractWorks", label: "Contract Works (AED)", type: "number" },
    { id: "param6", name: "plantEquipment", label: "Plant & Equipment (AED)", type: "number" },
    { id: "param7", name: "projectDuration", label: "Project Duration (months)", type: "number" },
    { id: "param8", name: "locationHazard", label: "Location Hazard Level", type: "dropdown" },
    { id: "param9", name: "contractorExperience", label: "Contractor Experience (years)", type: "number" },
    { id: "param10", name: "deductible", label: "Deductible Preference (AED)", type: "number" },
    // Premium Related Metrics
    { id: "premium1", name: "basePremium", label: "Base Premium (AED)", type: "number" },
    { id: "premium2", name: "totalPremium", label: "Total Premium (AED)", type: "number" },
    { id: "premium3", name: "premiumAdjustment", label: "Premium Adjustment (AED)", type: "number" },
    { id: "premium4", name: "loading", label: "Loading (AED)", type: "number" },
    { id: "premium5", name: "discount", label: "Discount (AED)", type: "number" },
    { id: "premium6", name: "loadingPercentage", label: "Loading Percentage (%)", type: "number" },
    { id: "premium7", name: "discountPercentage", label: "Discount Percentage (%)", type: "number" },
    { id: "premium8", name: "vat", label: "VAT (AED)", type: "number" },
    { id: "premium9", name: "vatPercentage", label: "VAT Percentage (%)", type: "number" },
    { id: "premium10", name: "subtotal", label: "Subtotal (AED)", type: "number" },
    { id: "premium11", name: "annualPremium", label: "Annual Premium (AED)", type: "number" },
    { id: "premium12", name: "premiumBreakdown", label: "Premium Breakdown", type: "text" },
    // Fee Type Related Metrics
    { id: "fee1", name: "brokerCommission", label: "Broker Commission (AED)", type: "number" },
    { id: "fee2", name: "brokerCommissionPercentage", label: "Broker Commission (%)", type: "number" },
    { id: "fee3", name: "brokerMinimumCommission", label: "Broker Minimum Commission (%)", type: "number" },
    { id: "fee4", name: "brokerMaximumCommission", label: "Broker Maximum Commission (%)", type: "number" },
    { id: "fee5", name: "processingFee", label: "Processing Fee (AED)", type: "number" },
    { id: "fee6", name: "administrationFee", label: "Administration Fee (AED)", type: "number" },
    { id: "fee7", name: "serviceFee", label: "Service Fee (AED)", type: "number" },
    { id: "fee8", name: "policyFee", label: "Policy Fee (AED)", type: "number" },
    { id: "fee9", name: "stampDuty", label: "Stamp Duty (AED)", type: "number" },
    { id: "fee10", name: "underwritingFee", label: "Underwriting Fee (AED)", type: "number" },
    { id: "fee11", name: "totalFees", label: "Total Fees (AED)", type: "number" },
  ]);

  // Document templates
  const [templates, setTemplates] = useState<DocumentTemplate[]>([
    {
      id: "template1",
      name: "Quote Document",
      description: "Standard quote document template",
      header: [],
      body: [],
      footer: [],
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    },
    {
      id: "template2",
      name: "Policy Document",
      description: "Standard policy document template",
      header: [],
      body: [],
      footer: [],
      createdAt: "2024-01-16",
      updatedAt: "2024-01-16",
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedSection, setSelectedSection] = useState<"header" | "body" | "footer">("body");
  const [draggedElement, setDraggedElement] = useState<{ type: "parameter" | "element", id: string } | null>(null);
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<DocumentElement | null>(null);

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a template name.",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: DocumentTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription,
      header: [],
      body: [],
      footer: [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setTemplates([...templates, newTemplate]);
    setIsAddTemplateDialogOpen(false);
    setNewTemplateName("");
    setNewTemplateDescription("");
    toast({
      title: "Template Created",
      description: `${newTemplateName} has been created.`,
    });
  };

  const handleDragStart = (type: "parameter" | "element", id: string) => {
    setDraggedElement({ type, id });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedElement || !selectedTemplate) return;

    const section = selectedTemplate[selectedSection];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let newElement: DocumentElement;

    if (draggedElement.type === "parameter") {
      const param = ratingParameters.find(p => p.id === draggedElement.id);
      if (!param) return;

      newElement = {
        id: `element-${Date.now()}`,
        type: "field",
        fieldId: param.id,
        position: { x, y },
      };
    } else {
      // Dragging existing element
      const existingElement = [...selectedTemplate.header, ...selectedTemplate.body, ...selectedTemplate.footer]
        .find(el => el.id === draggedElement.id);
      if (!existingElement) return;

      newElement = { ...existingElement, position: { x, y } };
    }

    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: [...section, newElement],
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    setDraggedElement(null);
  };

  const handleAddElement = (type: "logo" | "text" | "table") => {
    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select a template first.",
        variant: "destructive",
      });
      return;
    }

    const newElement: DocumentElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === "text" ? "Enter text here" : type === "logo" ? "" : "",
      position: { x: 50, y: 50 },
      style: {
        fontSize: type === "text" ? 14 : undefined,
        alignment: "left",
      },
    };

    const section = selectedTemplate[selectedSection];
    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: [...section, newElement],
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    toast({
      title: "Element Added",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} element has been added.`,
    });
  };

  const handleEditElement = (element: DocumentElement) => {
    setEditingElement(element);
    setIsElementDialogOpen(true);
  };

  const handleSaveElement = () => {
    if (!editingElement || !selectedTemplate) return;

    const section = selectedTemplate[selectedSection];
    const updatedSection = section.map(el => el.id === editingElement.id ? editingElement : el);

    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: updatedSection,
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    setIsElementDialogOpen(false);
    setEditingElement(null);
  };

  const handleDeleteElement = (elementId: string) => {
    if (!selectedTemplate) return;

    const section = selectedTemplate[selectedSection];
    const updatedSection = section.filter(el => el.id !== elementId);

    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: updatedSection,
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const getElementLabel = (element: DocumentElement): string => {
    if (element.type === "field" && element.fieldId) {
      const param = ratingParameters.find(p => p.id === element.fieldId);
      return param ? param.label : "Unknown Field";
    }
    if (element.type === "text") return element.content || "Text";
    if (element.type === "logo") return "Logo";
    if (element.type === "table") return "Table";
    return "Element";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/market-admin/product-management")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Configurator Design</h1>
            <p className="text-sm text-muted-foreground">
              {productName} {productVersion ? `v${productVersion}` : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => {
          toast({
            title: "Saved",
            description: "Document templates have been saved.",
          });
        }}>
          <Save className="w-4 h-4 mr-2" />
          Save Templates
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Templates List */}
        <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Document Templates</h2>
            <Button
              size="sm"
              onClick={() => setIsAddTemplateDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    Updated: {new Date(template.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {selectedTemplate ? (
          <div className="flex-1 flex flex-col">
            {/* Section Tabs */}
            <div className="border-b px-6 py-2">
              <div className="flex gap-2">
                <Button
                  variant={selectedSection === "header" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSection("header")}
                >
                  Header
                </Button>
                <Button
                  variant={selectedSection === "body" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSection("body")}
                >
                  Body
                </Button>
                <Button
                  variant={selectedSection === "footer" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSection("footer")}
                >
                  Footer
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Middle - Rating Parameters & Elements */}
              <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3">Rating Parameters</h3>
                <div className="space-y-2 mb-6">
                  {ratingParameters.map((param) => (
                    <Badge
                      key={param.id}
                      variant="outline"
                      className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
                      draggable
                      onDragStart={() => handleDragStart("parameter", param.id)}
                    >
                      <GripVertical className="w-4 h-4 mr-2" />
                      {param.label}
                    </Badge>
                  ))}
                </div>

                <Separator className="my-4" />

                <h3 className="text-sm font-semibold mb-3">Add Elements</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddElement("logo")}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Logo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddElement("text")}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Text Box
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddElement("table")}
                  >
                    <Table className="w-4 h-4 mr-2" />
                    Table
                  </Button>
                </div>
              </div>

              {/* Right - Document Canvas */}
              <div className="flex-1 p-6 overflow-auto">
                <div
                  className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg min-h-[600px] bg-white"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ position: "relative" }}
                >
                  <div className="absolute top-2 left-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} Section
                  </div>
                  {selectedTemplate[selectedSection].map((element) => {
                    const param = element.type === "field" && element.fieldId
                      ? ratingParameters.find(p => p.id === element.fieldId)
                      : null;

                    return (
                      <div
                        key={element.id}
                        className="absolute border border-primary/50 bg-primary/5 rounded p-2 cursor-move hover:bg-primary/10"
                        style={{
                          left: `${element.position.x}px`,
                          top: `${element.position.y}px`,
                          minWidth: "100px",
                        }}
                        draggable
                        onDragStart={() => handleDragStart("element", element.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-primary">
                            {getElementLabel(element)}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditElement(element)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteElement(element.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {element.type === "field" && param && (
                          <div className="text-xs text-muted-foreground">
                            {`{{${param.name}}}`}
                          </div>
                        )}
                        {element.type === "text" && (
                          <div className="text-xs text-muted-foreground">
                            {element.content}
                          </div>
                        )}
                        {element.type === "logo" && (
                          <div className="text-xs text-muted-foreground">
                            [Logo Placeholder]
                          </div>
                        )}
                        {element.type === "table" && (
                          <div className="text-xs text-muted-foreground">
                            [Table Placeholder]
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a template from the left sidebar or create a new one to get started.
              </p>
              <Button onClick={() => setIsAddTemplateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Template
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Template Dialog */}
      <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new document template for your product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Quote Document"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Template description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Element Dialog */}
      <Dialog open={isElementDialogOpen} onOpenChange={setIsElementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Element</DialogTitle>
            <DialogDescription>
              Configure the element properties.
            </DialogDescription>
          </DialogHeader>
          {editingElement && (
            <div className="space-y-4 py-4">
              {editingElement.type === "text" && (
                <div className="space-y-2">
                  <Label>Text Content</Label>
                  <Textarea
                    value={editingElement.content || ""}
                    onChange={(e) => setEditingElement({
                      ...editingElement,
                      content: e.target.value,
                    })}
                    rows={4}
                  />
                </div>
              )}
              {editingElement.type === "logo" && (
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={editingElement.content || ""}
                    onChange={(e) => setEditingElement({
                      ...editingElement,
                      content: e.target.value,
                    })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Input
                    type="number"
                    value={editingElement.style?.fontSize || 14}
                    onChange={(e) => setEditingElement({
                      ...editingElement,
                      style: {
                        ...editingElement.style,
                        fontSize: parseInt(e.target.value) || 14,
                      },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editingElement.style?.alignment || "left"}
                    onChange={(e) => setEditingElement({
                      ...editingElement,
                      style: {
                        ...editingElement.style,
                        alignment: e.target.value as "left" | "center" | "right",
                      },
                    })}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsElementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveElement}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentConfigurator;

