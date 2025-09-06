import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";
import InsurerForm, { InsurerFormData } from "@/components/InsurerForm";
import { toast } from "sonner";
import { listMasterCountries, listMasterRegions, listMasterZones, type Country, type Region, type Zone } from "@/lib/api";
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { getInsurer, updateInsurer, type UpdateInsurerRequest, activateInsurer, deactivateInsurer } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for demonstration - in a real app, this would come from an API or database
const mockInsurerData = {
  "emirates-insurance": {
    id: "emirates-insurance",
    name: "Emirates Insurance",
    licenseNumber: "EI-2024-001",
    email: "contact@emiratesinsurance.ae",
    phone: "+971-4-123-4567",
    address: "Sheikh Zayed Road, Dubai, UAE",
    website: "https://www.emiratesinsurance.ae",
    countries: [1], // UAE
    regions: [1, 2], // Dubai, Abu Dhabi
    zones: [1, 2, 3], // Dubai zones
    adminUserEmail: "admin@emiratesinsurance.ae",
    adminUserPassword: "admin123",
    status: "active"
  },
  "axa-gulf": {
    id: "axa-gulf",
    name: "AXA Gulf",
    licenseNumber: "AXA-2024-002",
    email: "dubai@axa-gulf.com",
    phone: "+971-4-987-6543",
    address: "Business Bay, Dubai, UAE",
    website: "https://www.axa-gulf.com",
    countries: [1],
    regions: [1],
    zones: [1, 2],
    adminUserEmail: "admin@axa-gulf.com",
    adminUserPassword: "admin123",
    status: "active"
  },
  "oman-insurance": {
    id: "oman-insurance",
    name: "Oman Insurance",
    licenseNumber: "OI-2024-003",
    email: "info@omaninsurance.com",
    phone: "+971-4-555-7890",
    address: "DIFC, Dubai, UAE",
    website: "https://www.omaninsurance.com",
    countries: [1],
    regions: [1, 2],
    zones: [1, 2, 3, 4],
    adminUserEmail: "admin@omaninsurance.com",
    adminUserPassword: "admin123",
    status: "active"
  },
  "dubai-insurance": {
    id: "dubai-insurance",
    name: "Dubai Insurance",
    licenseNumber: "DI-2024-004",
    email: "support@dubaiinsurance.ae",
    phone: "+971-4-333-1122",
    address: "Downtown Dubai, UAE",
    website: "https://www.dubaiinsurance.ae",
    countries: [1],
    regions: [1],
    zones: [1],
    adminUserEmail: "admin@dubaiinsurance.ae",
    adminUserPassword: "admin123",
    status: "inactive"
  }
};

