"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatModal } from './ChatModal';
import Image from 'next/image';

const CHAT_URL = "https://52g.miso.gs/chatList/3ytdyMdqYeWBxKHs";

export function FloatingChatButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      {/* 플로팅 버튼 - 모달이 열리면 숨김 */}
      {!isModalOpen && (
        <div 
          className="fixed bottom-6 right-6 z-[9999]"
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999
          }}
        >
          <Button
            onClick={toggleModal}
            className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-out bg-white hover:bg-gray-50 border-0 p-1 group"
            size="icon"
            style={{
              width: '80px',
              height: '80px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Image
              src="/chat-icon.png"
              alt="채팅"
              width={72}
              height={72}
              className="transition-transform duration-200 group-hover:scale-110"
            />
          </Button>
        </div>
      )}

      {/* 채팅 모달 */}
      <ChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chatUrl={CHAT_URL}
      />
    </>
  );
} 