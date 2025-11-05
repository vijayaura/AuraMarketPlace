import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, Trash2, Shield, GripVertical, X, Edit, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface RatingParameter {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "dropdown" | "date" | "checkbox" | "multiselect";
  options?: string[];
}

interface Condition {
  id: string;
  parameterId: string;
  operator: "equals" | "notEquals" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "contains" | "in";
  value: string | number | string[];
}

interface UWRule {
  id: string;
  name: string;
  description?: string;
  conditions: Condition[];
  trueActions: string[]; // Quote options when conditions match
  falseActions: string[]; // Quote options when conditions don't match
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const UWRulesDesign = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  // Mock rating parameters - these would come from the rating configurator
  const [ratingParameters] = useState<RatingParameter[]>([
    { id: "param1", name: "projectType", label: "Project Type", type: "dropdown", options: ["Residential", "Commercial", "Industrial", "Infrastructure"] },
    { id: "param2", name: "constructionType", label: "Construction Type", type: "dropdown", options: ["New Construction", "Renovation", "Extension", "Demolition"] },
    { id: "param3", name: "projectValue", label: "Project Value (AED)", type: "number" },
    { id: "param4", name: "sumInsured", label: "Sum Insured (AED)", type: "number" },
    { id: "param5", name: "contractWorks", label: "Contract Works (AED)", type: "number" },
    { id: "param6", name: "plantEquipment", label: "Plant & Equipment (AED)", type: "number" },
    { id: "param7", name: "projectDuration", label: "Project Duration (months)", type: "number" },
    { id: "param8", name: "locationHazard", label: "Location Hazard Level", type: "dropdown", options: ["Low", "Moderate", "High", "Very High"] },
    { id: "param9", name: "contractorExperience", label: "Contractor Experience (years)", type: "number" },
    { id: "param10", name: "deductible", label: "Deductible Preference (AED)", type: "number" },
    { id: "param11", name: "safetyRecord", label: "Safety Record", type: "dropdown", options: ["Poor", "Average", "Good", "Excellent"] },
    { id: "param12", name: "claimFrequency", label: "Claim Frequency (last 5 years)", type: "number" },
    { id: "param13", name: "lossRatio", label: "Loss Ratio (%)", type: "number" },
  ]);

  const quoteOptions = ["Quote", "No Quote", "Refer to UW"];

  const [rules, setRules] = useState<UWRule[]>([
    {
      id: "rule1",
      name: "High Risk Project",
      description: "Auto-reject projects with very high risk factors",
      conditions: [
        { id: "cond1", parameterId: "param8", operator: "equals", value: "Very High" },
        { id: "cond2", parameterId: "param11", operator: "equals", value: "Poor" },
      ],
      trueActions: ["No Quote"],
      falseActions: ["Quote", "Refer to UW"],
      priority: 1,
      isActive: true,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    },
  ]);

