// 대화 관련 타입 정의
export interface Conversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: 'active' | 'archived';
  introduction: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationsResponse {
  data: Conversation[];
  has_more: boolean;
  limit: number;
}

export interface DeleteConversationRequest {
  user: string;
}

export interface RenameConversationRequest {
  name?: string;
  auto_generate?: boolean;
  user: string;
}

export interface ConversationListParams {
  user: string;
  last_id?: string;
  limit?: number;
  sort_by?: 'created_at' | '-created_at' | 'updated_at' | '-updated_at';
} 