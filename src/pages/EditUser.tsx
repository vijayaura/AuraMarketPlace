import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateUser, type UpdateUserRequestBody, type UpdateUserResponseBody, activateUser, deactivateUser } from "@/lib/api/users";
import { getUserById, type GetUserByIdResponseBody } from "@/lib/api/users";
import { FormSkeleton } from "@/components/loaders/FormSkeleton";

export default function EditUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    isAdmin: false,
    status: "Active",
    createdDate: "",
    activeSince: "",
    inactiveSince: "",
    lastLogin: ""
  });

  const [loading, setLoading] = useState<boolean>(true);
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data: GetUserByIdResponseBody = await getUserById(userId || '');
        if (!isMounted) return;
        setUserData(prev => ({
          ...prev,
          id: String(data.id),
          name: data.name || prev.name || '',
          email: data.email,
          password: '********',
          isAdmin: data.user_type === 'admin',
          status: data.status === 'active' ? 'Active' : data.status === 'inactive' ? 'Inactive' : 'Active',
        }));
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setErrorMessage(message || 'Bad request.');
        else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
        else if (status === 403) setErrorMessage("You don't have permission to view this user.");
        else if (status && status >= 500) setErrorMessage('Server error. Please try again later.');
        else setErrorMessage(message || 'Failed to load user.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
        <div className="max-w-4xl mx-auto">
          <FormSkeleton pairs={6} />
        </div>
      </div>
    );
  }

  const handleSave = () => {
    showConfirmDialog(
      {
        title: "Confirm Changes",
        description: `Are you sure you want to save the changes to ${userData.name}'s account? This action will update their information immediately.`,
        confirmText: "Save Changes"
      },
      async () => {
        try {
          setSubmitting(true);
          setErrorMessage(null);
          const payload: UpdateUserRequestBody = {
            name: userData.name || undefined,
            email: userData.email || undefined,
            password: userData.password && userData.password !== '********' ? userData.password : undefined,
            user_type: userData.isAdmin ? 'admin' : 'user',
          };
          const response: UpdateUserResponseBody = await updateUser(userId || userData.id, payload);
          toast({ title: response.message || 'User updated' });
          navigate("/broker/user-management");
        } catch (err: any) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400) setErrorMessage(message || 'Invalid data. Check inputs and try again.');
          else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
          else if (status === 403) setErrorMessage("You don't have permission to update users.");
          else if (status && status >= 500) setErrorMessage('Server error. Please try again later.');
          else setErrorMessage(message || 'Failed to update user.');
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? "Active" : "Inactive";
    setPendingStatus(newStatus);
    
    showConfirmDialog(
      {
        title: `${newStatus === "Active" ? "Activate" : "Deactivate"} User`,
        description: `Are you sure you want to ${newStatus === "Active" ? "activate" : "deactivate"} ${userData.name}?${newStatus === "Inactive" ? " This will disable their access to the system." : ""}`,
        confirmText: newStatus === "Active" ? "Activate" : "Deactivate",
        variant: newStatus === "Inactive" ? "destructive" : "default"
      },
      async () => {
        try {
          setSubmitting(true);
          setErrorMessage(null);
          if (newStatus === 'Active') {
            await activateUser(userId || userData.id);
          } else {
            await deactivateUser(userId || userData.id);
          }
          setUserData(prev => ({ ...prev, status: newStatus }));
          toast({ title: 'User status updated', description: `${userData.name} has been ${newStatus.toLowerCase()}.` });
        } catch (err: any) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400) setErrorMessage(message || 'Invalid request.');
          else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
          else if (status === 403) setErrorMessage("You don't have permission to change status.");
          else if (status && status >= 500) setErrorMessage('Server error. Please try again later.');
          else setErrorMessage(message || 'Failed to update status.');
        } finally {
          setSubmitting(false);
          setPendingStatus(null);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/broker/user-management")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
              <p className="text-muted-foreground">Modify user account details</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
            <Label htmlFor="userStatus" className="text-sm font-medium">
              {userData.status === "Active" ? "Active" : "Inactive"}
            </Label>
            <Switch
              id="userStatus"
              checked={userData.status === "Active"}
              onCheckedChange={handleStatusChange}
            />
          </div>
        </div>

        {/* Edit User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Details
            </CardTitle>
            <CardDescription>
              Update the user information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className={`space-y-6 transition-all duration-300 ${userData.status === "Inactive" ? 'opacity-50 pointer-events-none' : ''}`}>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Failed to update user</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  placeholder="Enter full name"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={userData.email}
                  onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">Password</Label>
              <div className="relative">
                <Input
                  id="userPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (leave blank to keep current)"
                  value={userData.password}
                  onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="userRole">User Type</Label>
              <Select 
                value={userData.isAdmin ? "admin" : "user"} 
                onValueChange={(value) => setUserData(prev => ({ ...prev, isAdmin: value === "admin" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button 
                variant="outline" 
                onClick={() => navigate("/broker/user-management")}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={submitting}>
                <Save className="w-4 h-4" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog />
      </div>
    </div>
  );
}