  const [selectedRule, setSelectedRule] = useState<UWRule | null>(null);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [ruleBuilder, setRuleBuilder] = useState<Partial<UWRule>>({
    conditions: [],
    trueActions: [],
    falseActions: [],
    priority: 1,
    isActive: true,
  });
  const [draggedParameter, setDraggedParameter] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!newRuleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a rule name.",
        variant: "destructive",
      });
      return;
    }

    if (!ruleBuilder.conditions || ruleBuilder.conditions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one condition.",
        variant: "destructive",
      });
      return;
    }

    if (!ruleBuilder.trueActions || ruleBuilder.trueActions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one action for true conditions.",
        variant: "destructive",
      });
      return;
    }

    if (!ruleBuilder.falseActions || ruleBuilder.falseActions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one action for false conditions.",
        variant: "destructive",
      });
      return;
    }

    const newRule: UWRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      description: newRuleDescription,
      conditions: ruleBuilder.conditions,
      trueActions: ruleBuilder.trueActions,
      falseActions: ruleBuilder.falseActions,
      priority: ruleBuilder.priority || 1,
      isActive: ruleBuilder.isActive !== false,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    if (isEditing && selectedRule) {
      setRules(rules.map(r => r.id === selectedRule.id ? { ...newRule, id: selectedRule.id } : r));
      toast({
        title: "Rule Updated",
        description: `${newRuleName} has been updated.`,
      });
    } else {
      setRules([...rules, newRule]);
      toast({
        title: "Rule Created",
        description: `${newRuleName} has been created.`,
      });
    }

    setIsAddRuleDialogOpen(false);
    setNewRuleName("");
    setNewRuleDescription("");
    setRuleBuilder({
      conditions: [],
      trueActions: [],
      falseActions: [],
      priority: 1,
      isActive: true,
    });
    setSelectedRule(null);
    setIsEditing(false);
  };

  const handleStartEditing = (rule: UWRule) => {
    setSelectedRule(rule);
    setNewRuleName(rule.name);
    setNewRuleDescription(rule.description || "");
    setRuleBuilder({
      conditions: rule.conditions,
      trueActions: rule.trueActions,
      falseActions: rule.falseActions,
      priority: rule.priority,
      isActive: rule.isActive,
    });
    setIsEditing(true);
    setIsAddRuleDialogOpen(true);
  };

  const handleDragStart = (parameterId: string) => {
    setDraggedParameter(parameterId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropCondition = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedParameter) return;

    const param = ratingParameters.find(p => p.id === draggedParameter);
    if (!param) return;

    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      parameterId: draggedParameter,
      operator: param.type === "number" ? "greaterThan" : "equals",
      value: param.type === "number" ? 0 : (param.options?.[0] || ""),
    };

    setRuleBuilder({
      ...ruleBuilder,
      conditions: [...(ruleBuilder.conditions || []), newCondition],
    });
    setDraggedParameter(null);
  };

  const handleUpdateCondition = (conditionId: string, updates: Partial<Condition>) => {
    setRuleBuilder({
      ...ruleBuilder,
      conditions: (ruleBuilder.conditions || []).map(c =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    });
  };

  const handleRemoveCondition = (conditionId: string) => {
    setRuleBuilder({
      ...ruleBuilder,
      conditions: (ruleBuilder.conditions || []).filter(c => c.id !== conditionId),
    });
  };

  const getConditionDisplay = (condition: Condition): string => {
    const param = ratingParameters.find(p => p.id === condition.parameterId);
    if (!param) return "Unknown";

    const operatorLabels: Record<string, string> = {
      equals: "=",
      notEquals: "≠",
      greaterThan: ">",
      lessThan: "<",
      greaterThanOrEqual: "≥",
      lessThanOrEqual: "≤",
      contains: "contains",
      in: "in",
    };

    const valueDisplay = Array.isArray(condition.value)
      ? condition.value.join(", ")
      : condition.value;

    return `${param.label} ${operatorLabels[condition.operator] || condition.operator} ${valueDisplay}`;
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
            <h1 className="text-2xl font-bold text-foreground">UW Rules Design</h1>
            <p className="text-sm text-muted-foreground">
              {productName} {productVersion ? `v${productVersion}` : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => {
          toast({
            title: "Saved",
            description: "UW Rules have been saved.",
          });
        }}>
          <Save className="w-4 h-4 mr-2" />
          Save Rules
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Rules List */}
        <div className="w-80 border-r bg-muted/20 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">UW Rules</h2>
            <Button
              size="sm"
              onClick={() => {
                setSelectedRule(null);
                setNewRuleName("");
                setNewRuleDescription("");
                setRuleBuilder({
                  conditions: [],
                  trueActions: [],
                  falseActions: [],
                  priority: 1,
                  isActive: true,
                });
                setIsEditing(false);
                setIsAddRuleDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                className={`cursor-pointer transition-colors ${
                  selectedRule?.id === rule.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedRule(rule)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{rule.name}</CardTitle>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {rule.description && (
                    <CardDescription className="text-xs">{rule.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground mb-2">
                    {rule.conditions.length} condition(s) • Priority: {rule.priority}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditing(rule);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRules(rules.filter(r => r.id !== rule.id));
                        if (selectedRule?.id === rule.id) {
                          setSelectedRule(null);
                        }
                        toast({
                          title: "Rule Deleted",
                          description: `${rule.name} has been deleted.`,
                        });
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {selectedRule ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedRule.name}</h2>
                  {selectedRule.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedRule.description}</p>
                  )}
                </div>
                <Badge variant={selectedRule.isActive ? "default" : "secondary"}>
                  {selectedRule.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conditions</CardTitle>
                    <CardDescription>
                      If all these conditions are met, execute true actions, otherwise execute false actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedRule.conditions.map((condition, index) => (
                        <div key={condition.id} className="flex items-center gap-2 p-3 border rounded">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index === 0 ? "IF" : "AND"}
                          </span>
                          <Badge variant="outline" className="flex-1 justify-start">
                            {getConditionDisplay(condition)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* True Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      True Actions (When conditions match)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedRule.trueActions.map((action) => (
                        <Badge key={action} variant="default" className="bg-green-600">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* False Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      False Actions (When conditions don't match)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedRule.falseActions.map((action) => (
                        <Badge key={action} variant="destructive">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle>Priority: {selectedRule.priority}</CardTitle>
                    <CardDescription>
                      Rules with lower priority numbers are evaluated first.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rule Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a rule from the left sidebar or create a new one to get started.
              </p>
              <Button onClick={() => setIsAddRuleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Rule
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit UW Rule" : "Create New UW Rule"}</DialogTitle>
            <DialogDescription>
              Define conditions and actions for underwriting rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g., High Risk Project Auto-Reject"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  placeholder="Rule description (optional)"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Rating Parameters */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Rating Parameters</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Drag and drop rating parameters to create conditions
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                  {ratingParameters.map((param) => (
                    <Badge
                      key={param.id}
                      variant="outline"
                      className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
                      draggable
                      onDragStart={() => handleDragStart(param.id)}
                    >
                      <GripVertical className="w-4 h-4 mr-2" />
                      {param.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Conditions */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Conditions</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 min-h-[100px] bg-muted/5 mb-4"
                  onDragOver={handleDragOver}
                  onDrop={handleDropCondition}
                >
                  {ruleBuilder.conditions && ruleBuilder.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {ruleBuilder.conditions.map((condition, index) => {
                        const param = ratingParameters.find(p => p.id === condition.parameterId);
                        return (
                          <div key={condition.id} className="flex items-center gap-2 p-3 border rounded bg-background">
                            <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
                              {index === 0 ? "IF" : "AND"}
                            </span>
                            <Select
                              value={condition.parameterId}
                              onValueChange={(value) => {
                                const newParam = ratingParameters.find(p => p.id === value);
                                handleUpdateCondition(condition.id, {
                                  parameterId: value,
                                  operator: newParam?.type === "number" ? "greaterThan" : "equals",
                                  value: newParam?.type === "number" ? 0 : (newParam?.options?.[0] || ""),
                                });
                              }}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ratingParameters.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => handleUpdateCondition(condition.id, { operator: value as any })}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">=</SelectItem>
                                <SelectItem value="notEquals">≠</SelectItem>
                                <SelectItem value="greaterThan">&gt;</SelectItem>
                                <SelectItem value="lessThan">&lt;</SelectItem>
                                <SelectItem value="greaterThanOrEqual">≥</SelectItem>
                                <SelectItem value="lessThanOrEqual">≤</SelectItem>
                                <SelectItem value="contains">contains</SelectItem>
                                <SelectItem value="in">in</SelectItem>
                              </SelectContent>
                            </Select>
                            {param?.type === "dropdown" && param.options ? (
                              <Select
                                value={condition.value as string}
                                onValueChange={(value) => handleUpdateCondition(condition.id, { value })}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {param.options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={param?.type === "number" ? "number" : "text"}
                                value={condition.value as string}
                                onChange={(e) => handleUpdateCondition(condition.id, {
                                  value: param?.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                                })}
                                className="w-[150px]"
                                placeholder="Value"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCondition(condition.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Drag and drop rating parameters here to create conditions
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* True Actions */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  True Actions (When conditions match) *
                </Label>
                <div className="space-y-2">
                  {quoteOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`true-${option}`}
                        checked={ruleBuilder.trueActions?.includes(option) || false}
                        onCheckedChange={(checked) => {
                          const currentActions = ruleBuilder.trueActions || [];
                          if (checked) {
                            setRuleBuilder({
                              ...ruleBuilder,
                              trueActions: [...currentActions, option],
                            });
                          } else {
                            setRuleBuilder({
                              ...ruleBuilder,
                              trueActions: currentActions.filter(a => a !== option),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`true-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* False Actions */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  False Actions (When conditions don't match) *
                </Label>
                <div className="space-y-2">
                  {quoteOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`false-${option}`}
                        checked={ruleBuilder.falseActions?.includes(option) || false}
                        onCheckedChange={(checked) => {
                          const currentActions = ruleBuilder.falseActions || [];
                          if (checked) {
                            setRuleBuilder({
                              ...ruleBuilder,
                              falseActions: [...currentActions, option],
                            });
                          } else {
                            setRuleBuilder({
                              ...ruleBuilder,
                              falseActions: currentActions.filter(a => a !== option),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`false-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input
                type="number"
                min="1"
                value={ruleBuilder.priority || 1}
                onChange={(e) => setRuleBuilder({
                  ...ruleBuilder,
                  priority: parseInt(e.target.value) || 1,
                })}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Rules with lower priority numbers are evaluated first.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={ruleBuilder.isActive !== false}
                onCheckedChange={(checked) => setRuleBuilder({
                  ...ruleBuilder,
                  isActive: checked === true,
                })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Rule is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddRuleDialogOpen(false);
              setNewRuleName("");
              setNewRuleDescription("");
              setRuleBuilder({
                conditions: [],
                trueActions: [],
                falseActions: [],
                priority: 1,
                isActive: true,
              });
              setSelectedRule(null);
              setIsEditing(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddRule}>
              {isEditing ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UWRulesDesign;