const EditInsurer = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const { insurerId } = useParams<{ insurerId: string }>();
  console.log('🔍 EditInsurer received insurerId:', insurerId, 'Type:', typeof insurerId);
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insurerData, setInsurerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [masterCountries, setMasterCountries] = useState<Country[]>([]);
  const [masterRegions, setMasterRegions] = useState<Region[]>([]);
  const [masterZones, setMasterZones] = useState<Zone[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Prefer navigation state if present
        if (location.state?.insurerData) {
          setInsurerData(location.state.insurerData);
          setIsActive(location.state.insurerData.status === "active");
          return;
        }
        if (insurerId) {
          const [c, r, z, data] = await Promise.all([
            listMasterCountries(),
            listMasterRegions(),
            listMasterZones(),
            getInsurer(insurerId),
          ]);
          setMasterCountries(c);
          setMasterRegions(r);
          setMasterZones(z);
          // Use mapped Insurer shape returned by API module
          const apiCountries = data.operatingCountries || [];
          const apiRegions = data.operatingRegions || [];
          const apiZones = data.operatingZones || [];

          // Resolve ids from labels
          const countryIds = apiCountries
            .map(label => c.find(cn => cn.label === label)?.id)
            .filter((v): v is number => typeof v === 'number');

          const regionIds = apiRegions
            .map(regObj => r.find(reg => reg.label === regObj.name && (c.find(cn => cn.id === reg.countryId)?.label === regObj.country))?.id)
            .filter((v): v is number => typeof v === 'number');

          const zoneIds = apiZones
            .map(znObj => z.find(zn => zn.label === znObj.name && (r.find(reg => reg.id === zn.regionId)?.label === znObj.region))?.id)
            .filter((v): v is number => typeof v === 'number');

          const mapped = {
            id: data.id,
            name: data.name,
            licenseNumber: data.licenseNumber || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            // website removed
            countries: countryIds,
            regions: regionIds,
            zones: zoneIds,
            adminUserEmail: data.adminEmail || "",
            adminUserPassword: data.adminPassword || "",
            status: data.status,
          };
          setInsurerData(mapped);
          setIsActive(data.status === "active");
          // Also set available regions/zones given the selections
          if (countryIds.length) {
            const selRegions = countryIds.flatMap(cid => r.filter(reg => reg.countryId === cid));
            setAvailableRegions(selRegions);
          }
          if (regionIds.length) {
            const selZones = regionIds.flatMap(rid => z.filter(zn => zn.regionId === rid));
            setAvailableZones(selZones);
          }

        }
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400 ? 'Invalid request while loading insurer.' :
          status === 401 ? 'Session expired. Please log in again.' :
          status === 403 ? 'You are not authorized to view this insurer.' :
          status === 500 ? 'Server error while fetching insurer.' :
          err?.message || 'Failed to load insurer.';
        setErrorMessage(friendly);
        toast.error(friendly);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [insurerId, location.state]);

  const handleSubmit = async (formData: InsurerFormData) => {
    setIsSubmitting(true);

    try {
      if (!insurerId) throw new Error('Missing insurer id');
      // Map selected ids to labels/objects per API shape
      const selectedCountryLabels = (formData.countries || [])
        .map((id) => masterCountries.find(c => c.id === id)?.label)
        .filter((v): v is string => Boolean(v));
      const selectedRegionObjects = (formData.regions || [])
        .map((id) => masterRegions.find(r => r.id === id))
        .filter((v): v is typeof masterRegions[number] => Boolean(v))
        .map(r => ({ name: r.label, country: masterCountries.find(c => c.id === r.countryId)?.label || "" }));
      const selectedZoneObjects = (formData.zones || [])
        .map((id) => masterZones.find(z => z.id === id))
        .filter((v): v is typeof masterZones[number] => Boolean(v))
        .map(z => {
          const region = masterRegions.find(r => r.id === z.regionId);
          const countryLabel = region ? (masterCountries.find(c => c.id === region.countryId)?.label || "") : "";
          return { name: z.label, region: region?.label || "", country: countryLabel };
        });

      const payload: UpdateInsurerRequest = {
        name: formData.name,
        license_number: formData.licenseNumber,
        contact_email: formData.email,
        phone: formData.phone,
        address: formData.address,
        // website removed
        company_logo: logoFile ? logoFile.name : null,
        operating_countries: selectedCountryLabels.length ? selectedCountryLabels : null,
        operating_regions: selectedRegionObjects.length ? selectedRegionObjects : null,
        operating_zones: selectedZoneObjects.length ? selectedZoneObjects : null,
        admin_email: formData.adminUserEmail,
        admin_password: formData.adminUserPassword,
      };

      await updateInsurer(insurerId, payload);
      toast.success("Insurer details updated successfully!");
      navigate('/market-admin/insurer-management');
    } catch (error: any) {
      const status = error?.status;
      const msg = (error?.data?.message || error?.message || '').toString();
      const isAdminExists = msg.toLowerCase().includes('admin email already exists');
      const friendly = isAdminExists
        ? 'Admin email already exists'
        : status === 400 ? 'Validation failed. Please check the fields.'
        : status === 401 ? 'Session expired. Please log in again.'
        : status === 403 ? 'You are not authorized to update insurers.'
        : status === 500 ? 'Server error while updating insurer.'
        : 'Failed to update insurer details.';
      toast.error(friendly);
      setErrorMessage(isAdminExists ? null : friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/market-admin/insurer-management');
  };

  const handleToggleStatus = () => {
    const newStatus = !isActive;
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const [statusChanging, setStatusChanging] = useState(false);
  const confirmStatusChange = async () => {
    if (pendingStatus === null || !insurerId) return;
    try {
      setStatusChanging(true);
      if (pendingStatus) {
        await activateInsurer(insurerId);
      } else {
        await deactivateInsurer(insurerId);
      }
      setIsActive(pendingStatus);
      toast.success(`Insurer ${pendingStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err: any) {
      const s = err?.status;
      const friendly = s === 400 ? 'Invalid request' : s === 401 ? 'Session expired' : s === 403 ? 'Not authorized' : s === 500 ? 'Server error' : (err?.message || 'Status change failed');
      setErrorMessage(friendly);
      toast.error(friendly);
    } finally {
      setShowConfirmDialog(false);
      setPendingStatus(null);
      setStatusChanging(false);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
        <div className="flex-1 p-6">
          <div className="w-full max-w-7xl mx-auto">
            <FormSkeleton pairs={6} />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
        <div className="flex-1 p-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Failed to load</h1>
                <p className="text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!insurerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
        <div className="flex-1 p-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Insurer Not Found</h1>
                <p className="text-muted-foreground">
                  The requested insurer could not be found.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Edit Insurer
                </h1>
                <p className="text-muted-foreground">
                  Update details for {insurerData.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
              <Label htmlFor="insurer-status" className="text-sm font-medium">
                {isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="insurer-status"
                checked={isActive}
                onCheckedChange={handleToggleStatus}
              />
            </div>
          </div>

          {/* Form */}
          <div className={`transition-all duration-300 ${!isActive ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Company Logo Upload */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Company Logo</CardTitle>
                <CardDescription>Upload a logo image for the insurer (optional).</CardDescription>
              </CardHeader>
              <CardContent>
                {!logoFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <label htmlFor="edit-insurer-logo-file" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:text-primary/80">Upload logo image</span>
                      <input id="edit-insurer-logo-file" type="file" className="sr-only" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
                        if (file.size > 5 * 1024 * 1024) { toast.error('Please upload an image smaller than 5MB'); return; }
                        setLogoFile(file);
                      }} />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{logoFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      setLogoFile(null);
                      const fileInput = document.getElementById('edit-insurer-logo-file') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }} className="text-muted-foreground hover:text-destructive">Remove</Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <InsurerForm
              mode="edit"
              initialData={insurerData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus ? 'Activate' : 'Deactivate'} Insurer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingStatus ? 'activate' : 'deactivate'} {insurerData?.name}?
              {!pendingStatus && ' This will disable all their access and services.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={statusChanging}>
              {statusChanging ? 'Updating...' : (pendingStatus ? 'Activate' : 'Deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditInsurer;
