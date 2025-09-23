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
  isUploadingFile: boolean;
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
    isUploadingFile,
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
            {policyWordings.map((wording, index) => (
              <div key={index} className="p-6 border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{wording.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {wording.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {wording.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch 
                        checked={wording.is_active}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingWording ? 'Edit Policy Wording' : 'Upload Policy Wording'}
            </DialogTitle>
            <DialogDescription>
              {editingWording ? 'Update the policy wording document details.' : 'Upload a new policy wording document for customers to download.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Document Title */}
            <div className="space-y-2">
              <Label htmlFor="wording-title" className="text-sm font-medium">
                Document Title *
              </Label>
              <Input
                id="wording-title"
                value={wordingUploadTitle}
                onChange={(e) => setWordingUploadTitle(e.target.value)}
                placeholder="e.g., Professional Liability Policy Wording v2.1"
                className="h-10"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Document File *
              </Label>
              
              {/* File Input Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {isUploadingFile 
                        ? 'Uploading file...' 
                        : wordingUploadFile 
                          ? 'File uploaded successfully' 
                          : 'Choose a PDF file to upload'
                      }
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('wording-file')?.click()}
                      disabled={isUploadingFile}
                      className="gap-2"
                    >
                      {isUploadingFile ? (
                        <>
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Input 
                    id="wording-file" 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-gray-500">
                    PDF files only, max 10MB
                  </p>
                </div>
              </div>

              {/* Selected File Display */}
              {wordingUploadFile && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isUploadingFile 
                    ? 'bg-blue-50 border-blue-200' 
                    : (wordingUploadFile as File & { uploadedUrl?: string }).uploadedUrl
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                }`}>
                  {isUploadingFile ? (
                    <span className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></span>
                  ) : (
                    <FileText className={`w-5 h-5 flex-shrink-0 ${
                      (wordingUploadFile as File & { uploadedUrl?: string }).uploadedUrl
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isUploadingFile 
                        ? 'text-blue-800' 
                        : (wordingUploadFile as File & { uploadedUrl?: string }).uploadedUrl
                          ? 'text-green-800'
                          : 'text-yellow-800'
                    }`}>
                      {wordingUploadFile.name}
                    </p>
                    <p className={`text-xs ${
                      isUploadingFile 
                        ? 'text-blue-600' 
                        : (wordingUploadFile as File & { uploadedUrl?: string }).uploadedUrl
                          ? 'text-green-600'
                          : 'text-yellow-600'
                    }`}>
                      {isUploadingFile 
                        ? 'Uploading...' 
                        : `${(wordingUploadFile.size / 1024).toFixed(1)} KB${
                            (wordingUploadFile as File & { uploadedUrl?: string }).uploadedUrl 
                              ? ' • Uploaded' 
                              : ' • Ready to upload'
                          }`
                      }
                    </p>
                  </div>
                  {!isUploadingFile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        handleFileUpload({ target: { files: null } } as any);
                        // Clear the file input
                        const fileInput = document.getElementById('wording-file') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className={`flex-shrink-0 ${
                        (wordingUploadFile as File & { uploadedUrl?: string }).uploadedUrl
                          ? 'text-green-600 hover:text-green-800'
                          : 'text-yellow-600 hover:text-yellow-800'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox 
                id="wording-active" 
                checked={wordingUploadActive}
                onCheckedChange={setWordingUploadActive}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div className="space-y-1">
                <Label htmlFor="wording-active" className="text-sm font-medium cursor-pointer">
                  Active Document
                </Label>
                <p className="text-xs text-gray-600">
                  When active, this document will be available for customers to download
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsWordingUploadDialogOpen(false)}
              disabled={isUploadingWording}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePolicyWording} 
              disabled={!wordingUploadTitle || (!editingWording && !wordingUploadFile) || isUploadingWording || isUploadingFile}
              className="min-w-[120px]"
            >
              {isUploadingWording ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving…
                </span>
              ) : isUploadingFile ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading File…
                </span>
              ) : (
                editingWording ? 'Update Wording' : 'Save Wording'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


