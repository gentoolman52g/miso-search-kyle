'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { UserMenu } from '@/components/auth/user-menu'
import { LoginModal } from '@/components/auth/login-modal'

export const HeaderContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {user ? (
        <UserMenu />
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsLoginModalOpen(true)}
        >
          <LogIn className="h-4 w-4 mr-2" />
          로그인
        </Button>
      )}
      
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
} 