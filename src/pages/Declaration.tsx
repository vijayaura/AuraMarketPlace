import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Upload, Check, X, AlertCircle, Eye, Trash2, RefreshCw } from "lucide-react";
import { getRequiredDocuments, RequiredDocument, uploadFile, createDocumentSubmission, updateDocumentSubmission, DocumentSubmissionRequest } from "@/lib/api/quotes";
import { ApiError } from "@/lib/api/client";
import DocumentSkeleton from "@/components/loaders/DocumentSkeleton";
import { toast } from "@/components/ui/sonner";

interface DocumentWithUpload extends RequiredDocument {
  uploadedFile?: {
    name: string;
    size: string;
    uploadDate: string;
    url: string;
  };
  status: 'pending' | 'uploading' | 'uploaded' | 'approved' | 'rejected';
}

interface DeclarationProps {
  onSubmissionStateChange?: (isSubmitting: boolean) => void;
}

export interface DeclarationRef {
  handleSubmitDocuments: () => Promise<boolean>;
}

const Declaration = forwardRef<DeclarationRef, DeclarationProps>(({ onSubmissionStateChange }, ref) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentWithUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expose handleSubmitDocuments function to parent component
  useImperativeHandle(ref, () => ({
    handleSubmitDocuments
  }), []);

  // Get insurer and product IDs from localStorage or URL params
  const getInsurerAndProductIds = () => {
    // Try to get from localStorage first
    const storedInsurerId = localStorage.getItem('selected_insurer_id');
    const storedProductId = localStorage.getItem('selected_product_id');
    
    if (storedInsurerId && storedProductId) {
      return {
        insurerId: parseInt(storedInsurerId),
        productId: parseInt(storedProductId)
      };
    }

    // Fallback to URL params or default values
    const urlParams = new URLSearchParams(window.location.search);
    const insurerId = parseInt(urlParams.get('insurerId') || '1');
    const productId = parseInt(urlParams.get('productId') || '1');
    
    return { insurerId, productId };
  };

  const fetchRequiredDocuments = async (showRetry = false) => {
    try {
      if (showRetry) {
        setRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { insurerId, productId } = getInsurerAndProductIds();
      
      console.log('📋 Fetching required documents for insurer:', insurerId, 'product:', productId);
      
      const response = await getRequiredDocuments(insurerId, productId);
      
      // Filter only ACTIVE documents (exclude INACTIVE, DRAFT, etc.) and transform API response to component format
      const activeDocuments = response.documents.filter(doc => doc.status === 'ACTIVE');
      const inactiveCount = response.documents.length - activeDocuments.length;
      
      console.log(`📋 Filtered documents: ${activeDocuments.length} active, ${inactiveCount} inactive`);
      
      const transformedDocs: DocumentWithUpload[] = activeDocuments.map(doc => ({
        ...doc,
        uploadedFile: undefined,
        status: 'pending' as const
      }));

      setDocuments(transformedDocs);
      console.log('✅ Required documents loaded:', transformedDocs);
      
    } catch (err) {
      console.error('❌ Error fetching required documents:', err);
      
      let errorMessage = 'Failed to load required documents. Please try again.';
      
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your parameters and try again.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to view these documents.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      
      if (!showRetry) {
        toast.error('Failed to Load Documents', {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchRequiredDocuments();
  }, []);

  const handleDownloadTemplate = (templateFile: string, displayLabel: string) => {
    if (!templateFile) {
      toast.error('Template Not Available', {
        description: 'Template file is not available for this document.'
      });
      return;
    }

    try {
      // Determine if template_file is a full URL or just a filename
      let templateUrl: string;
      
      if (templateFile.startsWith('http://') || templateFile.startsWith('https://')) {
        // It's already a full URL
        templateUrl = templateFile;
      } else {
        // It's a filename, construct the full URL
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        templateUrl = `${baseUrl}/templates/${templateFile}`;
      }
      
      console.log('📥 Downloading template:', templateUrl);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = templateUrl;
      link.download = templateFile.includes('/') ? templateFile.split('/').pop() || templateFile : templateFile;
      link.target = '_blank'; // Open in new tab as fallback
      link.rel = 'noopener noreferrer'; // Security best practice
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Optional: Add a small delay to ensure the download starts
      setTimeout(() => {
        console.log('✅ Template download initiated for:', displayLabel);
      }, 100);
      
      toast.success('Template Downloaded', {
        description: `${displayLabel} template has been downloaded.`
      });
    } catch (error) {
      console.error('❌ Error downloading template:', error);
      toast.error('Download Failed', {
        description: 'Failed to download template. Please try again.'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      
      // Upload file using the API
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
                uploadedFile: {
                  name: uploadedFile.original_name,
                  size: `${fileSizeInMB} MB`,
                  uploadDate: new Date().toISOString().split('T')[0],
                  url: uploadedFile.url
                }
              }
            : doc
        );
        setDocuments(finalDocuments);
        
        toast.success('File Uploaded', {
          description: `${uploadedFile.original_name} has been uploaded successfully.`
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
      
      toast.error('Upload Failed', {
        description: error.message || "Failed to upload file. Please try again."
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

  const removeUploadedFile = (docId: number) => {
    const updatedDocs = documents.map(doc => 
      doc.id === docId 
        ? { ...doc, uploadedFile: undefined, status: "pending" as const }
        : doc
    );
    setDocuments(updatedDocs);
    
    toast.success('File Removed', {
      description: 'Uploaded file has been removed.'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'approved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
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
      case 'uploading':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Uploading...</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleRetry = () => {
    fetchRequiredDocuments(true);
  };

  // Validate that all required documents are uploaded
  const validateRequiredDocuments = (): boolean => {
    const requiredDocs = documents.filter(doc => doc.is_required === 1);
    const uploadedDocs = requiredDocs.filter(doc => doc.uploadedFile && doc.status === 'uploaded');
    
    if (uploadedDocs.length !== requiredDocs.length) {
      const missingDocs = requiredDocs.filter(doc => !doc.uploadedFile || doc.status !== 'uploaded');
      const missingLabels = missingDocs.map(doc => doc.display_label).join(', ');
      
      toast.error('Missing Required Documents', {
        description: `Please upload the following required documents: ${missingLabels}`
      });
      return false;
    }
    
    return true;
  };

  // Build document submission payload
  const buildDocumentSubmissionPayload = () => {
    const { productId } = getInsurerAndProductIds();
    
    const payload: any = {
      product_id: productId
    };
    
    documents.forEach(doc => {
      if (doc.uploadedFile && doc.status === 'uploaded') {
        // Create a key from the document label (lowercase, replace spaces with underscores)
        const key = doc.display_label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        payload[key] = {
          label: doc.display_label,
          url: doc.uploadedFile.url || '' // This should be the actual file URL from upload response
        };
      }
    });
    
    return payload;
  };

  // Handle document submission - called by parent component's Next button
  const handleSubmitDocuments = async (): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      onSubmissionStateChange?.(true);
      
      // Validate required documents
      if (!validateRequiredDocuments()) {
        return false;
      }
      
      // Get quote ID from storage
      const storedQuoteId = localStorage.getItem('currentQuoteId');
      if (!storedQuoteId) {
        throw new Error('Quote ID not found in storage. Please refresh the page and try again.');
      }
      
      // Check if documents have been submitted before
      const policyRequiredDocuments = localStorage.getItem('policy_required_documents') === 'true';
      
      // Build submission payload
      const payload = buildDocumentSubmissionPayload();
      
      console.log('📤 Submitting documents:', { quoteId: storedQuoteId, isUpdate: policyRequiredDocuments, payload });
      
      // Call appropriate API based on whether documents were submitted before
      let response;
      if (policyRequiredDocuments) {
        // Update existing - use PATCH
        console.log('📤 Updating existing document submission...');
        response = await updateDocumentSubmission(parseInt(storedQuoteId), payload);
      } else {
        // First time - use POST
        console.log('📤 Creating new document submission...');
        response = await createDocumentSubmission(parseInt(storedQuoteId), payload);
      }
      
      console.log('✅ Document submission response:', response);
      
      // Update storage flag
      localStorage.setItem('policy_required_documents', 'true');
      
      // Show success message
      toast.success('Documents Submitted Successfully', {
        description: 'All required documents have been submitted successfully.'
      });
      
      console.log('✅ Document submission completed successfully');
      return true;
      
    } catch (err) {
      console.error('❌ Error submitting documents:', err);
      
      let errorMessage = 'Failed to submit documents. Please try again.';
      
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid document data. Please check your uploads and try again.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to submit documents.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      }
      
      toast.error('Submission Failed', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsSubmitting(false);
      onSubmissionStateChange?.(false);
    }
  };

  // Expose the submission function and state to parent component
  // The submission function is available via the handleSubmitDocuments function

  // Notify parent about submission state changes
  useEffect(() => {
    if (onSubmissionStateChange) {
      onSubmissionStateChange(isSubmitting);
    }
  }, [isSubmitting, onSubmissionStateChange]);

  // Show loading skeleton
  if (loading) {
    return <DocumentSkeleton />;
  }

  // Show error state
  if (error) {
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

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
              className="ml-4"
            >
              {retrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        {documents.map((doc) => (
          <Card 
            key={doc.id} 
            className={`transition-all duration-200 border-2 ${
              doc.uploadedFile 
                ? 'border-success/30 bg-success/5 shadow-md' 
                : doc.is_required 
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
                      <h4 className="font-semibold text-sm lg:text-base text-foreground">{doc.display_label}</h4>
                      {doc.is_required === 1 && (
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
                  {doc.template_file && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(doc.template_file!, doc.display_label)}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeUploadedFile(doc.id)}
                      >
                        <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                      </Button>
                    </>
                  ) : doc.status === 'uploading' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="bg-blue-100 text-blue-800 border-blue-200"
                    >
                      <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2 animate-spin" />
                      <span className="text-xs lg:text-sm">Uploading...</span>
                    </Button>
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
});

Declaration.displayName = 'Declaration';

export default Declaration;