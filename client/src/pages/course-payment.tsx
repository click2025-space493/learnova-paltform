import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

const paymentSchema = z.object({
  studentName: z.string().min(2, "Student name is required (minimum 2 characters)"),
  paymentMethod: z.enum(['instapay', 'vodafone_cash'], {
    required_error: "Please select a payment method",
  }),
  paymentReference: z.string().min(1, "Transaction ID is required"),
  paymentScreenshot: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function CoursePayment() {
  const { id: courseId } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentName: "",
      paymentMethod: undefined,
      paymentReference: "",
      paymentScreenshot: "",
    },
  });

  const watchedPaymentMethod = form.watch("paymentMethod");

  // Fetch course data
  const { data: course, isLoading: courseLoading, error } = useQuery({
    queryKey: ['course-payment', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          price,
          cover_image_url,
          instapay_number,
          vodafone_cash_number,
          payment_instructions,
          teacher:users!courses_teacher_id_fkey (
            id,
            name
          )
        `)
        .eq('id', courseId)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      
      // Transform the data to handle array responses
      const transformedData = {
        ...data,
        teacher: Array.isArray(data.teacher) ? data.teacher[0] : data.teacher
      };
      
      return transformedData;
    },
    enabled: !!courseId,
  });

  // Check if user already has a pending request
  const { data: existingRequest } = useQuery({
    queryKey: ['enrollment-request', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('enrollment_requests')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!courseId && !!user?.id,
  });

  // Check authorization
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in courses.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    if (!authLoading && user?.role !== 'student') {
      toast({
        title: "Access Denied",
        description: "Only students can enroll in courses.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [authLoading, isAuthenticated, user, toast, setLocation]);

  // Submit enrollment request
  const submitRequestMutation = useMutation({
    mutationFn: async (data: PaymentForm) => {
      if (!courseId || !user?.id) throw new Error('Course ID and user required');
      
      const { error } = await supabase
        .from('enrollment_requests')
        .insert({
          student_id: user.id,
          course_id: courseId,
          student_name: data.studentName,
          payment_method: data.paymentMethod,
          payment_reference: data.paymentReference,
          payment_screenshot_url: data.paymentScreenshot,
          status: 'pending'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-request', courseId, user?.id] });
      toast({
        title: "Enrollment Request Submitted!",
        description: "Your payment has been submitted for review. You'll be notified once approved.",
      });
      setLocation(`/courses/${courseId}`);
    },
    onError: (error) => {
      console.error('Enrollment request error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit enrollment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PaymentForm) => {
    setIsSubmitting(true);
    try {
      await submitRequestMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || courseLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The course you're looking for doesn't exist or is not available for enrollment.
            </p>
            <Button onClick={() => setLocation("/courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (existingRequest) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {existingRequest.status === 'approved' ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Enrollment Approved!</h2>
                  <p className="text-muted-foreground mb-4">
                    Congratulations! Your enrollment for "{course?.title}" has been approved.
                  </p>
                  <Badge variant="default" className="mb-4">
                    Status: Approved
                  </Badge>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setLocation(`/courses/${courseId}/learn`)}>
                      Start Learning
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              ) : existingRequest.status === 'rejected' ? (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Enrollment Rejected</h2>
                  <p className="text-muted-foreground mb-4">
                    Unfortunately, your enrollment request for "{course?.title}" was not approved.
                  </p>
                  <Badge variant="destructive" className="mb-4">
                    Status: Rejected
                  </Badge>
                  {existingRequest.notes && (
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm"><strong>Instructor Notes:</strong> {existingRequest.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setLocation(`/courses/${courseId}`)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Course
                    </Button>
                    <Button onClick={() => setLocation("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Enrollment Request Submitted</h2>
                  <p className="text-muted-foreground mb-4">
                    Your enrollment request for "{course?.title}" is currently being reviewed by the instructor.
                  </p>
                  <Badge variant="secondary" className="mb-4">
                    Status: Pending Review
                  </Badge>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setLocation(`/courses/${courseId}`)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Course
                    </Button>
                    <Button onClick={() => setLocation("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Your Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Payment Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                              {course.instapay_number && (
                                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                                  <RadioGroupItem value="instapay" id="instapay" />
                                  <label htmlFor="instapay" className="flex items-center gap-3 cursor-pointer flex-1">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                    <div>
                                      <div className="font-medium">InstaPay</div>
                                      <div className="text-sm text-muted-foreground">
                                        {course.instapay_number}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              )}
                              
                              {course.vodafone_cash_number && (
                                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                                  <RadioGroupItem value="vodafone_cash" id="vodafone_cash" />
                                  <label htmlFor="vodafone_cash" className="flex items-center gap-3 cursor-pointer flex-1">
                                    <Smartphone className="h-6 w-6 text-red-600" />
                                    <div>
                                      <div className="font-medium">Vodafone Cash</div>
                                      <div className="text-sm text-muted-foreground">
                                        {course.vodafone_cash_number}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              )}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {course.payment_instructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Payment Instructions</h4>
                        <p className="text-blue-800 text-sm whitespace-pre-wrap">
                          {course.payment_instructions}
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="paymentReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your transaction ID from the payment"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentScreenshot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Screenshot (Optional)</FormLabel>
                          <FormControl>
                            <ImageUpload
                              onImageUploaded={(url: string) => {
                                field.onChange(url);
                                toast({
                                  title: "Screenshot uploaded",
                                  description: "Your payment screenshot has been uploaded successfully.",
                                });
                              }}
                              currentImageUrl={field.value}
                              label="Upload Payment Screenshot"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">Important Notice</h4>
                      <p className="text-yellow-800 text-sm">
                        After submitting your payment details, your enrollment request will be reviewed by the instructor. 
                        You will receive access to the course content once your payment is verified and approved.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting || submitRequestMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Enrollment Request"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Course Summary */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-6">
                {course.cover_image_url && (
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                
                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {course.description}
                </p>
                
                <Separator className="mb-4" />
                
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-primary">
                    ${course.price}
                  </div>
                  <p className="text-sm text-muted-foreground">One-time payment</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center justify-between mb-2">
                    <span>Instructor:</span>
                    <span className="font-medium">{course.teacher?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Access:</span>
                    <span className="font-medium">Lifetime</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
