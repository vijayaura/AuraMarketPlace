import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { getActiveDocumentTypes } from "@/lib/masters-data";

// Get documents from masters data and add status fields
const getRequiredDocuments = () => {
  const masterDocuments = getActiveDocumentTypes();
  return masterDocuments.map(doc => ({
    id: doc.id,
    name: doc.label,
    description: doc.description,
    required: doc.required,
    status: "pending",
    fileSize: null
  }));
};

export const DocumentUpload = () => {
  const [documents, setDocuments] = useState(getRequiredDocuments());
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();

  const handleSubmit = () => {
    navigate('/customer/quotes');
  };

  const handleUpload = (docId: number) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, status: "uploaded", fileSize: "2.1 MB" }
        : doc
    ));
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

  return (
    <section className="py-8 lg:py-20 bg-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground mb-4">
            Upload Required Documents
          </h2>
        </div>

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


        {/* Action Button */}
        <div className="mt-8 lg:mt-12 text-center">
          <Button 
            variant="default" 
            size="lg"
            onClick={handleSubmit}
            disabled={!allRequiredUploaded}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 lg:px-8"
          >
            Get Quotes
          </Button>
        </div>
      </div>
    </section>
  );
};