"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { Conversation } from '../types';

interface ConversationCardProps {
  conversation: Conversation;
  onDelete: (conversationId: string) => Promise<void>;
  onRename: (conversationId: string, newName: string) => Promise<void>;
}

export function ConversationCard({ 
  conversation, 
  onDelete, 
  onRename 
}: ConversationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(conversation.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p', { locale: ko });
  };

  const handleRename = async () => {
    if (editName.trim() === conversation.name.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onRename(conversation.id, editName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('이름 변경 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(conversation.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('삭제 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(conversation.name);
      setIsEditing(false);
    }
  };

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyPress}
                  className="h-auto p-0 border-none shadow-none text-base font-semibold"
                  autoFocus
                  disabled={isLoading}
                />
              ) : (
                <CardTitle className="text-base leading-tight line-clamp-2">
                  {conversation.name || '제목 없음'}
                </CardTitle>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  이름 변경
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {conversation.introduction && (
            <CardDescription className="mb-3 line-clamp-2">
              {conversation.introduction}
            </CardDescription>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={`px-2 py-1 rounded-full text-xs ${
              conversation.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {conversation.status === 'active' ? '활성' : '보관됨'}
            </span>
            <div className="flex flex-col items-end">
              <span>생성: {formatDate(conversation.created_at)}</span>
              {conversation.updated_at !== conversation.created_at && (
                <span>수정: {formatDate(conversation.updated_at)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{conversation.name}&quot; 대화를 삭제하시겠습니까? 
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 