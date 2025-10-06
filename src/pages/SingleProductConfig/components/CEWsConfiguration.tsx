import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Plus, Save } from "lucide-react";

export type TplExtension = {
  id: number;
  title: string;
  description: string;
  tplLimitValue: string;
  pricingType: "percentage" | "fixed";
  loadingDiscount: number;
};

export type CEWsConfigurationProps = {
  tplError: string | null;
  isLoadingTpl: boolean;
  tplLimit: string;
  setTplLimit: (val: string) => void;
  tplExtensions: TplExtension[];
  setTplExtensions: (val: TplExtension[]) => void;
  isSavingTpl: boolean;
  saveTplExtensions: () => void;
};

const CEWsConfiguration: React.FC<CEWsConfigurationProps> = ({
  tplError,
  isLoadingTpl,
  tplLimit,
  setTplLimit,
  tplExtensions,
  setTplExtensions,
  isSavingTpl,
  saveTplExtensions,
}) => {
  return (
    <>
      {(!tplLimit && !tplExtensions?.length) && !isLoadingTpl && (
        <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
          <p className="font-medium">Yet to configure this section</p>
          <p className="text-sm mt-1">Configure TPL limit and extensions below.</p>
        </div>
      )}
      {isLoadingTpl && (
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 border rounded-md">
            <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}

      {!isLoadingTpl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>TPL limit & Extensions</CardTitle>
                <CardDescription>
                  Configure Third Party Liability limit and related extensions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const newExtension: TplExtension = {
                      id: Date.now(),
                      title: "",
                      description: "",
                      tplLimitValue: "",
                      pricingType: "percentage",
                      loadingDiscount: 0,
                    };
                    setTplExtensions([...(tplExtensions || []), newExtension]);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Extension
                </Button>
                <Button size="sm" disabled={isSavingTpl} onClick={saveTplExtensions}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingTpl ? "Saving…" : "Save Extensions"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-limit">Default TPL Limit (AED)</Label>
                <Input
                  id="tpl-limit"
                  value={tplLimit}
                  onChange={(e) => setTplLimit(e.target.value)}
                  placeholder="Enter TPL limit amount"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">TPL Limit Extensions</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>TPL Limit Value (AED)</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Loading/Discount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tplExtensions || []).map((extension) => (
                    <TableRow key={extension.id}>
                      <TableCell>
                        <Input
                          value={extension.title}
                          onChange={(e) => {
                            setTplExtensions(
                              (tplExtensions || []).map((ext) =>
                                ext.id === extension.id ? { ...ext, title: e.target.value } : ext
                              )
                            );
                          }}
                          placeholder="Enter title"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={extension.description}
                          onChange={(e) => {
                            setTplExtensions(
                              (tplExtensions || []).map((ext) =>
                                ext.id === extension.id ? { ...ext, description: e.target.value } : ext
                              )
                            );
                          }}
                          placeholder="Enter description"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={extension.tplLimitValue}
                          onChange={(e) => {
                            setTplExtensions(
                              (tplExtensions || []).map((ext) =>
                                ext.id === extension.id ? { ...ext, tplLimitValue: e.target.value } : ext
                              )
                            );
                          }}
                          placeholder="Enter limit value"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={extension.pricingType}
                          onValueChange={(value: "percentage" | "fixed") => {
                            setTplExtensions(
                              (tplExtensions || []).map((ext) =>
                                ext.id === extension.id ? { ...ext, pricingType: value } : ext
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={extension.loadingDiscount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setTplExtensions(
                                (tplExtensions || []).map((ext) =>
                                  ext.id === extension.id ? { ...ext, loadingDiscount: isNaN(val) ? 0 : val } : ext
                                )
                              );
                            }}
                            placeholder="0"
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            {extension.pricingType === "percentage" ? "%" : "AED"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log('🗑️ Removing TPL extension with ID:', extension.id);
                            const updatedExtensions = (tplExtensions || []).filter((ext) => ext.id !== extension.id);
                            console.log('🔧 Remaining extensions after removal:', updatedExtensions.length);
                            setTplExtensions(updatedExtensions);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default CEWsConfiguration;
