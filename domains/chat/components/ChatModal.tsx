"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Minus, Square } from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatUrl: string;
}

export function ChatModal({ isOpen, onClose, chatUrl }: ChatModalProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isMinimized 
            ? 'max-w-sm h-16' 
            : 'max-w-7xl h-[95vh]'
        } p-0 gap-0 transition-all duration-300 ease-in-out border-0 shadow-2xl [&>button]:hidden`}
        style={{
          width: isMinimized ? '320px' : '90vw',
          height: isMinimized ? '64px' : '95vh',
          maxWidth: isMinimized ? '320px' : '1400px',
          borderRadius: isMinimized ? '12px' : '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 접근성을 위한 숨겨진 제목 */}
        <DialogTitle className="sr-only">
          {isMinimized ? 'MISO 채팅' : 'MISO 채팅 도우미'}
        </DialogTitle>

        {/* Google Material Design 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isMinimized ? 'MISO 채팅' : 'MISO 채팅 도우미'}
              </h2>
              {!isMinimized && (
                <p className="text-sm text-gray-500">실시간 AI 지원</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMinimized ? (
                <Square className="h-4 w-4 text-gray-600" />
              ) : (
                <Minus className="h-4 w-4 text-gray-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
        
        {/* 채팅 컨텐츠 */}
        {!isMinimized && (
          <div className="flex-1 relative bg-white">
            <iframe
              src={chatUrl}
              className="w-full h-full border-0"
              allow="microphone"
              title="MISO Chat"
              style={{ 
                height: 'calc(95vh - 80px)',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 