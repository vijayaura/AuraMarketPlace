import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Building2, MapPin, UserPlus, Eye, EyeOff } from "lucide-react";
import { listMasterCountries, listMasterRegions, listMasterZones, type Country, type Region, type Zone } from "@/lib/api";
import FormSkeleton from "@/components/loaders/FormSkeleton";

const insurerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  countries: z.array(z.number()).min(1, "At least one country must be selected"),
  regions: z.array(z.number()).min(1, "At least one region must be selected"),
  zones: z.array(z.number()).min(1, "At least one zone must be selected"),
  adminUserEmail: z.string().email("Invalid admin email address"),
  adminUserPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsurerFormData = z.infer<typeof insurerSchema>;

interface InsurerFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<InsurerFormData & { id?: string; status?: string }>;
  onSubmit: (data: InsurerFormData) => void;
  isSubmitting?: boolean;
}

const InsurerForm = ({ mode, initialData, onSubmit, isSubmitting = false }: InsurerFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<number[]>(initialData?.countries || []);
  const [selectedRegions, setSelectedRegions] = useState<number[]>(initialData?.regions || []);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [isMastersLoading, setIsMastersLoading] = useState<boolean>(true);
  const [mastersError, setMastersError] = useState<string | null>(null);

  const form = useForm<InsurerFormData>({
    resolver: zodResolver(insurerSchema),
    defaultValues: {
      name: initialData?.name || "",
      licenseNumber: initialData?.licenseNumber || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      countries: initialData?.countries || [],
      regions: initialData?.regions || [],
      zones: initialData?.zones || [],
      adminUserEmail: initialData?.adminUserEmail || "",
      adminUserPassword: initialData?.adminUserPassword || "",
    },
  });

  // Load masters and initialize available lists
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsMastersLoading(true);
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
        if (initialData?.countries && initialData.countries.length > 0) {
          const regions = r.filter(reg => initialData.countries!.includes(reg.countryId));
          setAvailableRegions(regions);
          if (initialData?.regions && initialData.regions.length > 0) {
            const zones = z.filter(zn => initialData.regions!.includes(zn.regionId));
            setAvailableZones(zones);
          }
        }
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
        if (mounted) setIsMastersLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [initialData]);

  // Update available regions when countries change
  const handleCountryChange = (countryIds: number[]) => {
    setSelectedCountries(countryIds);
    const regions = allRegions.filter(r => countryIds.includes(r.countryId));
    setAvailableRegions(regions);
    // Reset regions if no countries selected
    if (countryIds.length === 0) {
      form.setValue("regions", []);
      form.setValue("zones", []);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Insurer Information
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Provide the basic details for the new insurance partner'
            : 'Update the details for this insurance partner'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mastersError && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{mastersError}</div>
        )}
        {isMastersLoading ? (
          <FormSkeleton pairs={6} />
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Emirates Insurance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EI-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@insurer.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sheikh Zayed Road, Dubai, UAE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Website field removed as per requirements */}

            {/* Admin User Credentials Section */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Admin User Credentials
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {mode === 'create' 
                  ? 'Set up the initial admin user account for this insurer'
                  : 'Update the admin user credentials for this insurer'
                }
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="adminUserEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin User Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@insurer.com" type="email" {...field} />
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
                            const country = countries.find(c => c.id === region?.countryId);
                            return (
                              <div key={zone.id} className="flex items-start space-x-2">
                                <Checkbox
                                  id={`zone-${zone.id}`}
                                  checked={(field.value as number[])?.includes(zone.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = (field.value as number[]) || [];
                                    let newValue: number[];
                                    if (checked) {
                                      newValue = [...currentValue, zone.id];
                                    } else {
                                      newValue = currentValue.filter((id) => id !== zone.id);
                                    }
                                    field.onChange(newValue);
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
                                    {region?.label}, {country?.label}
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {mode === 'create' ? 'Create Insurer' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default InsurerForm;