import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import InsurerForm, { InsurerFormData } from "@/components/InsurerForm";
import { createInsurer, type CreateInsurerRequest, listMasterCountries, listMasterRegions, listMasterZones } from "@/lib/api";
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { useToast } from "@/hooks/use-toast";

const CreateInsurer = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  // Removed product configuration flow after creation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (values: InsurerFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Convert logo file to base64 if present
      let logoBase64 = null;
      if (logoFile) {
        try {
          logoBase64 = await convertFileToBase64(logoFile);
        } catch (error) {
          console.error('Error converting logo to base64:', error);
          toast({
            title: 'Logo Upload Error',
            description: 'Failed to process logo file. Please try again.',
            variant: 'destructive'
          });
          return;
        }
      }

      // Load master lists to map selected ids to labels (ensures consistency with InsurerForm)
      const [masterCountries, masterRegions, masterZones] = await Promise.all([
        listMasterCountries(),
        listMasterRegions(),
        listMasterZones(),
      ]);

      const selectedCountryLabels = (values.countries || [])
        .map((id) => masterCountries.find(c => c.id === id)?.label)
        .filter((v): v is string => Boolean(v));

      const selectedRegionLabels = (values.regions || [])
        .map((id) => masterRegions.find(r => r.id === id))
        .filter((v): v is typeof masterRegions[number] => Boolean(v))
        .map(r => ({ name: r.label, country: masterCountries.find(c => c.id === r.countryId)?.label || "" }));

      const selectedZoneLabels = (values.zones || [])
        .map((id) => masterZones.find(z => z.id === id))
        .filter((v): v is typeof masterZones[number] => Boolean(v))
        .map(z => {
          const region = masterRegions.find(r => r.id === z.regionId);
          const countryLabel = region ? (masterCountries.find(c => c.id === region.countryId)?.label || "") : "";
          return { name: z.label, region: region?.label || "", country: countryLabel };
        });

      const payload: CreateInsurerRequest = {
        name: values.name,
        license_number: values.licenseNumber,
        contact_email: values.email,
        phone: values.phone,
        address: values.address,
        // website removed
        company_logo: logoBase64,
        operating_countries: selectedCountryLabels.length ? selectedCountryLabels : null,
        operating_regions: selectedRegionLabels.length ? selectedRegionLabels : null,
        operating_zones: selectedZoneLabels.length ? selectedZoneLabels : null,
        admin_email: values.adminUserEmail,
        admin_password: values.adminUserPassword,
      };

      const res = await createInsurer(payload);
      toast({ title: 'Success', description: res.message || 'Insurer created successfully' });
      navigate('/market-admin/insurer-management');
    } catch (err: any) {
      const status = err?.status;
      const msg = (err?.data?.message || err?.message || '').toString();
      const isAdminExists = msg.toLowerCase().includes('admin email already exists');
      const friendly = isAdminExists
        ? 'Admin email already exists'
        : status === 400 ? 'Validation failed. Please check the fields.'
        : status === 401 ? 'Session expired. Please log in again.'
        : status === 403 ? 'You are not authorized to create insurers.'
        : status === 500 ? 'Server error while creating insurer.'
        : 'Failed to create insurer.';
      // Show toast but do not route to failure page
      toast({ title: isAdminExists ? 'Duplicate Admin Email' : 'Error', description: friendly, variant: isAdminExists ? 'destructive' : undefined });
      setErrorMessage(isAdminExists ? null : friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ Logo file change event triggered');
    const file = event.target.files?.[0];
    console.log('📁 Selected file:', file);
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        console.log('❌ Invalid file type:', file.type);
        toast({ title: 'Invalid File Type', description: 'Please upload an image file', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', file.size);
        toast({ title: 'File Too Large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
        return;
      }
      console.log('✅ Logo file accepted:', file.name, file.size, 'bytes');
      setLogoFile(file);
      toast({ title: 'Logo Uploaded', description: `${file.name} has been selected successfully` });
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    const fileInput = document.getElementById('insurer-logo-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleBack = () => {
    navigate('/market-admin/insurer-management');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Create New Insurer
              </h1>
              <p className="text-muted-foreground">
                Add a new insurance partner to your platform
              </p>
            </div>
          </div>

          {/* Form */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{errorMessage}</div>
          )}

          {/* Company Logo Upload */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Logo</CardTitle>
                <CardDescription>Upload a logo image for the insurer (optional).</CardDescription>
              </CardHeader>
              <CardContent>
                {!logoFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input 
                      id="insurer-logo-file" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*" 
                      onChange={handleLogoFileChange} 
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Upload Company Logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('insurer-logo-file')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{logoFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeLogoFile} className="text-muted-foreground hover:text-destructive">Remove</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <InsurerForm
            mode="create"
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateInsurer;