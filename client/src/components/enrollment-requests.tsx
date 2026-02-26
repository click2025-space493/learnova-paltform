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
    <div className="space-y-8">
      {/* Pending Requests */}
      <Card className="border border-border/50 bg-card rounded-[2.5rem] card-premium overflow-hidden">
        <CardHeader className="p-8 border-b border-border/50 bg-muted/30">
          <CardTitle className="flex items-center gap-3 text-2xl font-black">
            <Clock className="h-6 w-6 text-orange-500" />
            Admissions Inbox <span className="text-muted-foreground font-medium">({pendingRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-20 bg-muted/10">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Queue is clear</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                No new scholars are waiting for verification at this moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {pendingRequests.map((request) => (
                <div key={request.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-8 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-5 mb-4 sm:mb-0">
                    <div className="relative">
                      <Avatar className="h-14 w-14 rounded-2xl border-2 border-background shadow-sm">
                        <AvatarImage src={request.student?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-black">
                          {request.student?.name?.[0] || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-background flex items-center justify-center">
                        <Clock className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="font-black text-foreground text-lg leading-tight mb-1">
                        {request.student_name || request.student?.name || 'Unknown Scholar'}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-xs font-bold text-muted-foreground">{request.student?.email || 'Scholar Archive'}</div>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">{request.course?.title || 'Unknown Pathway'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end px-6 border-r border-border/50">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tuition</div>
                      <div className="font-black text-foreground">${request.course?.price || 0}</div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 px-6 rounded-xl font-bold border-border/50 bg-background hover:bg-muted hover:text-primary transition-all group-hover:border-primary/30"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Dossier
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl rounded-[2.5rem] border-border/50 bg-card p-0 overflow-hidden backdrop-blur-3xl shadow-2xl">
                        <div className="bg-primary/5 p-8 border-b border-border/50">
                          <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight">Admission Dossier</DialogTitle>
                            <p className="text-muted-foreground font-medium">Verification of academic credentials and tuition payment.</p>
                          </DialogHeader>
                        </div>

                        {selectedRequest && (
                          <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Scholar Profile</h4>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Full Name</p>
                                    <p className="font-bold text-foreground">{selectedRequest.student_name || selectedRequest.student?.name || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Institutional Pathway</p>
                                    <p className="font-bold text-foreground">{selectedRequest.course?.title || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Tuition Amount</p>
                                    <p className="text-xl font-black text-foreground">${selectedRequest.course?.price || 0}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-muted/30 p-6 rounded-3xl border border-border/50">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Payment Ledger</h4>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center border border-border/50">
                                      {getPaymentMethodIcon(selectedRequest.payment_method)}
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Gateway</p>
                                      <p className="font-bold text-foreground leading-none">{getPaymentMethodName(selectedRequest.payment_method)}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Transaction Ref</p>
                                    <p className="font-mono text-xs font-black p-2 bg-background/50 rounded-lg border border-border/30 truncate">{selectedRequest.payment_reference}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Submitted</p>
                                    <p className="font-bold text-foreground">{new Date(selectedRequest.requested_at).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {selectedRequest.payment_screenshot_url && (
                              <div>
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Payment Verification Image</h4>
                                <div className="rounded-3xl border-2 border-border/50 overflow-hidden shadow-inner group/img relative">
                                  <img
                                    src={selectedRequest.payment_screenshot_url}
                                    alt="Payment screenshot"
                                    className="w-full h-auto max-h-[400px] object-contain bg-muted/50"
                                  />
                                  <div className="absolute inset-0 bg-transparent group-hover/img:bg-black/5 transition-colors pointer-events-none" />
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Institutional Feedback</h4>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Instructions for the scholar..."
                                className="min-h-[100px] rounded-2xl border-border/50 bg-muted/20 focus:bg-background transition-all font-medium"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                              <Button
                                variant="outline"
                                className="h-14 px-8 rounded-2xl font-bold text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all"
                                onClick={() => handleReview('rejected')}
                                disabled={reviewRequestMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline Admission
                              </Button>
                              <Button
                                className="h-14 px-10 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
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
        <Card className="border border-border/50 bg-card rounded-[2.5rem] card-premium overflow-hidden">
          <CardHeader className="p-8 border-b border-border/50">
            <CardTitle className="text-xl font-black">Institutional Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {reviewedRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-xl border border-border/50 shadow-sm">
                      <AvatarImage src={request.student?.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-black">
                        {request.student?.name?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-black text-foreground leading-tight">{request.student_name || request.student?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{request.course?.title || 'Unknown'}</p>
                    </div>
                  </div>
                  <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${request.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
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
