import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Save } from "lucide-react";
import type { InsurerMetadata } from "@/lib/api/insurers";

export type QuoteConfiguratorProps = {
  isLoadingQuoteConfig: boolean;
  isSavingQuoteConfig: boolean;
  onSave: () => Promise<void> | void;
  quoteConfig: any;
  updateQuoteConfig: (section: string, field: string, value: any) => void;
  isLoadingMetadata: boolean;
  insurerMetadata?: InsurerMetadata | null;
  metadataError?: string | null;
  quoteConfigError?: string | null;
  getAvailableRegions: () => Array<{ name: string; country: string }>;
  getAvailableZones: () => Array<{ name: string; region: string; country: string }>;
};

const QuoteConfigurator: React.FC<QuoteConfiguratorProps> = ({
  isLoadingQuoteConfig,
  isSavingQuoteConfig,
  onSave,
  quoteConfig,
  updateQuoteConfig,
  isLoadingMetadata,
  insurerMetadata,
  metadataError,
  quoteConfigError,
  getAvailableRegions,
  getAvailableZones,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quote Coverage Configuration</CardTitle>
            <CardDescription>Configure quotation coverage, validity, and operating regions</CardDescription>
          </div>
          <Button
            type="button"
            onClick={onSave}
            size="sm"
            disabled={isSavingQuoteConfig}
         >
            {isSavingQuoteConfig ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Quote Coverage
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingQuoteConfig ? (
          <div className="space-y-6">
            {/* Form Fields Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-36"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Geographic Coverage Skeleton */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
              </div>

              {/* Countries Section Skeleton */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regions Section Skeleton */}
              <div className="space-y-4 mt-6">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zones Section Skeleton */}
              <div className="space-y-4 mt-6">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validity-days">Validity Period (Days)</Label>
                <Input
                  id="validity-days"
                  name="validity_days"
                  type="number"
                  autoComplete="off"
                  value={quoteConfig.details.validityDays}
                  onChange={(e) => updateQuoteConfig('details', 'validityDays', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backdate-window">Backdate Window (Days)</Label>
                <Input
                  id="backdate-window"
                  name="backdate_days"
                  type="number"
                  autoComplete="off"
                  value={quoteConfig.details.backdateWindow}
                  onChange={(e) => updateQuoteConfig('details', 'backdateWindow', e.target.value)}
                />
              </div>
            </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geographic Coverage
          </h3>

          {metadataError && (
            <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2 mb-4">
              {metadataError}
            </div>
          )}
          {quoteConfigError && (
            <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2 mb-4">
              {quoteConfigError}
            </div>
          )}

          {!isLoadingMetadata && !isLoadingQuoteConfig && insurerMetadata && quoteConfig.details.countries && quoteConfig.details.countries.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-600">
                <span className="font-medium">Selected:</span> {quoteConfig.details.countries.length} country(ies)
                {quoteConfig.details.regions && quoteConfig.details.regions.length > 0 && (
                  <span>, {quoteConfig.details.regions.length} region(s)</span>
                )}
                {quoteConfig.details.zones && quoteConfig.details.zones.length > 0 && (
                  <span>, {quoteConfig.details.zones.length} zone(s)</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {isLoadingMetadata && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}

            {!isLoadingMetadata && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Operating Countries</Label>
                {insurerMetadata ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                    {insurerMetadata.operating_countries.map((countryName) => (
                      <div key={countryName} className="flex items-center space-x-2">
                        <Checkbox
                          id={`country-${countryName}`}
                          checked={quoteConfig.details.countries?.includes(countryName)}
                          onCheckedChange={(checked) => {
                            const currentValue = quoteConfig.details.countries || [];
                            if (checked) {
                              const newValue = [...currentValue, countryName];
                              updateQuoteConfig('details', 'countries', newValue);
                              updateQuoteConfig('details', 'regions', []);
                              updateQuoteConfig('details', 'zones', []);
                            } else {
                              const newValue = currentValue.filter((name) => name !== countryName);
                              updateQuoteConfig('details', 'countries', newValue);
                              updateQuoteConfig('details', 'regions', []);
                              updateQuoteConfig('details', 'zones', []);
                            }
                          }}
                          disabled={isLoadingQuoteConfig}
                        />
                        <label
                          htmlFor={`country-${countryName}`}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            isLoadingQuoteConfig ? 'opacity-50' : ''
                          }`}
                        >
                          {countryName}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                    No countries data available
                  </div>
                )}
              </div>
            )}

            {!isLoadingMetadata && insurerMetadata && quoteConfig.details.countries && quoteConfig.details.countries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Operating Regions</Label>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>•</span>
                    <span>Available for selected countries</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto bg-muted/20">
                  {getAvailableRegions().map((region, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Checkbox
                        id={`region-${index}`}
                        checked={quoteConfig.details.regions?.includes(region.name)}
                        onCheckedChange={(checked) => {
                          const currentValue = quoteConfig.details.regions || [];
                          let newValue: string[];
                          if (checked) {
                            newValue = [...currentValue, region.name];
                            updateQuoteConfig('details', 'regions', newValue);
                            updateQuoteConfig('details', 'zones', []);
                          } else {
                            newValue = currentValue.filter((name) => name !== region.name);
                            updateQuoteConfig('details', 'regions', newValue);
                            updateQuoteConfig('details', 'zones', []);
                          }
                        }}
                        className="mt-1"
                        disabled={isLoadingQuoteConfig}
                      />
                      <div className="flex flex-col">
                        <label
                          htmlFor={`region-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {region.name}
                        </label>
                        <span className="text-xs text-muted-foreground mt-1">
                          {region.country}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getAvailableRegions().length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground p-2 text-center">
                      No regions available for selected countries
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isLoadingMetadata && insurerMetadata && quoteConfig.details.regions && quoteConfig.details.regions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Operating Zones</Label>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>•</span>
                    <span>Available for selected regions</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto bg-muted/20">
                  {getAvailableZones().map((zone, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Checkbox
                        id={`zone-${index}`}
                        checked={quoteConfig.details.zones?.includes(zone.name)}
                        onCheckedChange={(checked) => {
                          const currentValue = quoteConfig.details.zones || [];
                          if (checked) {
                            updateQuoteConfig('details', 'zones', [...currentValue, zone.name]);
                          } else {
                            updateQuoteConfig('details', 'zones', currentValue.filter((name) => name !== zone.name));
                          }
                        }}
                        className="mt-1"
                        disabled={isLoadingQuoteConfig}
                      />
                      <div className="flex flex-col">
                        <label
                          htmlFor={`zone-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {zone.name}
                        </label>
                        <span className="text-xs text-muted-foreground mt-1">
                          {zone.region}, {zone.country}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getAvailableZones().length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground p-2 text-center">
                      No zones available for selected regions
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuoteConfigurator;
