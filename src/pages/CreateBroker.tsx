import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Building2, MapPin, Calendar, Upload, X, UserPlus } from "lucide-react";
import { listMasterCountries, listMasterRegions, listMasterZones, type Country, type Region, type Zone } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { createBroker, type CreateBrokerRequest } from "@/lib/api";
import { uploadFile } from "@/lib/api/quotes";
import FormSkeleton from "@/components/loaders/FormSkeleton";

const createBrokerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  validityStartDate: z.string().min(1, "Validity start date is required"),
  validityEndDate: z.string().min(1, "Validity end date is required"),
  countries: z.array(z.number()).min(1, "At least one country must be selected"),
  regions: z.array(z.number()).min(1, "At least one region must be selected"),
  zones: z.array(z.number()).min(1, "At least one zone must be selected"),
  adminUserEmail: z.string().email("Invalid admin email address"),
  adminUserPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type CreateBrokerForm = z.infer<typeof createBrokerSchema>;

const CreateBroker = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [mastersLoading, setMastersLoading] = useState<boolean>(true);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseFileUrl, setLicenseFileUrl] = useState<string | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileUrl, setLogoFileUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      setMastersLoading(true);
      setMastersError(null);
      try {
        const [c, r, z] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
        ]);
        if (!mounted) return;
        setCountries(c);
        setAllRegions(r);
        setAllZones(z);
      } catch (err: any) {
        if (!mounted) return;
        const status = err?.status;
        const friendly =
          status === 400 ? 'Invalid request while loading masters.' :
          status === 401 ? 'Session expired. Please log in again.' :
          status === 403 ? 'You are not authorized to load masters.' :
          status === 500 ? 'Server error while fetching masters.' :
          err?.message || 'Failed to load masters.';
        setMastersError(friendly);
      } finally {
        if (mounted) setMastersLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const form = useForm<CreateBrokerForm>({
    resolver: zodResolver(createBrokerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      validityStartDate: "",
      validityEndDate: "",
      countries: [],
      regions: [],
      zones: [],
      adminUserEmail: "",
      adminUserPassword: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update available regions when countries change
  const handleCountryChange = (countryIds: number[]) => {
    setSelectedCountries(countryIds);
    const regions = allRegions.filter(r => countryIds.includes(r.countryId));
    setAvailableRegions(regions);
    // Reset regions and zones if no countries selected
    if (countryIds.length === 0) {
      form.setValue("regions", []);
      form.setValue("zones", []);
      setSelectedRegions([]);
      setAvailableZones([]);
    }
  };

  const handleRegionChange = (regionIds: number[]) => {
    setSelectedRegions(regionIds);
    const zones = allZones.filter(z => regionIds.includes(z.regionId));
    setAvailableZones(zones);
    form.setValue("regions", regionIds);
    // Reset zones if no regions selected
    if (regionIds.length === 0) {
      form.setValue("zones", []);
    }
  };

  const onSubmit = async (values: CreateBrokerForm) => {
    // Validate end date is after start date
    const startDate = new Date(values.validityStartDate);
    const endDate = new Date(values.validityEndDate);
    
    if (endDate <= startDate) {
      toast({
        title: "Invalid Dates",
        description: "Validity end date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const countriesLabels = selectedCountries
        .map(id => countries.find(c => c.id === id)?.label)
        .filter((v): v is string => Boolean(v));

      const selectedRegionObjects = selectedRegions
        .map((id) => allRegions.find(r => r.id === id))
        .filter((v): v is typeof allRegions[number] => Boolean(v))
        .map(r => ({ name: r.label, country: countries.find(c => c.id === r.countryId)?.label || "" }));

      const selectedZoneObjects = (form.getValues("zones") || [])
        .map((id) => allZones.find(z => z.id === id))
        .filter((v): v is typeof allZones[number] => Boolean(v))
        .map(z => {
          const region = allRegions.find(r => r.id === z.regionId);
          const countryLabel = region ? (countries.find(c => c.id === region.countryId)?.label || "") : "";
          return { name: z.label, region: region?.label || "", country: countryLabel };
        });
 
      const payload: CreateBrokerRequest = {
        name: values.name,
        contact_email: values.email,
        phone: values.phone,
        license_number: values.licenseNumber,
        license_start_date: values.validityStartDate || null,
        license_end_date: values.validityEndDate || null,
        license_doc: licenseFileUrl || null,
        company_logo: logoFileUrl || null,
        operating_countries: countriesLabels.length ? countriesLabels : null,
        operating_regions: selectedRegionObjects.length ? selectedRegionObjects : null,
        operating_zones: selectedZoneObjects.length ? selectedZoneObjects : null,
        admin_email: values.adminUserEmail,
        admin_password: values.adminUserPassword,
        join_date: new Date().toISOString().slice(0,10),
      };
      const res = await createBroker(payload);
      toast({ title: 'Success', description: res.message || 'Broker created successfully' });
      navigate("/market-admin/broker-management");
    } catch (err: any) {
      const status = err?.status;
      const msg = (err?.data?.message || err?.message || '').toString();
      const isAdminExists = msg.toLowerCase().includes('admin email already exists');
      const friendly = isAdminExists
        ? 'Admin email already exists'
        : status === 400 ? 'Validation failed. Please check the fields.'
        : status === 401 ? 'Session expired. Please log in again.'
        : status === 403 ? 'You are not authorized to create brokers.'
        : status === 500 ? 'Server error while creating broker.'
        : 'Failed to create broker.';
      toast({ title: isAdminExists ? 'Duplicate Admin Email' : 'Error', description: friendly, variant: isAdminExists ? 'destructive' : undefined });
      setErrorMessage(isAdminExists ? null : friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLicenseFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLicense(true);

    try {
      // Upload file using the API
      const uploadResponse = await uploadFile(file);
      
      if (uploadResponse.files && uploadResponse.files.length > 0) {
        const uploadedFile = uploadResponse.files[0];
        setLicenseFile(file);
        setLicenseFileUrl(uploadedFile.url);

        toast({
          title: "License Document Uploaded Successfully",
          description: `File "${uploadedFile.original_name}" has been uploaded successfully.`,
        });
      } else {
        throw new Error('No file data returned from upload');
      }
    } catch (error: any) {
      console.error('License upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload license document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const removeLicenseFile = () => {
    setLicenseFile(null);
    setLicenseFileUrl(null);
    // Reset the file input
    const fileInput = document.getElementById('license-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File Type', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Upload file using the API
      const uploadResponse = await uploadFile(file);
      
      if (uploadResponse.files && uploadResponse.files.length > 0) {
        const uploadedFile = uploadResponse.files[0];
        
        // Update state with both file and URL
        setLogoFile(file);
        setLogoFileUrl(uploadedFile.url);

        toast({
          title: "Logo Uploaded Successfully",
          description: `${uploadedFile.original_name} has been uploaded successfully.`,
        });
      } else {
        throw new Error('No file data returned from upload');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setLogoFileUrl(null);
    const fileInput = document.getElementById('logo-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleBack = () => {
    navigate("/market-admin/broker-management");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
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
                Create New Broker
              </h1>
              <p className="text-muted-foreground">
                Add a new insurance broker to your platform
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Broker Information
              </CardTitle>
              <CardDescription>
                Provide the basic details for the new insurance broker
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mastersError && (
                <div className="mb-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{mastersError}</div>
              )}
              {mastersLoading ? (
                <FormSkeleton pairs={6} />
              ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {errorMessage && (
                    <div className="mb-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{errorMessage}</div>
                  )}
                  {/* Basic Information Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Broker Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Gulf Insurance Brokers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@broker.com" type="email" autoComplete="off" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+971-4-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                   />

                   {/* Admin User Credentials Section */}
                   <div className="pt-6 border-t">
                     <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                       <UserPlus className="w-5 h-5" />
                       Admin User Credentials
                     </h3>
                     <p className="text-sm text-muted-foreground mb-6">
                       Set up the initial admin user account for this broker
                     </p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FormField
                         control={form.control}
                         name="adminUserEmail"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Admin User Email</FormLabel>
                             <FormControl>
                               <Input placeholder="admin@broker.com" type="email" autoComplete="off" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={form.control}
                         name="adminUserPassword"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Admin User Password</FormLabel>
                             <FormControl>
                               <Input placeholder="Enter admin password" type="password" autoComplete="off" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                   </div>

                   {/* License Information Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      License Information
                    </h3>
                    
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., BRK-2024-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="validityStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Validity Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="validityEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Validity End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* License Image Upload */}
                      <div className="space-y-3">
                        <FormLabel>License Document Image</FormLabel>
                        <div className="space-y-3">
                          {!licenseFile ? (
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                              <div className="text-center">
                                {isUploadingLicense ? (
                                  <>
                                    <div className="mx-auto h-12 w-12 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                    <div className="mt-4">
                                      <span className="text-sm font-medium text-muted-foreground">
                                        Uploading...
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <div className="mt-4">
                                      <label htmlFor="license-file" className="cursor-pointer">
                                        <span className="text-sm font-medium text-primary hover:text-primary/80">
                                          Upload license image
                                        </span>
                                        <input
                                          id="license-file"
                                          type="file"
                                          className="sr-only"
                                          accept="image/*"
                                          onChange={handleLicenseFileChange}
                                          disabled={isUploadingLicense}
                                        />
                                      </label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG, GIF up to 5MB
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded">
                                  <Upload className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{licenseFile.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(licenseFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                  {licenseFileUrl && (
                                    <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeLicenseFile}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Logo Upload */}
                  <div className="space-y-3">
                    <FormLabel>Company Logo</FormLabel>
                    <div className="space-y-3">
                      {!logoFile ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <div className="mt-4">
                              <label htmlFor="logo-file" className="cursor-pointer">
                                <span className="text-sm font-medium text-primary hover:text-primary/80">
                                  {isUploadingLogo ? "Uploading..." : "Upload company logo"}
                                </span>
                                <input 
                                  id="logo-file" 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/*" 
                                  onChange={handleLogoFileChange}
                                  disabled={isUploadingLogo}
                                />
                              </label>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                              <Upload className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{logoFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              {logoFileUrl && (
                                <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                              )}
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={removeLogoFile} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Geographic Coverage Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Geographic Coverage
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="countries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operating Countries</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                              {countries.map((country) => (
                                <div key={country.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`country-${country.id}`}
                                    checked={field.value?.includes(country.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      if (checked) {
                                        const newValue = [...currentValue, country.id];
                                        field.onChange(newValue);
                                        handleCountryChange(newValue);
                                      } else {
                                        const newValue = currentValue.filter((id) => id !== country.id);
                                        field.onChange(newValue);
                                        handleCountryChange(newValue);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`country-${country.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {country.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {availableRegions.length > 0 && (
                      <FormField
                        control={form.control}
                        name="regions"
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel>Operating Regions</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                                {availableRegions.map((region) => {
                                  const country = countries.find(c => c.id === region.countryId);
                                  return (
                                    <div key={region.id} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={`region-${region.id}`}
                                        checked={(field.value as number[])?.includes(region.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = (field.value as number[]) || [];
                                          let newValue: number[];
                                          if (checked) {
                                            newValue = [...currentValue, region.id];
                                          } else {
                                            newValue = currentValue.filter((id) => id !== region.id);
                                          }
                                          field.onChange(newValue);
                                          handleRegionChange(newValue);
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex flex-col">
                                        <label
                                          htmlFor={`region-${region.id}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          {region.label}
                                        </label>
                                        <span className="text-xs text-muted-foreground mt-1">
                                          {country?.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {availableZones.length > 0 && (
                      <FormField
                        control={form.control}
                        name="zones"
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel>Operating Zones</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                                {availableZones.map((zone) => {
                                  const region = availableRegions.find(r => r.id === zone.regionId);
                                  return (
                                    <div key={zone.id} className="flex items-start space-x-2">
                                      <Checkbox
                                        id={`zone-${zone.id}`}
                                        checked={(field.value as number[])?.includes(zone.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = (field.value as number[]) || [];
                                          if (checked) {
                                            field.onChange([...currentValue, zone.id]);
                                          } else {
                                            field.onChange(currentValue.filter((id) => id !== zone.id));
                                          }
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex flex-col">
                                        <label
                                          htmlFor={`zone-${zone.id}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          {zone.label}
                                        </label>
                                        <span className="text-xs text-muted-foreground mt-1">
                                          {region?.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Broker'}</Button>
                  </div>
                </form>
              </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateBroker;