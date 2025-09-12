import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
// Using console.log for now - replace with your preferred toast library
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
}

// Auth hooks
export const useAuth = () => {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Course hooks
export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('courses', {
        method: 'GET'
      })
      if (error) throw error
      return data
    }
  })
}

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('courses', {
        method: 'GET',
        body: { courseId }
      })
      if (error) throw error
      return data
    },
    enabled: !!courseId
  })
}

export const useCreateCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseData: any) => {
      const { data, error } = await supabase.functions.invoke('courses', {
        method: 'POST',
        body: courseData
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create course')
    }
  })
}

// Chapter hooks
export const useChapters = (courseId: string) => {
  return useQuery({
    queryKey: ['chapters', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('chapters', {
        method: 'GET',
        body: { course_id: courseId }
      })
      if (error) throw error
      return data
    },
    enabled: !!courseId
  })
}

export const useCreateChapter = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (chapterData: any) => {
      const { data, error } = await supabase.functions.invoke('chapters', {
        method: 'POST',
        body: chapterData
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.course_id] })
      toast.success('Chapter created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create chapter')
    }
  })
}

// Lesson hooks
export const useLessons = (chapterId: string) => {
  return useQuery({
    queryKey: ['lessons', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('lessons', {
        method: 'GET',
        body: { chapter_id: chapterId }
      })
      if (error) throw error
      return data
    },
    enabled: !!chapterId
  })
}

export const useCreateLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (lessonData: any) => {
      const { data, error } = await supabase.functions.invoke('lessons', {
        method: 'POST',
        body: lessonData
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', variables.chapter_id] })
      toast.success('Lesson created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create lesson')
    }
  })
}

// Enrollment hooks
export const useEnrollments = () => {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('enrollments', {
        method: 'GET'
      })
      if (error) throw error
      return data
    }
  })
}

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase.functions.invoke('enrollments', {
        method: 'POST',
        body: { course_id: courseId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      toast.success('Successfully enrolled in course!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enroll in course')
    }
  })
}

// Progress hooks
export const useProgress = (courseId: string) => {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('progress', {
        method: 'GET',
        body: { course_id: courseId }
      })
      if (error) throw error
      return data
    },
    enabled: !!courseId
  })
}

export const useUpdateProgress = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ lessonId, watchTime, completed }: {
      lessonId: string
      watchTime: number
      completed: boolean
    }) => {
      const { data, error } = await supabase.functions.invoke('progress', {
        method: 'POST',
        body: {
          lesson_id: lessonId,
          watch_time: watchTime,
          completed
        }
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate progress queries
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      if (variables.completed) {
        toast.success('Lesson completed!')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update progress')
    }
  })
}

// Upload hooks
export const useUploadSignature = () => {
  return useMutation({
    mutationFn: async ({ timestamp, folder, resourceType }: {
      timestamp: number
      folder?: string
      resourceType?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('upload', {
        method: 'POST',
        body: {
          timestamp,
          folder,
          resource_type: resourceType
        }
      })
      if (error) throw error
      return data
    }
  })
}
