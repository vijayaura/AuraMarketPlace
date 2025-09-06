import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Check, X, Navigation, Map, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationResult {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface OpenStreetMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: string, address: string) => void;
  currentAddress?: string;
  currentCoordinates?: string;
}

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

export const OpenStreetMapDialog: React.FC<OpenStreetMapDialogProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentAddress,
  currentCoordinates,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with current address and coordinates if available
  useEffect(() => {
    if (isOpen) {
      // Set search query to current address
      if (currentAddress) {
        setSearchQuery(currentAddress);
        // Auto-search for the current address
        searchLocations(currentAddress);
      }
      
      // Set map center if coordinates are available
      if (currentCoordinates) {
        const [lat, lng] = currentCoordinates.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter({ lat, lng });
          setShowMap(true);
        }
      }
    }
  }, [isOpen]); // Remove currentAddress and currentCoordinates from dependencies to avoid infinite loops

  // Search locations using OpenStreetMap Nominatim API
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1&namedetails=1&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const results: LocationResult[] = data.map((item: any, index: number) => ({
        id: `${item.place_id || index}`,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'location',
        importance: item.importance || 0,
        address: item.address || {}
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocations(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    setMapCenter({ lat: location.lat, lng: location.lon });
    setShowMap(true);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      const coordinates = `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lon.toFixed(6)}`;
      onLocationSelect(coordinates, selectedLocation.display_name);
      onClose();
      
      toast({
        title: "Location confirmed",
        description: "Coordinates have been updated.",
      });
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Reverse geocoding to get address
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    )
      .then(response => response.json())
      .then(data => {
        const location: LocationResult = {
          id: `manual_${Date.now()}`,
          display_name: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat: lat,
          lon: lng,
          type: 'manual',
          importance: 0,
          address: data.address || {}
        };
        setSelectedLocation(location);
      })
      .catch(error => {
        console.error('Reverse geocoding error:', error);
        const location: LocationResult = {
          id: `manual_${Date.now()}`,
          display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat: lat,
          lon: lng,
          type: 'manual',
          importance: 0
        };
        setSelectedLocation(location);
      });
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'house':
      case 'building':
        return 'bg-blue-100 text-blue-800';
      case 'road':
      case 'street':
        return 'bg-green-100 text-green-800';
      case 'city':
      case 'town':
        return 'bg-purple-100 text-purple-800';
      case 'country':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (location: LocationResult) => {
    const addr = location.address;
    if (!addr) return location.display_name;

    const parts = [];
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.road) parts.push(addr.road);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);
    
    return parts.length > 0 ? parts.join(', ') : location.display_name;
  };

  const handleClose = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowMap(false);
    setMapCenter(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            OpenStreetMap Location Search
          </DialogTitle>
          <DialogDescription>
            Search for locations worldwide using OpenStreetMap data. Click on the map or search by name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
          {/* Search Panel */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="locationSearch">Search Location</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="locationSearch"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type address, city, landmark..."
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Search powered by OpenStreetMap Nominatim
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Search Results</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((result) => (
                    <Card 
                      key={result.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm line-clamp-2">
                              {formatAddress(result)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getLocationTypeColor(result.type)}`}
                              >
                                {result.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                              </span>
                            </div>
                            {result.importance > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Importance: {(result.importance * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Location */}
            {selectedLocation && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">Selected Location</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatAddress(selectedLocation)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={confirmLocation} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-1" />
                        Use This Location
                      </Button>
                      <Button 
                        onClick={() => setSelectedLocation(null)} 
                        variant="outline" 
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map Toggle */}
            <div className="pt-4 border-t">
              <Button
                onClick={() => setShowMap(!showMap)}
                variant="outline"
                className="w-full"
              >
                <Map className="w-4 h-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            </div>
          </div>

          {/* Map Panel */}
          {showMap && (
            <div className="flex-1 min-h-[300px] lg:min-h-full">
              <div className="h-full border rounded-lg overflow-hidden">
                <MapContainer
                  center={mapCenter || [25.2048, 55.2708]} // Default to Dubai
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={20}
                  />
                  
                  {/* Search result markers */}
                  {searchResults.map((result) => (
                    <Marker
                      key={result.id}
                      position={[result.lat, result.lon]}
                      eventHandlers={{
                        click: () => handleLocationSelect(result),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-medium text-sm">{formatAddress(result)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.lat.toFixed(6)}, {result.lon.toFixed(6)}
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleLocationSelect(result)}
                          >
                            Select This Location
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  
                  {/* Selected location marker */}
                  {selectedLocation && (
                    <Marker
                      position={[selectedLocation.lat, selectedLocation.lon]}
                      icon={L.icon({
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        shadowSize: [41, 41]
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-medium text-sm text-green-600">Selected Location</div>
                          <div className="text-sm">{formatAddress(selectedLocation)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Map click handler */}
                  <MapClickHandler onMapClick={handleMapClick} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
