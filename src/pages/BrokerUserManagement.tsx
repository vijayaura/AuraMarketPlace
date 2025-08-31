import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, Trash2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { getBrokerUsers, type PortalUserListItem } from "@/lib/api/users";
import { getBrokerCompanyId } from "@/lib/auth";

type UiUser = {
  id: number;
  name?: string;
  email: string;
  role: string;
  userType: "admin" | "user" | string;
  status: string;
  createdAt: string;
};

export default function BrokerUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UiUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const companyId = getBrokerCompanyId();
        if (!companyId) throw new Error('Missing broker company id');
        const apiUsers = await getBrokerUsers(companyId);
        if (!isMounted) return;
        const mapped: UiUser[] = apiUsers.map((u: PortalUserListItem) => ({
          id: u.id,
          name: (u as any).name,
          email: u.email,
          role: u.role,
          userType: u.user_type,
          status: u.status,
          createdAt: u.created_at,
        }));
        setUsers(mapped);
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setErrorMessage(message || "Bad request. Please adjust filters and try again.");
        else if (status === 401) setErrorMessage("You are not authenticated. Please log in.");
        else if (status === 403) setErrorMessage("You don't have permission to view users.");
        else if (status && status >= 500) setErrorMessage("Server error. Please try again later.");
        else setErrorMessage(message || "Failed to load users.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.name?.toLowerCase().includes(q) ?? false) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q) ||
      user.userType.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Broker Manager":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Senior Broker":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Junior Broker":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage broker portal users and permissions</p>
          </div>
          <Button 
            className="gap-2"
            onClick={() => navigate("/broker/add-user")}
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load users</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.userType === 'admin').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'inactive').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage your broker portal users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && <TableSkeleton rowCount={5} colCount={5} />}
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.name || user.email?.split('@')[0] || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={user.userType === 'admin' ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-blue-100 text-blue-800 border-blue-200"}>
                              {user.userType === 'admin' ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/broker/edit-user/${user.id}`)}
                            >
                              Edit Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}