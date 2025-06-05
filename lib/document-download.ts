import type { KnowledgeSegment } from '@/lib/miso/types'

export interface SegmentData {
  id: string
  position: number
  content: string
  answer?: string | null
  keywords?: string[]
}

/**
 * 세그먼트들을 position 순으로 정렬하여 문서 내용을 재구성하는 함수
 */
export function reconstructDocument(segments: SegmentData[], options?: {
  includeMetadata?: boolean
  separateSegments?: boolean
  format?: 'text' | 'markdown'
}): string {
  const {
    includeMetadata = false,
    separateSegments = true,
    format = 'text'
  } = options || {}

  // position 순으로 정렬
  const sortedSegments = segments.sort((a, b) => a.position - b.position)

  let content = ''

  if (includeMetadata) {
    const now = new Date().toLocaleString('ko-KR')
    content += `# 문서 다운로드\n`
    content += `생성일시: ${now}\n`
    content += `전체 세그먼트 수: ${segments.length}\n\n`
    content += `---\n\n`
  }

  sortedSegments.forEach((segment, index) => {
    if (separateSegments && index > 0) {
      content += '\n@@@\n\n'
    }

    // 세그먼트 내용만 추가 (번호, 구분선, 키워드 제거)
    content += `${segment.content}\n`
    
    if (segment.answer) {
      content += `\n[요약/답변]\n${segment.answer}\n`
    }
  })

  return content
}

/**
 * 파일 다운로드를 실행하는 함수
 */
export function downloadDocument(content: string, filename: string, format: 'text' | 'markdown' = 'text') {
  const extension = format === 'markdown' ? 'md' : 'txt'
  const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain'
  
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // 메모리 정리
  URL.revokeObjectURL(url)
}

/**
 * KnowledgeSegment을 SegmentData로 변환하는 함수
 */
export function convertKnowledgeSegmentsToSegmentData(segments: KnowledgeSegment[]): SegmentData[] {
  return segments.map((segment, index) => ({
    id: segment.id,
    position: index + 1, // position이 없으므로 순서로 대체
    content: segment.content || '',
    answer: segment.answer,
    keywords: segment.keywords
  }))
} 