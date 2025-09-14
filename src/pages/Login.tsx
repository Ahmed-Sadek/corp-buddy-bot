import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bot, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [role, setRole] = useState<"employee" | "staff">("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication
    if (email && password) {
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", email);
      
      toast({
        title: "Login Successful",
        description: `Welcome back! Logging in as ${role}.`,
      });

      // Navigate based on role
      if (role === "staff") {
        navigate("/staff");
      } else {
        navigate("/chat");
      }
    } else {
      toast({
        title: "Login Failed",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_0%,transparent_50%)] opacity-10"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Buddy Chatbot
          </h1>
          <p className="text-muted-foreground">Your intelligent employee support assistant</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Select Your Role</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as "employee" | "staff")}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="employee" id="employee" />
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <Label htmlFor="employee" className="font-medium cursor-pointer">Employee</Label>
                      <p className="text-sm text-muted-foreground">Ask questions and submit requests</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="staff" id="staff" />
                    <Shield className="w-4 h-4 text-accent" />
                    <div className="flex-1">
                      <Label htmlFor="staff" className="font-medium cursor-pointer">HR/IT Staff</Label>
                      <p className="text-sm text-muted-foreground">Manage knowledge base and policies</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-all duration-200 focus:shadow-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-all duration-200 focus:shadow-lg"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary bg-primary hover:bg-primary-hover text-primary-foreground font-medium py-2.5"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Demo credentials: any email/password combination works
        </div>
      </div>
    </div>
  );
};

export default Login;