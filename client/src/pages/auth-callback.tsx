import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setLocation('/signin?error=auth_failed')
          return
        }

        if (data.session) {
          // Check if user profile exists and has role set
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError || !profile) {
            // New user from Google OAuth - check if coming from student signup
            const urlParams = new URLSearchParams(window.location.search)
            const signupType = urlParams.get('signup_type')

            if (signupType === 'student') {
              // Redirect to username selection for student signup
              setLocation('/username-selection')
            } else {
              // Default to complete profile for other cases
              setLocation('/complete-profile')
            }
          } else if (!profile.role) {
            // User exists but no role set - redirect to complete profile
            setLocation('/complete-profile')
          } else {
            // Existing user with role - redirect to appropriate dashboard
            if (profile.role === 'teacher') {
              setLocation('/teacher-dashboard')
            } else if (profile.role === 'student') {
              setLocation('/student-dashboard')
            } else {
              setLocation('/')
            }
          }
        } else {
          // No session found
          setLocation('/signin')
        }
      } catch (error) {
        console.error('Callback handling failed:', error)
        setLocation('/signin?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex items-center justify-center">
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin" />
          <div className="absolute inset-0 w-24 h-24 rounded-full border-l-2 border-r-2 border-purple-500 animate-spin [animation-direction:reverse]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-[0.5em] uppercase">INITIALIZING SESSION</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-500" />
            <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest">SYNCHRONIZING UPLINK...</p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
