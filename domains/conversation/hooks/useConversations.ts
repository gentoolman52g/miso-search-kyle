"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchConversations, deleteConversation, renameConversation } from '../services/api';
import {
  Conversation,
  ConversationsResponse,
  ConversationListParams,
  DeleteConversationRequest,
  RenameConversationRequest,
} from '../types';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadConversations: (params: ConversationListParams) => Promise<void>;
  loadMoreConversations: (params: ConversationListParams) => Promise<void>;
  deleteConversationById: (conversationId: string, user: string) => Promise<void>;
  renameConversationById: (conversationId: string, request: RenameConversationRequest) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const DEFAULT_LIMIT = 20;
const DEFAULT_USER = 'abc-123'; // 실제 구현시 사용자 정보로 교체

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 대화 목록 로드
  const loadConversations = useCallback(async (params: ConversationListParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchConversations({
        ...params,
        limit: params.limit || DEFAULT_LIMIT,
      });
      
      setConversations(response.data);
      setHasMore(response.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 추가 대화 목록 로드 (페이지네이션)
  const loadMoreConversations = useCallback(async (params: ConversationListParams) => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchConversations({
        ...params,
        limit: params.limit || DEFAULT_LIMIT,
      });
      
      setConversations(prev => [...prev, ...response.data]);
      setHasMore(response.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading]);

  // 대화 삭제
  const deleteConversationById = useCallback(async (conversationId: string, user: string) => {
    try {
      await deleteConversation(conversationId, { user });
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '대화 삭제에 실패했습니다.');
      throw err;
    }
  }, []);

  // 대화 이름 변경
  const renameConversationById = useCallback(async (
    conversationId: string, 
    request: RenameConversationRequest
  ) => {
    try {
      const updatedConversation = await renameConversation(conversationId, request);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? updatedConversation : conv
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '대화 이름 변경에 실패했습니다.');
      throw err;
    }
  }, []);

  // 대화 목록 새로고침
  const refreshConversations = useCallback(async () => {
    await loadConversations({
      user: DEFAULT_USER,
      limit: DEFAULT_LIMIT,
      sort_by: '-updated_at',
    });
  }, [loadConversations]);

  // 초기 로드
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  return {
    conversations,
    loading,
    error,
    hasMore,
    loadConversations,
    loadMoreConversations,
    deleteConversationById,
    renameConversationById,
    refreshConversations,
  };
} 