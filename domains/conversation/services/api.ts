import {
  Conversation,
  ConversationsResponse,
  ConversationListParams,
  DeleteConversationRequest,
  RenameConversationRequest,
} from '../types';

const MISO_API_BASE_URL = process.env.NEXT_PUBLIC_MISO_API_URL || 'https://api.holdings.miso.gs/ext/v1';
const MISO_API_KEY = process.env.NEXT_PUBLIC_MISO_API_KEY;

// 대화 목록 가져오기
export async function fetchConversations(
  params: ConversationListParams
): Promise<ConversationsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('user', params.user);
  
  if (params.last_id) {
    searchParams.append('last_id', params.last_id);
  }
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  if (params.sort_by) {
    searchParams.append('sort_by', params.sort_by);
  }

  const response = await fetch(`${MISO_API_BASE_URL}/conversations?${searchParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MISO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`대화 목록을 가져오는데 실패했습니다: ${response.statusText}`);
  }

  return response.json();
}

// 대화 삭제
export async function deleteConversation(
  conversationId: string,
  request: DeleteConversationRequest
): Promise<{ result: string }> {
  const response = await fetch(`${MISO_API_BASE_URL}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${MISO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`대화 삭제에 실패했습니다: ${response.statusText}`);
  }

  return response.json();
}

// 대화 이름 변경
export async function renameConversation(
  conversationId: string,
  request: RenameConversationRequest
): Promise<Conversation> {
  const response = await fetch(`${MISO_API_BASE_URL}/conversations/${conversationId}/rename`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`대화 이름 변경에 실패했습니다: ${response.statusText}`);
  }

  return response.json();
} 