import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Users, Eye } from "lucide-react";
import { TableSearchFilter, FilterConfig } from "@/components/TableSearchFilter";
import { useTableSearch } from "@/hooks/useTableSearch";
import { listInsurers, type Insurer } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Data loaded from API

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-success border-success/20">Active</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-destructive border-destructive/20">Inactive</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const MarketAdminInsurerManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await listInsurers();
        if (isMounted) setInsurers(data);
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400 ? 'Invalid request while loading insurers.' :
          status === 401 ? 'Session expired. Please log in again.' :
          status === 403 ? 'You are not authorized to view insurers.' :
          status === 500 ? 'Server error while fetching insurers.' :
          err?.message || 'Failed to load insurers.';
        if (isMounted) setErrorMessage(friendly);
        toast({ title: 'Error', description: friendly });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Configure filters for insurers
  const insurerFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
  ];

  // Use table search hook
  const {
    searchTerm,
    setSearchTerm,
    filters,
    filteredData: filteredInsurers,
    updateFilter,
    clearFilters
  } = useTableSearch({
    data: insurers,
    searchableFields: ['name', 'email', 'phone', 'licenseNumber'],
    initialFilters: {}
  });

  // Pagination calculations based on filteredInsurers
  const totalPages = Math.ceil(filteredInsurers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInsurers = filteredInsurers.slice(startIndex, endIndex);


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Insurer Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage insurance companies and their product configurations
              </p>
            </div>
            <Button 
              className="gap-2"
              onClick={() => navigate('/market-admin/create-insurer')}
            >
              <Plus className="w-4 h-4" />
              Create Insurer
            </Button>
          </div>


          {/* Insurers List */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Partners</CardTitle>
              <CardDescription>Manage your insurance partners and their configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <TableSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={insurerFilters}
                activeFilters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
              />
              {errorMessage && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {errorMessage}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insurer</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Admin Mail</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton rowCount={5} colCount={6} />
                  ) : filteredInsurers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="py-8 text-center text-muted-foreground">No insurers found.</div>
                      </TableCell>
                    </TableRow>
                  ) : currentInsurers.map((insurer) => (
                    <TableRow key={insurer.id} className={`hover:bg-muted/50 ${insurer.status === 'inactive' ? 'opacity-50 text-muted-foreground' : ''}`}>
                      <TableCell>
                        <div className="font-medium">{insurer.name}</div>
                      </TableCell>
                      <TableCell>{insurer.licenseNumber || '—'}</TableCell>
                      <TableCell>{insurer.adminEmail || '—'}</TableCell>
                      <TableCell>{insurer.phone || '—'}</TableCell>
                       <TableCell>
                         {getStatusBadge(insurer.status)}
                       </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end">
                           <Button 
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               console.log('🔍 Clicking edit for insurer:', insurer);
                               console.log('🔍 Insurer ID:', insurer.id, 'Type:', typeof insurer.id);
                               navigate(`/market-admin/insurer/${insurer.id}/edit`);
                             }}
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             Edit Details
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {!isLoading && filteredInsurers.length > 0 && (
                <div className="px-6 py-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminInsurerManagement;