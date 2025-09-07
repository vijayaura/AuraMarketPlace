import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";
import { listMasterDocumentTypes, type DocumentTypeItem } from "@/lib/api/masters";
import { uploadFile, type UploadedFile } from "@/lib/api/quotes";
import { useToast } from "@/hooks/use-toast";

interface DocumentItem {
  id: number;
  name: string;
  description: string;
  required: boolean;
  status: "pending" | "uploaded" | "approved" | "rejected" | "uploading";
  fileSize: string | null;
  fileName?: string;
  fileUrl?: string;
}

interface DocumentUploadProps {
  documents?: DocumentItem[];
  onDocumentStatusChange?: (documents: DocumentItem[]) => void;
}

export const DocumentUpload = ({ documents: propDocuments, onDocumentStatusChange }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<DocumentItem[]>(propDocuments || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();

  // Update local state when props change
  useEffect(() => {
    if (propDocuments) {
      setDocuments(propDocuments);
    }
  }, [propDocuments]);

  // Load document types from API only if no documents are provided as props
  useEffect(() => {
    // If documents are provided as props, don't load from API
    if (propDocuments && propDocuments.length > 0) {
      setIsLoading(false);
      return;
    }

    const loadDocumentTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const documentTypes = await listMasterDocumentTypes();
        
        // Filter only active documents and sort by order
        const activeDocuments = documentTypes
          .filter(doc => doc.active)
          .sort((a, b) => a.order - b.order)
          .map(doc => ({
            id: doc.id,
            name: doc.label,
            description: doc.description || '',
            required: doc.required,
            status: "pending" as const,
            fileSize: null
          }));
        
        setDocuments(activeDocuments);
      } catch (err: any) {
        console.error('Error loading document types:', err);
        setError('Failed to load document types. Please try again.');
        
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load document types. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDocumentTypes();
  }, [toast, propDocuments]);

  const handleSubmit = () => {
    navigate('/customer/quotes');
  };

  const handleFileSelect = (docId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(docId, file);
      }
    };
    input.click();
  };

  const handleFileUpload = async (docId: number, file: File) => {
    try {
      // Add to uploading set
      setUploadingDocs(prev => new Set(prev).add(docId));
      
      // Update document status to uploading
      const updatedDocuments = documents.map(doc => 
        doc.id === docId 
          ? { ...doc, status: "uploading" as const }
          : doc
      );
      setDocuments(updatedDocuments);
      
      // Upload file
      const uploadResponse = await uploadFile(file);
      
      if (uploadResponse.files && uploadResponse.files.length > 0) {
        const uploadedFile = uploadResponse.files[0];
        const fileSizeInMB = (uploadedFile.size_bytes / (1024 * 1024)).toFixed(1);
        
        // Update document with uploaded file info
        const finalDocuments = documents.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                status: "uploaded" as const,
                fileName: uploadedFile.original_name,
                fileUrl: uploadedFile.url,
                fileSize: `${fileSizeInMB} MB`
              }
            : doc
        );
        setDocuments(finalDocuments);
        
        // Notify parent component about status change
        if (onDocumentStatusChange) {
          onDocumentStatusChange(finalDocuments);
        }
        
        toast({
          title: "File Uploaded",
          description: `${uploadedFile.original_name} has been uploaded successfully.`,
          variant: "default",
        });
      } else {
        throw new Error('No file data returned from upload');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      
      // Revert to pending status on error
      const errorDocuments = documents.map(doc => 
        doc.id === docId 
          ? { ...doc, status: "pending" as const }
          : doc
      );
      setDocuments(errorDocuments);
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from uploading set
      setUploadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  const handleRemoveFile = (docId: number) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === docId 
        ? { 
            ...doc, 
            status: "pending" as const,
            fileName: undefined,
            fileUrl: undefined,
            fileSize: null
          }
        : doc
    );
    setDocuments(updatedDocuments);
    
    // Notify parent component about status change
    if (onDocumentStatusChange) {
      onDocumentStatusChange(updatedDocuments);
    }
    
    toast({
      title: "File Removed",
      description: "File has been removed successfully.",
      variant: "default",
    });
  };

  const uploadedDocs = documents.filter(doc => doc.status === "uploaded").length;
  const totalRequired = documents.filter(doc => doc.required).length;
  const allRequiredUploaded = documents.filter(doc => doc.required && doc.status === "uploaded").length === totalRequired;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "uploading":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, required: boolean) => {
    if (status === "uploaded") {
      return <Badge variant="outline" className="text-success border-success">Uploaded</Badge>;
    }
    if (status === "uploading") {
      return <Badge variant="outline" className="text-primary border-primary">Uploading...</Badge>;
    }
    if (status === "pending" && required) {
      return <Badge variant="outline" className="text-warning border-warning">Required</Badge>;
    }
    if (status === "pending" && !required) {
      return <Badge variant="outline" className="text-muted-foreground">Optional</Badge>;
    }
    return null;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-2 border-muted/30 bg-muted/5">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 lg:space-x-4 flex-1">
                    <div className="mt-1">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                        <div className="h-5 bg-muted rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-muted rounded w-48 animate-pulse mb-3"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 lg:space-x-2 ml-3 lg:ml-4">
                    <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Document List */}
      <div className="grid gap-4 lg:gap-6">
          {documents.map((doc) => (
            <Card 
              key={doc.id} 
              className={`transition-all duration-200 border-2 ${
                doc.status === "uploaded" 
                  ? 'border-success/30 bg-success/5 shadow-md' 
                  : doc.required 
                    ? 'border-primary/30 bg-primary/5 shadow-sm hover:shadow-md'
                    : 'border-border bg-card/50 hover:border-primary/20'
              }`}
            >
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 lg:space-x-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                        <h4 className="font-semibold text-sm lg:text-base text-foreground">{doc.name}</h4>
                        {getStatusBadge(doc.status, doc.required)}
                      </div>
                      <p className="text-xs lg:text-sm text-muted-foreground mb-3">
                        {doc.description}
                      </p>
                      {doc.fileName && (
                        <div className="flex items-center space-x-2 text-xs lg:text-sm mb-2">
                          <FileText className="w-3 h-3 text-primary" />
                          <span className="text-primary font-medium">{doc.fileName}</span>
                        </div>
                      )}
                      {doc.fileSize && (
                        <div className="flex items-center space-x-4 text-xs lg:text-sm">
                          <span className="text-muted-foreground">Size: {doc.fileSize}</span>
                          {doc.status === "uploaded" && (
                            <span className="text-success font-medium">Uploaded successfully</span>
                          )}
                          {doc.status === "uploading" && (
                            <span className="text-primary font-medium">Uploading...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 lg:space-x-2 ml-3 lg:ml-4">
                    {doc.status === "uploaded" ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
                          disabled={!doc.fileUrl}
                        >
                          <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
                          disabled={!doc.fileUrl}
                        >
                          <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFile(doc.id)}
                        >
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </Button>
                      </>
                    ) : doc.status === "uploading" ? (
                      <Button variant="outline" size="sm" disabled className="bg-primary/10 text-primary border-primary">
                        <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2 animate-spin" />
                        <span className="text-xs lg:text-sm">Uploading...</span>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                        onClick={() => handleFileSelect(doc.id)}
                        disabled={uploadingDocs.has(doc.id)}
                      >
                        <Upload className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        <span className="text-xs lg:text-sm">Upload</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
};