// 세그먼트 콘텐츠 파싱 유틸리티

export interface ParsedRegulationSegment {
  type: 'regulation'
  documentName?: string
  chapter?: {
    number: string
    title: string
  }
  article?: {
    number: string
    title: string
  }
  content: string
  originalContent: string
}

export interface ParsedFaqSegment {
  type: 'faq'
  rowId: string
  topic: string
  question: string
  answer: string
  originalContent: string
}

export interface ParsedNoticeSegment {
  type: 'notice'
  rowId: string
  title: string
  documentType: string
  createdDate: string
  content: string
  originalContent: string
}

export type ParsedSegment = ParsedRegulationSegment | ParsedFaqSegment | ParsedNoticeSegment

/**
 * 인사규정 형식의 콘텐츠를 파싱합니다
 * 형식: "문서명: 인사규정;장번호: 제3장;장제목: 복무;조번호: 제62조;조제목: 선택적 복리후생제도;내용: ..."
 */
function parseRegulationContent(content: string): ParsedRegulationSegment | null {
  // 세미콜론으로 구분된 필드들을 파싱
  const fields = content.split(';').reduce((acc, field) => {
    const [key, ...valueParts] = field.split(':')
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join(':').trim()
    }
    return acc
  }, {} as Record<string, string>)

  // 필수 필드 확인
  if (!fields['내용']) {
    return null
  }

  return {
    type: 'regulation',
    documentName: fields['문서명'],
    chapter: fields['장번호'] && fields['장제목'] ? {
      number: fields['장번호'],
      title: fields['장제목']
    } : undefined,
    article: fields['조번호'] && fields['조제목'] ? {
      number: fields['조번호'],  
      title: fields['조제목']
    } : undefined,
    content: fields['내용'],
    originalContent: content
  }
}

/**
 * FAQ 형식의 콘텐츠를 파싱합니다
 * 형식: "row_id: FAQ_025;주제: 의료비;질문: 아토피 치료도 지원되나요?;답변: 아토피는 지원 의료비 지원 항목입니다."
 */
function parseFaqContent(content: string): ParsedFaqSegment | null {
  // 세미콜론으로 구분된 필드들을 파싱
  const fields = content.split(';').reduce((acc, field) => {
    const [key, ...valueParts] = field.split(':')
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join(':').trim()
    }
    return acc
  }, {} as Record<string, string>)

  // 필수 필드 확인
  if (!fields['row_id'] || !fields['주제'] || !fields['질문'] || !fields['답변']) {
    return null
  }

  return {
    type: 'faq',
    rowId: fields['row_id'],
    topic: fields['주제'],
    question: fields['질문'],
    answer: fields['답변'],
    originalContent: content
  }
}

/**
 * 공지사항 형식의 콘텐츠를 파싱합니다
 * 형식: "row_id: NOTICE_07;제목: 2025년 LNG 기술 교육(가스터빈 기초) 수강 안내;문서유형: 교육;작성일: 2025-03-19;전체텍스트: ..."
 */
function parseNoticeContent(content: string): ParsedNoticeSegment | null {
  // 세미콜론으로 구분된 필드들을 파싱
  const fields = content.split(';').reduce((acc, field) => {
    const [key, ...valueParts] = field.split(':')
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join(':').trim()
    }
    return acc
  }, {} as Record<string, string>)

  // 필수 필드 확인
  if (!fields['row_id'] || !fields['제목'] || !fields['문서유형'] || !fields['작성일'] || !fields['전체텍스트']) {
    return null
  }

  return {
    type: 'notice',
    rowId: fields['row_id'],
    title: fields['제목'],
    documentType: fields['문서유형'],
    createdDate: fields['작성일'],
    content: fields['전체텍스트'],
    originalContent: content
  }
}

/**
 * 세그먼트 콘텐츠를 자동으로 감지하고 파싱합니다
 */
export function parseSegmentContent(content: string): ParsedSegment | null {
  if (!content?.trim()) {
    return null
  }

  // 공지사항 형식 감지 (NOTICE로 시작하는 row_id와 제목 필드)
  if (content.includes('row_id:') && content.includes('제목:') && content.includes('문서유형:') && content.includes('작성일:')) {
    return parseNoticeContent(content)
  }

  // FAQ 형식 감지 (row_id로 시작하지만 공지사항이 아닌 경우)
  if (content.includes('row_id:')) {
    return parseFaqContent(content)
  }

  // 인사규정 형식 감지 (문서명, 장번호, 조번호 등의 패턴)
  if (content.includes('문서명:') || content.includes('장번호:') || content.includes('조번호:')) {
    return parseRegulationContent(content)
  }

  // 파싱할 수 없는 경우 null 반환
  return null
}
