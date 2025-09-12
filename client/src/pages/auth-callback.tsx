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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
