import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Check, X, AlertCircle, Eye, Trash2 } from "lucide-react";

const Declaration = () => {
  const navigate = useNavigate();
  const [requiredDocuments, setRequiredDocuments] = useState([
    { 
      id: 1, 
      label: "KYC Document", 
      description: "Know Your Customer document", 
      required: true, 
      template: { name: "KYC_Template_v1.2.pdf", size: "156 KB" },
      uploadedFile: null,
      status: "pending" // pending, uploaded, approved, rejected
    },
    { 
      id: 2, 
      label: "Signed Proposal Form", 
      description: "Completed and signed proposal form", 
      required: true, 
      template: { name: "Proposal_Form_Template.pdf", size: "89 KB" },
      uploadedFile: { name: "Proposal_Form_Signed.pdf", size: "112 KB", uploadDate: "2024-01-22" },
      status: "uploaded"
    }
  ]);

  const handleDownloadTemplate = (templateName: string) => {
    // Simulate template download
    const link = document.createElement('a');
    link.href = '#'; // In real app, this would be the actual template URL
    link.download = templateName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, docId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const updatedDocs = requiredDocuments.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              uploadedFile: { 
                name: file.name, 
                size: `${Math.round(file.size / 1024)} KB`,
                uploadDate: new Date().toISOString().split('T')[0]
              },
              status: "uploaded"
            }
          : doc
      );
      setRequiredDocuments(updatedDocs);
    }
  };

  const removeUploadedFile = (docId: number) => {
    // This function is no longer used since X button is removed
    const updatedDocs = requiredDocuments.map(doc => 
      doc.id === docId 
        ? { ...doc, uploadedFile: null, status: "pending" }
        : doc
    );
    setRequiredDocuments(updatedDocs);
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'approved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Uploaded</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };


  return (
    <div className="w-full">
      <div className="text-left mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Upload Declaration Documents
        </h2>
        <p className="text-sm text-muted-foreground">
          Please upload documents needed for policy issuance
        </p>
      </div>

      {/* Document List */}
      <div className="grid gap-4 lg:gap-6">
        {requiredDocuments.map((doc) => (
          <Card 
            key={doc.id} 
            className={`transition-all duration-200 border-2 ${
              doc.uploadedFile 
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
                    {doc.uploadedFile ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                      <h4 className="font-semibold text-sm lg:text-base text-foreground">{doc.label}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="text-warning border-warning">Required</Badge>
                      )}
                      {doc.uploadedFile && (
                        <Badge variant="outline" className="text-success border-success">Uploaded</Badge>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-muted-foreground mb-3">
                      {doc.description}
                    </p>
                    {doc.uploadedFile && (
                      <div className="flex items-center space-x-4 text-xs lg:text-sm">
                        <span className="text-muted-foreground">Size: {doc.uploadedFile.size}</span>
                        <span className="text-success font-medium">Uploaded successfully</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 lg:space-x-2 ml-3 lg:ml-4">
                  {doc.template && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(doc.template.name)}
                      className="bg-white text-foreground border-border hover:bg-gray-50 mr-1 lg:mr-2"
                    >
                      <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      <span className="text-xs lg:text-sm">Download template</span>
                    </Button>
                  )}
                  
                  {doc.uploadedFile ? (
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                      onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                    >
                      <Upload className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                      <span className="text-xs lg:text-sm">Upload</span>
                    </Button>
                  )}

                  <input
                    type="file"
                    id={`file-${doc.id}`}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, doc.id)}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Declaration;