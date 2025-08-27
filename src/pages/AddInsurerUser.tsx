import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createUser, type CreateUserRequestBody, type CreateUserResponseBody } from "@/lib/api/users";

export default function AddInsurerUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    isAdmin: false,
    status: "Active"
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const payload: CreateUserRequestBody = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        user_type: newUser.isAdmin ? 'admin' : 'user',
      };
      const response: CreateUserResponseBody = await createUser(payload);
      toast({
        title: response.message || 'User created',
        description: `${newUser.email} has been added as ${response.user_type}.`,
      });
      navigate("/insurer/user-management");
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) setErrorMessage(message || 'Invalid data. Check inputs and try again.');
      else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
      else if (status === 403) setErrorMessage("You don't have permission to create users.");
      else if (status && status >= 500) setErrorMessage('Server error. Please try again later.');
      else setErrorMessage(message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/insurer/user-management")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New User</h1>
            <p className="text-muted-foreground">Create a new insurer user account</p>
          </div>
        </div>

        {/* Add User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              User Details
            </CardTitle>
            <CardDescription>
              Enter the user information to create a new account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Failed to create user</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">Password *</Label>
              <Input
                id="userPassword"
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userRole">User Type</Label>
              <Select 
                value={newUser.isAdmin ? "admin" : "user"} 
                onValueChange={(value) => setNewUser(prev => ({ ...prev, isAdmin: value === "admin" }))}
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
                onClick={() => navigate("/insurer/user-management")}
              >
                Cancel
              </Button>
              <Button onClick={addUser} className="gap-2" disabled={submitting}>
                <UserPlus className="w-4 h-4" />
                {submitting ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}