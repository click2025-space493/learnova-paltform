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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        <div className="mb-12">
          <Link href={`/courses/${courseId}`}>
            <Button
              variant="ghost"
              className="p-0 h-auto text-white/30 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-transparent group"
            >
              <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-2 transition-transform" />
              REVERT TO OVERVIEW
            </Button>
          </Link>
          <div className="mt-8">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              TRANSACTION TERMINAL
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-tight">INITIALIZE <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">ACCESS.</span></h1>
            <p className="text-blue-100/40 font-medium tracking-tight uppercase text-xs mt-2">Securing Knowledge Stream // ID-{courseId?.slice(0, 8)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Payment Form */}
          <div className="lg:col-span-8">
            <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-blue">
              <div className="p-10 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  CREDENTIALS & PAYMENT
                </h2>
              </div>
              <div className="p-10 lg:p-12">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">STUDENT IDENTIFIER</FormLabel>
                          <FormControl>
                            <Input placeholder="ENTER FULL LEGAL NAME..." {...field} className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10" />
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">PAYMENT UPLINK METHOD</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                              {course.instapay_number && (
                                <div className={`flex items-center space-x-2 border-2 rounded-2xl p-6 transition-all cursor-pointer ${field.value === 'instapay' ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                  <RadioGroupItem value="instapay" id="instapay" className="border-white/20 text-blue-500" />
                                  <label htmlFor="instapay" className="flex items-center gap-4 cursor-pointer flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                      <CreditCard className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div>
                                      <div className="font-black text-xs text-white uppercase tracking-widest">InstaPay</div>
                                      <div className="text-[10px] font-medium text-white/40 mt-1 uppercase tracking-tighter">
                                        {course.instapay_number}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              )}

                              {course.vodafone_cash_number && (
                                <div className={`flex items-center space-x-2 border-2 rounded-2xl p-6 transition-all cursor-pointer ${field.value === 'vodafone_cash' ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                  <RadioGroupItem value="vodafone_cash" id="vodafone_cash" className="border-white/20 text-red-500" />
                                  <label htmlFor="vodafone_cash" className="flex items-center gap-4 cursor-pointer flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                      <Smartphone className="h-6 w-6 text-red-400" />
                                    </div>
                                    <div>
                                      <div className="font-black text-xs text-white uppercase tracking-widest">VF Cash</div>
                                      <div className="text-[10px] font-medium text-white/40 mt-1 uppercase tracking-tighter">
                                        {course.vodafone_cash_number}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              )}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    {course.payment_instructions && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          PAYMENT PROTOCOL
                        </h4>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-relaxed whitespace-pre-wrap">
                          {course.payment_instructions}
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="paymentReference"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">TRANSACTION HASH (ID)</FormLabel>
                          <FormControl>
                            <Input placeholder="ENTER TRANSACTION ID..." {...field} className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10" />
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentScreenshot"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">VISUAL VERIFICATION</FormLabel>
                          <FormControl>
                            <ImageUpload
                              onImageUploaded={(url: string) => {
                                field.onChange(url);
                                toast({
                                  title: "UPLINK SUCCESS",
                                  description: "Visual verification data synchronized.",
                                });
                              }}
                              currentImageUrl={field.value}
                              label="UPLOAD PAYMENT SCREENSHOT"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                      <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-3">SYSTEM ADVISORY</h4>
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                        UPON COMMITMENT, YOUR REQUEST WILL ENTER THE VALIDATION QUEUE.
                        ACCESS TO THE KNOWLEDGE STREAM WILL BE ENABLED POST-VERIFICATION.
                      </p>
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting || submitRequestMutation.isPending}
                        className="h-16 w-full rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-400 hover:text-white transition-all border-none"
                      >
                        {isSubmitting ? "SYNCHRONIZING..." : "EXECUTE ENROLLMENT"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>

          {/* Course Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-40 h-fit">
            <div className="rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl">
              <div className="aspect-video relative overflow-hidden group">
                {course.cover_image_url ? (
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                    <CreditCard className="w-12 h-12 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80" />
              </div>

              <div className="p-8">
                <h3 className="font-black text-white text-xl uppercase tracking-tighter mb-4 line-clamp-2">{course.title}</h3>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">INSTRUCTOR</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{course.teacher?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">ACCESS</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">UNRESTRICTED</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 text-center">
                  <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">ACCESS FEE</div>
                  <div className="text-4xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
                    <span className="text-blue-400">$</span>
                    {course.price}
                  </div>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] mt-2">ONE-TIME SYNC CONTRIBUTION</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
