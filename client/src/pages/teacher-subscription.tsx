import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  Crown, 
  Star,
  AlertCircle
} from "lucide-react";

interface SubscriptionRequest {
  id: string;
  planType: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface SubscriptionStatus {
  status: 'active' | 'inactive';
  canPublishCourses: boolean;
  planType: string;
}

export default function TeacherSubscription() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [planType, setPlanType] = useState("pro");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && user?.role !== 'teacher') {
      toast({
        title: "Access Denied",
        description: "Only teachers can access this page.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/teacher/subscription-status"],
    enabled: isAuthenticated && user?.role === 'teacher',
  });

  // Fetch subscription requests
  const { data: requests } = useQuery<SubscriptionRequest[]>({
    queryKey: ["/api/teacher/subscription-requests"],
    enabled: isAuthenticated && user?.role === 'teacher',
  });

  // Create subscription request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { planType: string; message: string }) => {
      const response = await fetch('/api/teacher/subscription-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create subscription request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/subscription-requests"] });
      toast({
        title: "Success",
        description: "Subscription request submitted successfully",
      });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit subscription request",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please provide a message explaining why you need a subscription",
        variant: "destructive",
      });
      return;
    }
    createRequestMutation.mutate({ planType, message });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasPendingRequest = requests?.some(req => req.status === 'pending');
  const canPublish = subscriptionStatus?.canPublishCourses;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Teacher Subscription</h1>
          <p className="text-muted-foreground">
            Request subscription approval to publish courses on the platform
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Publishing Status:</span>
                  {canPublish ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Can Publish Courses
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Cannot Publish Courses
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {canPublish 
                    ? "You have an active subscription and can publish courses"
                    : "You need an approved subscription to publish courses"
                  }
                </div>
              </div>
              {subscriptionStatus?.planType && (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  <Star className="h-4 w-4 mr-1" />
                  {subscriptionStatus.planType.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Form */}
        {!canPublish && !hasPendingRequest && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Request Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select value={planType} onValueChange={setPlanType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="message">Message to Admins</Label>
                <Textarea
                  id="message"
                  placeholder="Explain why you need a subscription and what courses you plan to create..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={handleSubmitRequest}
                disabled={createRequestMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Request Notice */}
        {hasPendingRequest && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Request Pending</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Your subscription request is being reviewed by our admins. You'll be notified once it's processed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Request History */}
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests && requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium">{request.planType.toUpperCase()} Plan</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Your Message:</strong> {request.message}
                    </div>
                    
                    {request.adminNotes && (
                      <div className="text-sm bg-muted p-2 rounded">
                        <strong>Admin Response:</strong> {request.adminNotes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subscription requests found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
