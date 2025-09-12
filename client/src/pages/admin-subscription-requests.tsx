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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Mail,
  Calendar,
  MessageSquare,
  Crown
} from "lucide-react";

interface SubscriptionRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  planType: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export default function AdminSubscriptionRequests() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
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

    if (!isLoading && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can access this page.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  // Fetch all subscription requests
  const { data: requests, isLoading: requestsLoading } = useQuery<SubscriptionRequest[]>({
    queryKey: ["/api/admin/subscription-requests"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes: string }) => {
      const response = await fetch(`/api/admin/subscription-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to approve request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-requests"] });
      toast({
        title: "Success",
        description: "Subscription request approved successfully",
      });
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve subscription request",
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes: string }) => {
      const response = await fetch(`/api/admin/subscription-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to reject request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-requests"] });
      toast({
        title: "Success",
        description: "Subscription request rejected",
      });
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject subscription request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: SubscriptionRequest) => {
    approveMutation.mutate({ requestId: request.id, adminNotes });
  };

  const handleReject = (request: SubscriptionRequest) => {
    if (!adminNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ requestId: request.id, adminNotes });
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

  const filteredRequests = requests?.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  }) || [];

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Requests</h1>
            <p className="text-muted-foreground">
              Review and manage teacher subscription requests
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {pendingCount} Pending
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'pending', label: 'Pending', count: requests?.filter(r => r.status === 'pending').length || 0 },
            { key: 'approved', label: 'Approved', count: requests?.filter(r => r.status === 'approved').length || 0 },
            { key: 'rejected', label: 'Rejected', count: requests?.filter(r => r.status === 'rejected').length || 0 },
            { key: 'all', label: 'All', count: requests?.length || 0 },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              onClick={() => setFilter(tab.key as any)}
              className="relative"
            >
              {tab.label}
              <Badge variant="secondary" className="ml-2">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {request.teacherName?.split(' ').map(n => n[0]).join('') || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{request.teacherName}</h3>
                          {getStatusBadge(request.status)}
                          <Badge variant="outline">
                            <Crown className="h-3 w-3 mr-1" />
                            {request.planType.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {request.teacherEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg mb-3">
                          <div className="flex items-center gap-1 mb-1">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm font-medium">Teacher's Message:</span>
                          </div>
                          <p className="text-sm">{request.message}</p>
                        </div>
                        
                        {request.adminNotes && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-blue-800 mb-1">Admin Response:</div>
                            <p className="text-sm text-blue-700">{request.adminNotes}</p>
                            {request.reviewedAt && (
                              <p className="text-xs text-blue-600 mt-1">
                                Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAdminNotes("");
                              }}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Subscription Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Teacher: {request.teacherName}</h4>
                                <p className="text-sm text-muted-foreground mb-2">Plan: {request.planType.toUpperCase()}</p>
                                <div className="bg-muted p-3 rounded">
                                  <p className="text-sm">{request.message}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="adminNotes">Admin Notes (Optional for approval, Required for rejection)</Label>
                                <Textarea
                                  id="adminNotes"
                                  placeholder="Add your notes or feedback..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(request)}
                                  disabled={approveMutation.isPending}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(request)}
                                  disabled={rejectMutation.isPending}
                                  className="flex-1"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p className="text-muted-foreground">
                  {filter === 'pending' 
                    ? "No pending subscription requests at the moment."
                    : `No ${filter} subscription requests found.`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
