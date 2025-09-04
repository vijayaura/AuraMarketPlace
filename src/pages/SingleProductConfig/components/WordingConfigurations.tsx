import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, X, Eye, Edit, Save } from "lucide-react";
// Dialog imported above
import type { PolicyWording } from "@/lib/api/insurers";

type Props = {
  policyWordingsError: string | null;
  isLoadingPolicyWordings: boolean;
  openUploadDialog: () => void;
  policyWordings: PolicyWording[];
  openEditDialog: (w: any) => void;
  isWordingUploadDialogOpen: boolean;
  setIsWordingUploadDialogOpen: (open: boolean) => void;
  editingWording: any;
  wordingUploadTitle: string;
  setWordingUploadTitle: (v: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  wordingUploadFile: File | null;
  wordingUploadActive: boolean;
  setWordingUploadActive: (v: boolean) => void;
  handleSavePolicyWording: () => Promise<void> | void;
  isUploadingWording: boolean;
  handleToggleWordingActive: (wording: PolicyWording, isActive: boolean) => Promise<void>;
};

export default function WordingConfigurations(props: Props) {
  const {
    policyWordingsError,
    isLoadingPolicyWordings,
    openUploadDialog,
    policyWordings,
    openEditDialog,
    isWordingUploadDialogOpen,
    setIsWordingUploadDialogOpen,
    editingWording,
    wordingUploadTitle,
    setWordingUploadTitle,
    handleFileUpload,
    wordingUploadFile,
    wordingUploadActive,
    setWordingUploadActive,
    handleSavePolicyWording,
    isUploadingWording,
    handleToggleWordingActive,
  } = props;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Policy Wording Documents</h2>
          <p className="text-muted-foreground">Upload and manage policy wording documents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
          <Button variant="outline" onClick={openUploadDialog} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {policyWordingsError && (
        <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
          {policyWordingsError}
        </div>
      )}

      {/* Uploaded Policy Wordings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Uploaded Policy Wordings</h3>
        
        {isLoadingPolicyWordings ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {policyWordings.map((wording) => (
              <div key={wording.id} className="p-6 border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{wording.document_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {wording.upload_date} • Size: {wording.file_size_kb} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {Number(wording.is_active) === 1 ? 'Active' : 'Inactive'}
                      </span>
                      <Switch 
                        checked={Number(wording.is_active) === 1}
                        onCheckedChange={(checked) => {
                          handleToggleWordingActive(wording, checked);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(wording)} className="gap-1">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                        // Handle delete functionality
                        console.log('Delete wording:', wording);
                      }}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload/Edit Wording Dialog */}
      <Dialog open={isWordingUploadDialogOpen} onOpenChange={setIsWordingUploadDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingWording ? 'Edit Policy Wording' : 'Upload Policy Wording'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wording-title">Document Title *</Label>
              <Input
                id="wording-title"
                value={wordingUploadTitle}
                onChange={(e) => setWordingUploadTitle(e.target.value)}
                placeholder="e.g., Policy Wording v2.1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input id="wording-file" type="file" accept="application/pdf" onChange={handleFileUpload} />
              {wordingUploadFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{wordingUploadFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleFileUpload({ target: { files: null } } as any)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePolicyWording} disabled={!wordingUploadTitle || (!editingWording && !wordingUploadFile)}>
              {isUploadingWording ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                  Saving…
                </span>
              ) : (
                'Save Wording'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


