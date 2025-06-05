'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LoginModal } from './login-modal'
import { Lock, LogIn } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requireAuth = true 
}) => {
  const { user, loading } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  if (loading) {
    return <div>Loading...</div>
  }

  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <>
        <div className="flex flex-col items-center justify-center p-8 bg-muted/10 rounded-lg border border-muted/20">
          <div className="p-4 bg-muted/20 rounded-full mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            이 기능을 사용하려면 먼저 로그인해주세요.
          </p>
          <Button onClick={() => setIsLoginModalOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />
            로그인하기
          </Button>
        </div>
        
        <LoginModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    )
  }

  return <>{children}</>
}

export const useProtectedAction = () => {
  const { user } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const executeWithAuth = (action: () => void) => {
    if (user) {
      action()
    } else {
      setIsLoginModalOpen(true)
    }
  }

  const LoginModalComponent = () => (
    <LoginModal 
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
    />
  )

  return { executeWithAuth, LoginModalComponent }
} 