import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, Trash2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock user data with enhanced fields
const mockUsers = [
  {
    id: "U001",
    name: "John Smith",
    email: "john.smith@broker.com",
    role: "Senior Broker",
    isAdmin: false,
    status: "Active",
    lastLogin: "2024-01-15 14:30",
    createdDate: "2023-06-15",
    activeSince: "2023-06-15",
    inactiveSince: null
  },
  {
    id: "U002",
    name: "Sarah Johnson",
    email: "sarah.johnson@broker.com",
    role: "Junior Broker",
    isAdmin: false,
    status: "Active",
    lastLogin: "2024-01-14 16:45",
    createdDate: "2023-08-22",
    activeSince: "2023-08-22",
    inactiveSince: null
  },
  {
    id: "U003",
    name: "Mike Wilson",
    email: "mike.wilson@broker.com",
    role: "Broker Manager",
    isAdmin: true,
    status: "Inactive",
    lastLogin: "2024-01-10 09:15",
    createdDate: "2023-03-10",
    activeSince: null,
    inactiveSince: "2024-01-08"
  },
  {
    id: "U004",
    name: "Emily Davis",
    email: "emily.davis@broker.com",
    role: "Senior Broker",
    isAdmin: false,
    status: "Active",
    lastLogin: "2024-01-15 11:20",
    createdDate: "2023-09-05",
    activeSince: "2023-09-05",
    inactiveSince: null
  },
  {
    id: "U005",
    name: "Robert Brown",
    email: "robert.brown@broker.com",
    role: "Junior Broker",
    isAdmin: false,
    status: "Pending",
    lastLogin: "Never",
    createdDate: "2024-01-12",
    activeSince: null,
    inactiveSince: null
  }
];

export default function BrokerUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState(mockUsers);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
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
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.isAdmin).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === "Active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.status === "Inactive").length}
              </div>
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
                        <TableHead>User</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Active/Inactive Since</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={user.isAdmin ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-blue-100 text-blue-800 border-blue-200"}>
                              {user.isAdmin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.createdDate}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.activeSince || user.inactiveSince || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.lastLogin}
                          </TableCell>
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