"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { X, Plus, FileText, HelpCircle, File, Loader2, AlertTriangle, CheckCircle, ChevronRight, Info } from 'lucide-react'
import { addKnowledgeSegment, fetchAllDocuments, checkSegmentDuplicates } from '@/app/miso-actions'

interface AddSegmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type SegmentType = 'regulation' | 'faq'

interface RegulationData {
  documentName: string
  chapterNumber: string
  chapterTitle: string
  articleNumber: string
  articleTitle: string
  content: string
}

interface FaqData {
  rowId: string
  topic: string
  question: string
  answer: string
}

interface Document {
  id: string
  name: string
  datasetId: string
  datasetName: string
}

interface DuplicateCheckResult {
  existingIds: string[]
  lastId?: string
  suggestedId?: string
}

export const AddSegmentModal: React.FC<AddSegmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [segmentType, setSegmentType] = useState<SegmentType>('regulation')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 문서 관련 상태
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  
  // 중복검사 관련 상태
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  
  const [regulationData, setRegulationData] = useState<RegulationData>({
    documentName: '',
    chapterNumber: '',
    chapterTitle: '',
    articleNumber: '',
    articleTitle: '',
    content: ''
  })
  
  const [faqData, setFaqData] = useState<FaqData>({
    rowId: '',
    topic: '',
    question: '',
    answer: ''
  })

  // 초기화 함수
  const resetAllStates = useCallback(() => {
    setSegmentType('regulation')
    setIsSubmitting(false)
    setError(null)
    setSelectedDocumentId('')
    setDuplicateCheckResult(null)
    setIsCheckingDuplicate(false)
    setDuplicateWarning(null)
    setRegulationData({
      documentName: '',
      chapterNumber: '',
      chapterTitle: '',
      articleNumber: '',
      articleTitle: '',
      content: ''
    })
    setFaqData({
      rowId: '',
      topic: '',
      question: '',
      answer: ''
    })
  }, [])

  // 모달이 열릴 때 초기화 및 데이터 로드
  useEffect(() => {
    if (isOpen) {
      resetAllStates()
      loadAllDocuments()
    }
  }, [isOpen, resetAllStates])

  // 모달이 닫힐 때 초기화
  const handleClose = useCallback(() => {
    resetAllStates()
    onClose()
  }, [resetAllStates, onClose])

  // 문서 선택 및 타입 변경 시 중복검사 (문서가 선택된 경우에만)
  useEffect(() => {
    if (isOpen && selectedDocumentId && documents.length > 0) {
      checkDuplicates()
    } else {
      // 문서가 선택되지 않은 경우 중복검사 결과 초기화
      setDuplicateCheckResult(null)
      setDuplicateWarning(null)
    }
  }, [segmentType, selectedDocumentId, isOpen, documents.length])

  // ID 자동 제안 적용 (사용자가 수동으로 변경하지 않은 경우에만)
  useEffect(() => {
    if (duplicateCheckResult?.suggestedId) {
      if (segmentType === 'faq' && !faqData.rowId) {
        setFaqData(prev => ({ ...prev, rowId: duplicateCheckResult.suggestedId || '' }))
      } else if (segmentType === 'regulation' && !regulationData.articleNumber) {
        setRegulationData(prev => ({ ...prev, articleNumber: duplicateCheckResult.suggestedId || '' }))
      }
    }
  }, [duplicateCheckResult, segmentType, faqData.rowId, regulationData.articleNumber])

  const loadAllDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const result = await fetchAllDocuments()
      if (result.data) {
        setDocuments(result.data)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      setError('문서 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const checkDuplicates = async () => {
    if (!selectedDocumentId) return
    
    const selectedDocument = getSelectedDocument()
    if (!selectedDocument) return
    
    setIsCheckingDuplicate(true)
    setDuplicateWarning(null)
    
    try {
      const result = await checkSegmentDuplicates(
        selectedDocument.datasetId,
        selectedDocument.id,
        segmentType
      )
      if (result.data) {
        setDuplicateCheckResult(result.data)
      } else if (result.error) {
        console.error('중복검사 실패:', result.error)
      }
    } catch (error) {
      console.error('중복검사 중 오류:', error)
    } finally {
      setIsCheckingDuplicate(false)
    }
  }

  const checkCurrentIdDuplicate = (currentId: string): boolean => {
    if (!duplicateCheckResult || !currentId.trim()) return false
    return duplicateCheckResult.existingIds.includes(currentId.trim())
  }

  const getCurrentId = (): string => {
    return segmentType === 'faq' ? faqData.rowId : regulationData.articleNumber
  }

  const getSelectedDocument = (): Document | undefined => {
    return documents.find(doc => doc.id === selectedDocumentId)
  }

  // ID 중복검사 및 경고 메시지 업데이트
  useEffect(() => {
    const currentId = getCurrentId()
    if (currentId && duplicateCheckResult) {
      if (checkCurrentIdDuplicate(currentId)) {
        const lastIdInfo = duplicateCheckResult.lastId 
          ? ` 현재 마지막 ${segmentType === 'faq' ? 'Row ID' : '조번호'}는 ${duplicateCheckResult.lastId}입니다.`
          : ''
        setDuplicateWarning(`중복된 ${segmentType === 'faq' ? 'Row ID' : '조번호'}입니다.${lastIdInfo}`)
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }, [faqData.rowId, regulationData.articleNumber, duplicateCheckResult, segmentType])

  if (!isOpen) return null

  const convertToOriginalFormat = (): string => {
    if (segmentType === 'regulation') {
      const fields = []
      if (regulationData.documentName) fields.push(`문서명: ${regulationData.documentName}`)
      if (regulationData.chapterNumber) fields.push(`장번호: ${regulationData.chapterNumber}`)
      if (regulationData.chapterTitle) fields.push(`장제목: ${regulationData.chapterTitle}`)
      if (regulationData.articleNumber) fields.push(`조번호: ${regulationData.articleNumber}`)
      if (regulationData.articleTitle) fields.push(`조제목: ${regulationData.articleTitle}`)
      if (regulationData.content) fields.push(`내용: ${regulationData.content}`)
      return fields.join(';')
    } else {
      const fields = []
      if (faqData.rowId) fields.push(`row_id: ${faqData.rowId}`)
      if (faqData.topic) fields.push(`주제: ${faqData.topic}`)
      if (faqData.question) fields.push(`질문: ${faqData.question}`)
      if (faqData.answer) fields.push(`답변: ${faqData.answer}`)
      return fields.join(';')
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      // 중복검사
      const currentId = getCurrentId()
      if (currentId && checkCurrentIdDuplicate(currentId)) {
        setError(`중복된 ${segmentType === 'faq' ? 'Row ID' : '조번호'}입니다. 다른 ID를 사용해주세요.`)
        return
      }

      const originalContent = convertToOriginalFormat()
      
      if (!originalContent.trim()) {
        setError('필수 정보를 입력해주세요.')
        return
      }

      const selectedDocument = getSelectedDocument()
      if (!selectedDocument) {
        setError('문서를 선택해주세요.')
        return
      }
      
      const result = await addKnowledgeSegment(
        selectedDocument.datasetId,
        selectedDocument.id,
        originalContent,
        segmentType === 'faq' ? faqData.answer : undefined,
        []
      )

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
        handleClose()
      }
    } catch (error) {
      setError('세그먼트 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    const hasValidContent = segmentType === 'regulation' 
      ? regulationData.content.trim() !== ''
      : faqData.rowId.trim() !== '' && 
        faqData.topic.trim() !== '' && 
        faqData.question.trim() !== '' && 
        faqData.answer.trim() !== ''
        
    const noDuplicates = !checkCurrentIdDuplicate(getCurrentId())
        
    return hasValidContent && selectedDocumentId && noDuplicates
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="pr-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">새 세그먼트 추가</h1>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              지식베이스에 새로운 내용을 추가하세요. 필요한 정보를 단계별로 입력해드릴게요.
            </p>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          <div className="space-y-8">
            
            {/* 1단계: 타입 선택 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">1</div>
                <h2 className="text-lg font-semibold text-gray-900">어떤 유형의 콘텐츠인가요?</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSegmentType('regulation')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    segmentType === 'regulation' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`w-5 h-5 ${segmentType === 'regulation' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-medium ${segmentType === 'regulation' ? 'text-blue-900' : 'text-gray-900'}`}>
                        인사규정
                      </div>
                      <div className="text-xs text-gray-500 mt-1">회사 규정, 정책 등</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setSegmentType('faq')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    segmentType === 'faq' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className={`w-5 h-5 ${segmentType === 'faq' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-medium ${segmentType === 'faq' ? 'text-blue-900' : 'text-gray-900'}`}>
                        FAQ
                      </div>
                      <div className="text-xs text-gray-500 mt-1">자주 묻는 질문</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* 2단계: 문서 선택 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">2</div>
                <h2 className="text-lg font-semibold text-gray-900">어떤 문서에 추가할까요?</h2>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">대상 문서를 선택해주세요</Label>
                <Select 
                  value={selectedDocumentId} 
                  onValueChange={setSelectedDocumentId}
                  disabled={isLoadingDocuments}
                >
                  <SelectTrigger className="w-full h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <div className="flex items-center gap-3 text-left">
                      <File className="w-4 h-4 text-gray-400" />
                      <SelectValue 
                        placeholder={isLoadingDocuments ? "문서 목록을 불러오는 중..." : "문서를 선택하세요"} 
                      />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((document) => (
                      <SelectItem key={document.id} value={document.id} className="py-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-gray-900">{document.name}</div>
                          <div className="text-xs text-gray-500">{document.datasetName}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 중복검사 로딩 */}
              {isCheckingDuplicate && selectedDocumentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="text-sm text-blue-800">선택한 문서의 중복검사를 진행 중입니다...</div>
                  </div>
                </div>
              )}

              {/* 중복검사 결과 */}
              {duplicateCheckResult && selectedDocumentId && !isCheckingDuplicate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-900 mb-1">중복검사 완료</h3>
                      <div className="text-xs text-green-700 space-y-1">
                        <div>이 문서의 기존 {segmentType === 'faq' ? 'Row ID' : '조번호'}: {duplicateCheckResult.existingIds.length}개</div>
                        {duplicateCheckResult.suggestedId && (
                          <div className="font-medium">💡 제안 ID: {duplicateCheckResult.suggestedId}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 중복 경고 */}
              {duplicateWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">{duplicateWarning}</div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* 3단계: 내용 입력 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">3</div>
                <h2 className="text-lg font-semibold text-gray-900">내용을 입력해주세요</h2>
              </div>

              {/* 인사규정 폼 */}
              {segmentType === 'regulation' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">문서명</Label>
                      <Input
                        value={regulationData.documentName}
                        onChange={(e) => setRegulationData(prev => ({ ...prev, documentName: e.target.value }))}
                        placeholder="예: 인사규정"
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">장번호</Label>
                      <Input
                        value={regulationData.chapterNumber}
                        onChange={(e) => setRegulationData(prev => ({ ...prev, chapterNumber: e.target.value }))}
                        placeholder="예: 제3장"
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">장제목</Label>
                    <Input
                      value={regulationData.chapterTitle}
                      onChange={(e) => setRegulationData(prev => ({ ...prev, chapterTitle: e.target.value }))}
                      placeholder="예: 복무"
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">조번호 *</Label>
                      <Input
                        value={regulationData.articleNumber}
                        onChange={(e) => setRegulationData(prev => ({ ...prev, articleNumber: e.target.value }))}
                        placeholder="예: 제62조"
                        className={`h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          checkCurrentIdDuplicate(regulationData.articleNumber) ? 'border-amber-400 bg-amber-50' : ''
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">조제목</Label>
                      <Input
                        value={regulationData.articleTitle}
                        onChange={(e) => setRegulationData(prev => ({ ...prev, articleTitle: e.target.value }))}
                        placeholder="예: 선택적 복리후생제도"
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">내용 *</Label>
                    <Textarea
                      value={regulationData.content}
                      onChange={(e) => setRegulationData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="규정의 구체적인 내용을 자세히 입력해주세요"
                      className="min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* FAQ 폼 */}
              {segmentType === 'faq' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Row ID *</Label>
                      <Input
                        value={faqData.rowId}
                        onChange={(e) => setFaqData(prev => ({ ...prev, rowId: e.target.value }))}
                        placeholder="예: FAQ_025"
                        className={`h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          checkCurrentIdDuplicate(faqData.rowId) ? 'border-amber-400 bg-amber-50' : ''
                        }`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">주제 *</Label>
                      <Input
                        value={faqData.topic}
                        onChange={(e) => setFaqData(prev => ({ ...prev, topic: e.target.value }))}
                        placeholder="예: 의료비"
                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">질문 *</Label>
                    <Textarea
                      value={faqData.question}
                      onChange={(e) => setFaqData(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="자주 묻는 질문을 입력해주세요"
                      className="min-h-[80px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">답변 *</Label>
                    <Textarea
                      value={faqData.answer}
                      onChange={(e) => setFaqData(prev => ({ ...prev, answer: e.target.value }))}
                      placeholder="질문에 대한 상세한 답변을 입력해주세요"
                      className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 미리보기 */}
            {convertToOriginalFormat() && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">변환 결과 미리보기</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-mono text-gray-600 leading-relaxed break-all">
                      {convertToOriginalFormat()}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 h-11 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가하는 중...
                </>
              ) : (
                <>
                  추가하기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 