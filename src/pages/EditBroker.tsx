import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Building2, MapPin, Calendar, Upload, X, UserPlus, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { listMasterCountries, listMasterRegions, listMasterZones, type Country, type Region, type Zone } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getBroker, updateBroker, type UpdateBrokerRequest, activateBroker, deactivateBroker } from "@/lib/api";
import FormSkeleton from "@/components/loaders/FormSkeleton";

const editBrokerSchema = z.object({
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

type EditBrokerForm = z.infer<typeof editBrokerSchema>;

// Mock data - In real app, this would come from API
const mockBrokerData = {
  "B001": {
    id: "B001",
    name: "Ahmed Al-Mansoori",
    email: "ahmed.almansoori@brokers.ae",
    phone: "+971 50 123 4567",
    licenseNumber: "UAE-BRK-2023-001",
    validityStartDate: "2023-03-15",
    validityEndDate: "2025-03-15",
    countries: [1], // UAE
    regions: [1, 2], 
    zones: [1, 2, 3],
    adminUserEmail: "admin@almansoori.ae",
    adminUserPassword: "password123",
    status: "active",
    statusSince: "2024-01-15"
  },
  "B002": {
    id: "B002",
    name: "Sarah Johnson",
    email: "sarah.johnson@brokers.ae",
    phone: "+971 55 987 6543",
    licenseNumber: "UAE-BRK-2023-002",
    validityStartDate: "2023-06-20",
    validityEndDate: "2025-06-20",
    countries: [1], // UAE
    regions: [1, 3],
    zones: [1, 4, 5],
    adminUserEmail: "admin@johnsonrm.ae",
    adminUserPassword: "securepass456",
    status: "active",
    statusSince: "2024-02-10"
  },
  "B003": {
    id: "B003",
    name: "Mohammed Hassan",
    email: "mohammed.hassan@brokers.ae",
    phone: "+971 52 456 7890",
    licenseNumber: "UAE-BRK-2023-003",
    validityStartDate: "2023-09-10",
    validityEndDate: "2025-09-10",
    countries: [1], // UAE
    regions: [2, 3],
    zones: [2, 3, 6],
    adminUserEmail: "admin@hassaninsurance.ae",
    adminUserPassword: "hassan789",
    status: "inactive",
    statusSince: "2024-03-20"
  }
};

const EditBroker = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [mastersLoading, setMastersLoading] = useState<boolean>(true);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  const form = useForm<EditBrokerForm>({
    resolver: zodResolver(editBrokerSchema),
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

  // Load broker data from API
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

  useEffect(() => {
    const load = async () => {
      if (!id || mastersLoading || lastFetchedIdRef.current === id) return;
      lastFetchedIdRef.current = id;
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getBroker(id);
        // Normalized compare helper
        const norm = (s: string | null | undefined) => (s || '').toString().trim().toLowerCase();
        // Map labels to ids
        const preCountryIds = (data.operatingCountries || [])
          .map(label => countries.find(c => norm(c.label) === norm(label))?.id)
          .filter((v): v is number => typeof v === 'number');
        // Map regions/zones from API; accept both string labels and objects
        const preRegionIds = (data.operatingRegions || [])
          .map((rItem: any) => {
            const regionLabel = typeof rItem === 'string' ? rItem : rItem?.name;
            // If country is present, prefer matching region that belongs to that country label; otherwise fallback to label-only
            const countryLabel = typeof rItem === 'string' ? undefined : rItem?.country;
            if (!regionLabel) return undefined;
            // Prefer match with country, fallback to label-only
            let found = allRegions.find(reg => norm(reg.label) === norm(regionLabel) && (!countryLabel || norm(countries.find(c => c.id === reg.countryId)?.label) === norm(countryLabel)));
            if (!found) found = allRegions.find(reg => norm(reg.label) === norm(regionLabel));
            return found?.id;
          })
          .filter((v): v is number => typeof v === 'number');
        const preZoneIds = (data.operatingZones || [])
          .map((zItem: any) => {
            const zoneLabel = typeof zItem === 'string' ? zItem : zItem?.name;
            const regionLabel = typeof zItem === 'string' ? undefined : zItem?.region;
            if (!zoneLabel) return undefined;
            // Prefer match with region, fallback to label-only
            let found = allZones.find(zn => norm(zn.label) === norm(zoneLabel) && (!regionLabel || norm(allRegions.find(r => r.id === zn.regionId)?.label) === norm(regionLabel)));
            if (!found) found = allZones.find(zn => norm(zn.label) === norm(zoneLabel));
            return found?.id;
          })
          .filter((v): v is number => typeof v === 'number');

        // Initialize available lists based on selections
        let initRegions = allRegions.filter(r => preCountryIds.includes(r.countryId));
        if (initRegions.length === 0 && preRegionIds.length > 0) {
          initRegions = allRegions.filter(r => preRegionIds.includes(r.id));
        }
        let initZones = allZones.filter(z => preRegionIds.includes(z.regionId));
        if (initZones.length === 0 && preZoneIds.length > 0) {
          initZones = allZones.filter(z => preZoneIds.includes(z.id));
        }

        form.reset({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          licenseNumber: data.licenseNumber || "",
          validityStartDate: (data.licenseStartDate || "").slice(0, 10),
          validityEndDate: (data.licenseEndDate || "").slice(0, 10),
          countries: preCountryIds,
          regions: preRegionIds,
          zones: preZoneIds,
          adminUserEmail: "",
          adminUserPassword: "",
        });
        setIsActive((data.status || 'active') === 'active');
        setSelectedCountries(preCountryIds);
        setSelectedRegions(preRegionIds);
        setAvailableRegions(initRegions);
        setAvailableZones(initZones);
        setInitialLoaded(true);
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400 ? 'Invalid request while loading broker.' :
          status === 401 ? 'Session expired. Please log in again.' :
          status === 403 ? 'You are not authorized to view this broker.' :
          status === 500 ? 'Server error while fetching broker.' :
          err?.message || 'Failed to load broker.';
        setLoadError(friendly);
        toast({ title: 'Error', description: friendly });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, mastersLoading]);

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

  const handleToggleStatus = () => {
    const newStatus = !isActive;
    setPendingStatusChange(newStatus);
    setShowStatusDialog(true);
  };

  const [statusChanging, setStatusChanging] = useState(false);
  const confirmStatusChange = async () => {
    if (pendingStatusChange === null || !id) return;
    try {
      setStatusChanging(true);
      if (pendingStatusChange) {
        await activateBroker(id);
      } else {
        await deactivateBroker(id);
      }
      setIsActive(pendingStatusChange);
      toast({ title: 'Status Updated', description: `Broker has been ${pendingStatusChange ? 'activated' : 'deactivated'} successfully.` });
    } catch (err: any) {
      const s = err?.status;
      const friendly = s === 400 ? 'Invalid request' : s === 401 ? 'Session expired' : s === 403 ? 'Not authorized' : s === 500 ? 'Server error' : (err?.message || 'Status change failed');
      setLoadError(friendly);
      toast({ title: 'Error', description: friendly });
    } finally {
    setShowStatusDialog(false);
    setPendingStatusChange(null);
      setStatusChanging(false);
    }
  };

  const onSubmit = async (values: EditBrokerForm) => {
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

    setIsLoading(true);
    
    try {
      if (!id) throw new Error('Missing broker id');

      const countriesLabels = (selectedCountries || [])
        .map(cid => countries.find(c => c.id === cid)?.label)
        .filter((v): v is string => Boolean(v));

      const selectedRegionObjects = (selectedRegions || [])
        .map(rid => allRegions.find(r => r.id === rid))
        .filter((v): v is typeof allRegions[number] => Boolean(v))
        .map(r => ({ name: r.label, country: countries.find(c => c.id === r.countryId)?.label || '' }));

      const selectedZoneObjects = (form.getValues("zones") || [])
        .map((zid) => allZones.find(z => z.id === zid))
        .filter((v): v is typeof allZones[number] => Boolean(v))
        .map(z => {
          const region = allRegions.find(r => r.id === z.regionId);
          const countryLabel = region ? (countries.find(c => c.id === region.countryId)?.label || '') : '';
          return { name: z.label, region: region?.label || '', country: countryLabel };
        });

      const payload: UpdateBrokerRequest = {
        name: values.name,
        contact_email: values.email,
        phone: values.phone,
        license_number: values.licenseNumber,
        license_start_date: values.validityStartDate || null,
        license_end_date: values.validityEndDate || null,
        license_doc: licenseFile ? licenseFile.name : null,
        company_logo: logoFile ? logoFile.name : null,
        operating_countries: countriesLabels.length ? countriesLabels : null,
        operating_regions: selectedRegionObjects.length ? selectedRegionObjects : null,
        operating_zones: selectedZoneObjects.length ? selectedZoneObjects : null,
        admin_email: values.adminUserEmail,
        admin_password: values.adminUserPassword,
        join_date: values.validityStartDate || null, // backend example includes join_date; adjust if form collects
      };

      await updateBroker(id, payload);
      
      toast({
        title: "Broker Updated Successfully",
        description: `${values.name} details have been updated.`,
      });

      navigate("/market-admin/broker-management");
    } catch (err: any) {
      const status = err?.status;
      const msg = (err?.data?.message || err?.message || '').toString();
      const isAdminExists = msg.toLowerCase().includes('admin email already exists');
      const friendly = isAdminExists
        ? 'Admin email already exists'
        : status === 400 ? 'Validation failed. Please check the fields.'
        : status === 401 ? 'Session expired. Please log in again.'
        : status === 403 ? 'You are not authorized to update brokers.'
        : status === 500 ? 'Server error while updating broker.'
        : 'Failed to update broker.';
      toast({ title: isAdminExists ? 'Duplicate Admin Email' : 'Error', description: friendly, variant: isAdminExists ? 'destructive' : undefined });
      setLoadError(isAdminExists ? null : friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLicenseFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      
      setLicenseFile(file);
    }
  };

  const removeLicenseFile = () => {
    setLicenseFile(null);
    // Reset the file input
    const fileInput = document.getElementById('license-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleBack = () => {
    navigate("/market-admin/broker-management");
  };

  if (isLoading || !initialLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <FormSkeleton pairs={6} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Failed to load</h1>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <Button onClick={() => navigate("/market-admin/broker-management")}>Back to Broker Management</Button>
        </div>
      </div>
    );
  }

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Broker Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested broker could not be found.</p>
          <Button onClick={handleBack}>Back to Broker Management</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
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
                  Edit Broker Details
                </h1>
                <p className="text-muted-foreground">
                  Update broker information and settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
              <Label htmlFor="broker-status" className="text-sm font-medium">
                {isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="broker-status"
                checked={isActive}
                onCheckedChange={handleToggleStatus}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className={`transition-all duration-300 ${!isActive ? 'opacity-50 pointer-events-none' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Broker Information
                </CardTitle>
                <CardDescription>
                  Update the details for this insurance broker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Company Logo Upload */}
                    <div className="space-y-3">
                      <FormLabel>Company Logo</FormLabel>
                      <div className="space-y-3">
                        {!logoFile ? (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                              <div className="mt-4">
                                <label htmlFor="broker-logo-file" className="cursor-pointer">
                                  <span className="text-sm font-medium text-primary hover:text-primary/80">Upload company logo</span>
                                  <input id="broker-logo-file" type="file" className="sr-only" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (!file.type.startsWith('image/')) { toast({ title: 'Invalid File Type', description: 'Please upload an image file', variant: 'destructive' }); return; }
                                    if (file.size > 5 * 1024 * 1024) { toast({ title: 'File Too Large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' }); return; }
                                    setLogoFile(file);
                                  }} />
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
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => {
                              setLogoFile(null);
                              const fileInput = document.getElementById('broker-logo-file') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }} className="text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
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
                              <Input placeholder="contact@broker.com" type="email" {...field} />
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
                         Manage the admin user account for this broker
                       </p>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField
                           control={form.control}
                           name="adminUserEmail"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Admin User Email</FormLabel>
                               <FormControl>
                                 <Input placeholder="admin@broker.com" type="email" {...field} />
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
                                 <div className="relative">
                                   <Input 
                                     placeholder="Enter admin password" 
                                     type={showPassword ? "text" : "password"} 
                                     {...field} 
                                     className="pr-10"
                                   />
                                   <Button
                                     type="button"
                                     variant="ghost"
                                     size="sm"
                                     className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                     onClick={() => setShowPassword(!showPassword)}
                                   >
                                     {showPassword ? (
                                       <EyeOff className="h-4 w-4 text-muted-foreground" />
                                     ) : (
                                       <Eye className="h-4 w-4 text-muted-foreground" />
                                     )}
                                   </Button>
                                 </div>
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
                                      />
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      PNG, JPG, GIF up to 5MB
                                    </p>
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
                                    <p className="text-sm font-medium">{licenseFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(licenseFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
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
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Broker"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatusChange ? "Activate" : "Deactivate"} Broker
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingStatusChange ? "activate" : "deactivate"} this broker? 
              {!pendingStatusChange && " This will prevent them from accessing the platform and processing new quotes."}
              {pendingStatusChange && " This will restore their access to the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowStatusDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={statusChanging}>
              {statusChanging ? 'Updating...' : (pendingStatusChange ? 'Activate' : 'Deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditBroker;