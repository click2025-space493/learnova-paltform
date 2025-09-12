import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Clock, CreditCard, Smartphone } from "lucide-react";

interface EnrollmentRequest {
  id: string;
  student_id: string;
  course_id: string;
  student_name?: string;
  payment_method: string;
  payment_reference: string;
  payment_screenshot_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  notes?: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  course: {
    id: string;
    title: string;
    price: number;
  };
}

export default function EnrollmentRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch enrollment requests for teacher's courses
  const { data: requests, isLoading } = useQuery({
    queryKey: ['enrollment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get teacher's course IDs
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user.id);
      
      const courseIds = teacherCourses?.map(c => c.id) || [];
      
      if (courseIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('enrollment_requests')
        .select(`
          id,
          student_id,
          course_id,
          student_name,
          payment_method,
          payment_reference,
          payment_screenshot_url,
          status,
          requested_at,
          notes,
          student:users!enrollment_requests_student_id_fkey (
            id,
            name,
            email,
            avatar_url
          ),
          course:courses!enrollment_requests_course_id_fkey (
            id,
            title,
            price
          )
        `)
        .in('course_id', courseIds)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to handle array responses from Supabase
      const transformedData = data?.map(item => ({
        ...item,
        student: Array.isArray(item.student) ? item.student[0] : item.student,
        course: Array.isArray(item.course) ? item.course[0] : item.course
      })) || [];
      
      return transformedData as EnrollmentRequest[];
    },
    enabled: !!user?.id,
  });

  // Approve/Reject enrollment request
  const reviewRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const { error: updateError } = await supabase
        .from('enrollment_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          notes
        })
        .eq('id', requestId);
      
      if (updateError) throw updateError;

      // If approved, create enrollment record
      if (status === 'approved') {
        const request = requests?.find(r => r.id === requestId);
        
        // Try to get student and course IDs from the request object
        let studentId = request?.student?.id;
        let courseId = request?.course?.id;
        
        // Fallback: get IDs directly from the request if nested objects are missing
        if (!studentId || !courseId) {
          studentId = request?.student_id;
          courseId = request?.course_id;
        }
        
        if (studentId && courseId) {
          const { error: enrollError } = await supabase
            .from('enrollments')
            .insert({
              student_id: studentId,
              course_id: courseId,
              enrolled_at: new Date().toISOString()
            });
          
          if (enrollError) throw enrollError;
        } else {
          console.error('Missing data:', { request, studentId, courseId });
          throw new Error('Invalid request data: missing student or course information');
        }
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
      toast({
        title: status === 'approved' ? "Request Approved" : "Request Rejected",
        description: status === 'approved' 
          ? "Student has been enrolled in the course." 
          : "Enrollment request has been rejected.",
      });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error) => {
      console.error('Review request error:', error);
      toast({
        title: "Review Failed",
        description: "Failed to process the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReview = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    reviewRequestMutation.mutate({
      requestId: selectedRequest.id,
      status,
      notes: reviewNotes
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'instapay':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'vodafone_cash':
        return <Smartphone className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'instapay':
        return 'InstaPay';
      case 'vodafone_cash':
        return 'Vodafone Cash';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const reviewedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Enrollment Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending enrollment requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.student?.avatar_url || ''} />
                      <AvatarFallback>
                        {request.student?.name?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{request.student_name || request.student?.name || 'Unknown Student'}</div>
                      <div className="text-sm text-muted-foreground">{request.student?.email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Enrollment Request</DialogTitle>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Student Information</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Name:</strong> {selectedRequest.student_name || selectedRequest.student?.name || 'Unknown Student'}</p>
                                  <p><strong>Email:</strong> {selectedRequest.student?.email || 'No email'}</p>
                                  <p><strong>Course:</strong> {selectedRequest.course?.title || 'Unknown Course'}</p>
                                  <p><strong>Price:</strong> ${selectedRequest.course?.price || 0}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Payment Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    {getPaymentMethodIcon(selectedRequest.payment_method)}
                                    <span>{getPaymentMethodName(selectedRequest.payment_method)}</span>
                                  </div>
                                  <p><strong>Transaction ID:</strong> {selectedRequest.payment_reference}</p>
                                  <p><strong>Requested:</strong> {new Date(selectedRequest.requested_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>

                            {selectedRequest.payment_screenshot_url && (
                              <div>
                                <h4 className="font-medium mb-2">Payment Screenshot</h4>
                                <img
                                  src={selectedRequest.payment_screenshot_url}
                                  alt="Payment screenshot"
                                  className="max-w-full h-auto rounded-lg border"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Review Notes (Optional)
                              </label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add any notes about this review..."
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="destructive"
                                onClick={() => handleReview('rejected')}
                                disabled={reviewRequestMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleReview('approved')}
                                disabled={reviewRequestMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve & Enroll
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {reviewedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.student?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {request.student?.name?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{request.student_name || request.student?.name || 'Unknown Student'}</p>
                      <p className="text-xs text-muted-foreground">{request.course?.title || 'Unknown Course'}</p>
                    </div>
                  </div>
                  <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
