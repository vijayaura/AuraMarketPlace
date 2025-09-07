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
import { useToast } from "@/hooks/use-toast";

interface DocumentItem {
  id: number;
  name: string;
  description: string;
  required: boolean;
  status: "pending" | "uploaded" | "approved" | "rejected";
  fileSize: string | null;
}

interface DocumentUploadProps {
  documents?: DocumentItem[];
  onDocumentStatusChange?: (documents: DocumentItem[]) => void;
}

export const DocumentUpload = ({ documents: propDocuments, onDocumentStatusChange }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<DocumentItem[]>(propDocuments || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();

  // Update local state when props change
  useEffect(() => {
    if (propDocuments) {
      setDocuments(propDocuments);
    }
  }, [propDocuments]);

  // Load document types from API
  useEffect(() => {
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
  }, [toast]);

  const handleSubmit = () => {
    navigate('/customer/quotes');
  };

  const handleUpload = (docId: number) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === docId 
        ? { ...doc, status: "uploaded", fileSize: "2.1 MB" }
        : doc
    );
    setDocuments(updatedDocuments);
    
    // Notify parent component about status change
    if (onDocumentStatusChange) {
      onDocumentStatusChange(updatedDocuments);
    }
  };

  const uploadedDocs = documents.filter(doc => doc.status === "uploaded").length;
  const totalRequired = documents.filter(doc => doc.required).length;
  const allRequiredUploaded = documents.filter(doc => doc.required && doc.status === "uploaded").length === totalRequired;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <CheckCircle className="w-5 h-5 text-success" />;
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
                      {doc.fileSize && (
                        <div className="flex items-center space-x-4 text-xs lg:text-sm">
                          <span className="text-muted-foreground">Size: {doc.fileSize}</span>
                          <span className="text-success font-medium">Uploaded successfully</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 lg:space-x-2 ml-3 lg:ml-4">
                    {doc.status === "uploaded" ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                        onClick={() => handleUpload(doc.id)}
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