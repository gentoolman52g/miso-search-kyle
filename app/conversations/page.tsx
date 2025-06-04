import { ConversationList } from '@/domains/conversation';

export default function ConversationsPage() {
  return <ConversationList />;
}

export const metadata = {
  title: '대화 기록 관리 - MISO Knowledge Manager',
  description: '이전 대화들을 확인하고 관리할 수 있습니다.',
}; 