"use client";

import React from 'react';
import { ConversationCard } from './ConversationCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { useConversations } from '../hooks/useConversations';

const DEFAULT_USER = 'abc-123'; // 실제 구현시 사용자 정보로 교체

export function ConversationList() {
  const {
    conversations,
    loading,
    error,
    hasMore,
    loadMoreConversations,
    deleteConversationById,
    renameConversationById,
    refreshConversations,
  } = useConversations();

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    
    const lastConversation = conversations[conversations.length - 1];
    await loadMoreConversations({
      user: DEFAULT_USER,
      last_id: lastConversation?.id,
      limit: 20,
      sort_by: '-updated_at',
    });
  };

  const handleDelete = async (conversationId: string) => {
    await deleteConversationById(conversationId, DEFAULT_USER);
  };

  const handleRename = async (conversationId: string, newName: string) => {
    await renameConversationById(conversationId, {
      name: newName,
      user: DEFAULT_USER,
    });
  };

  const handleRefresh = async () => {
    await refreshConversations();
  };

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대화 기록 관리</h1>
          <p className="text-muted-foreground">
            이전 대화들을 확인하고 관리할 수 있습니다.
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <Separator className="mb-6" />

      {/* 대화 목록 */}
      <ScrollArea className="h-[calc(100vh-240px)]">
        {conversations.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">대화 기록이 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              아직 저장된 대화가 없습니다. 채팅을 시작해보세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>대화 목록을 불러오는 중...</span>
          </div>
        )}

        {/* 더 보기 버튼 */}
        {hasMore && conversations.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button 
              onClick={handleLoadMore} 
              variant="outline" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                '더 보기'
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 