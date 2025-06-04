import type {
  MisoKnowledgeDocListItem,
  MisoKnowledgeDocListResponse,
  MisoKnowledgeDocSegmentsResponse,
  MisoKnowledgeSegmentDetail,
  KnowledgeSegment,
} from "./types"

const KNOWLEDGE_API_ENDPOINT = process.env.MISO_KNOWLEDGE_API_ENDPOINT
const KNOWLEDGE_API_KEY = process.env.MISO_KNOWLEDGE_API_KEY

async function fetchFromKnowledgeApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!KNOWLEDGE_API_ENDPOINT || !KNOWLEDGE_API_KEY) {
    console.error("MISO Knowledge API environment variables are not fully configured.")
    throw new Error("Knowledge API is not configured. Please check server logs.")
  }

  const url = `${KNOWLEDGE_API_ENDPOINT.replace(/\/$/, "")}${path}` // path should start with /ext/v1

  const headers = {
    Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  }

  console.log(`Calling MISO Knowledge API: ${options.method || "GET"} ${url}`)

  const response = await fetch(url, { ...options, headers })
  const responseText = await response.text()

  if (!response.ok) {
    console.error(`MISO Knowledge API Error (${response.status}) for ${url}. Response Text: ${responseText}`)
    throw new Error(
      `Knowledge API request failed: ${response.status} ${response.statusText}. Check server logs for response body. URL: ${url}`,
    )
  }

  if (response.status === 204 && !responseText) {
    console.log(`MISO Knowledge API: Received 204 No Content for ${url}`)
    return {} as T
  }

  try {
    const responseData = JSON.parse(responseText)
    console.log(`MISO Knowledge API Raw JSON Response for ${url}:`, responseData)
    return responseData as T
  } catch (e) {
    console.error(
      `MISO Knowledge API: Failed to parse JSON response for ${url}. Error: ${e}. Response Text: ${responseText}`,
    )
    throw new Error(
      `Knowledge API returned non-JSON response. Check if the endpoint is correct or if the API is down. URL: ${url}. Response starts with: ${responseText.substring(0, 200)}`,
    )
  }
}

/**
 * Fetches all documents within a given dataset.
 * Path should be /datasets/{datasetId}/docs
 */
async function getDocumentsInDataset(datasetId: string): Promise<MisoKnowledgeDocListItem[]> {
  // Remove /ext/v1/ from path since it's already in KNOWLEDGE_API_ENDPOINT
  const path = `/datasets/${datasetId}/docs`
  console.log(`Constructed path for getDocumentsInDataset: ${path}`)
  const response = await fetchFromKnowledgeApi<MisoKnowledgeDocListResponse>(path)
  return response.data || []
}

/**
 * Fetches all segments for a given document within a dataset.
 * Path should be /datasets/{datasetId}/docs/{documentId}/segments
 */
async function getSegmentsInDocument(datasetId: string, documentId: string): Promise<MisoKnowledgeSegmentDetail[]> {
  // Remove /ext/v1/ from path since it's already in KNOWLEDGE_API_ENDPOINT
  const path = `/datasets/${datasetId}/docs/${documentId}/segments`
  console.log(`Constructed path for getSegmentsInDocument: ${path}`)
  const response = await fetchFromKnowledgeApi<MisoKnowledgeDocSegmentsResponse>(path)
  return response.data || []
}

export async function fetchSegmentDetails(
  datasetIds: string[],
  targetSegmentIds: string[],
): Promise<KnowledgeSegment[]> {
  const fetchedSegments: KnowledgeSegment[] = []
  const retrievedSegmentIds = new Set<string>()

  for (const datasetId of datasetIds) {
    if (retrievedSegmentIds.size === targetSegmentIds.length && targetSegmentIds.length > 0) break

    console.log(`Fetching documents for Dataset ID: ${datasetId}`)
    const documents = await getDocumentsInDataset(datasetId) // This will now use the corrected path
    if (!documents || documents.length === 0) {
      console.log(`No documents found in dataset ${datasetId}`)
      continue
    }

    for (const doc of documents) {
      if (retrievedSegmentIds.size === targetSegmentIds.length && targetSegmentIds.length > 0) break

      console.log(`Fetching segments for Document ID: ${doc.id} in Dataset ${datasetId}`)
      const segmentsInDoc = await getSegmentsInDocument(datasetId, doc.id)

      for (const segmentDetail of segmentsInDoc) {
        if (targetSegmentIds.includes(segmentDetail.id) && !retrievedSegmentIds.has(segmentDetail.id)) {
          fetchedSegments.push({
            id: segmentDetail.id,
            documentId: segmentDetail.document_id,
            documentName: doc.name,
            content: segmentDetail.content,
            answer: segmentDetail.answer || undefined,
            keywords: segmentDetail.keywords || [],
          })
          retrievedSegmentIds.add(segmentDetail.id)
          if (retrievedSegmentIds.size === targetSegmentIds.length && targetSegmentIds.length > 0) break
        }
      }
    }
  }

  const orderedSegments = targetSegmentIds
    .map((id) => fetchedSegments.find((s) => s.id === id))
    .filter((s) => s !== undefined) as KnowledgeSegment[]

  return orderedSegments
}

/**
 * Fetches random segments from all datasets for initial display
 */
export async function fetchRandomSegments(
  datasetIds: string[],
  limit: number = 50,
  offset: number = 0,
): Promise<{ segments: KnowledgeSegment[]; hasMore: boolean }> {
  const allSegments: KnowledgeSegment[] = []
  const seenSegmentIds = new Set<string>()

  for (const datasetId of datasetIds) {
    console.log(`Fetching all documents for Dataset ID: ${datasetId}`)
    const documents = await getDocumentsInDataset(datasetId)
    if (!documents || documents.length === 0) {
      console.log(`No documents found in dataset ${datasetId}`)
      continue
    }

    for (const doc of documents) {
      console.log(`Fetching segments for Document ID: ${doc.id} in Dataset ${datasetId}`)
      const segmentsInDoc = await getSegmentsInDocument(datasetId, doc.id)

      for (const segmentDetail of segmentsInDoc) {
        // Only include segments that have content, are enabled, and not already included
        if (
          segmentDetail.enabled && 
          segmentDetail.status === "completed" && 
          segmentDetail.content?.trim() &&
          !seenSegmentIds.has(segmentDetail.id)
        ) {
          seenSegmentIds.add(segmentDetail.id)
          allSegments.push({
            id: segmentDetail.id,
            documentId: segmentDetail.document_id,
            documentName: doc.name,
            content: segmentDetail.content,
            answer: segmentDetail.answer || undefined,
            keywords: segmentDetail.keywords || [],
          })
        }
      }
    }
  }

  // 전체 데이터를 한 번만 셔플하고 일관성 있게 페이지네이션 적용
  // 시드를 고정하여 일관성 있는 결과를 보장하거나, 단순히 정렬 후 slice 사용
  const sortedSegments = allSegments.sort((a, b) => a.id.localeCompare(b.id))
  
  // Apply pagination
  const startIndex = offset
  const endIndex = offset + limit
  const paginatedSegments = sortedSegments.slice(startIndex, endIndex)
  const hasMore = endIndex < sortedSegments.length

  console.log(`Returning ${paginatedSegments.length} segments (${startIndex}-${endIndex}) out of ${sortedSegments.length} total. Has more: ${hasMore}`)

  return {
    segments: paginatedSegments,
    hasMore: hasMore
  }
}

/**
 * 문서에 세그먼트를 추가합니다
 */
export async function addSegmentToDocument(
  datasetId: string,
  documentId: string,
  content: string,
  answer?: string,
  keywords?: string[]
): Promise<any> {
  const path = `/datasets/${datasetId}/docs/${documentId}/segments`
  
  const requestBody = {
    segments: [
      {
        content,
        answer: answer || "",
        keywords: keywords || []
      }
    ]
  }
  
  console.log(`Adding segment to document ${documentId} in dataset ${datasetId}`)
  const response = await fetchFromKnowledgeApi(path, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })
  
  return response
}

/**
 * 문서의 세그먼트를 수정합니다
 */
export async function updateSegmentInDocument(
  datasetId: string,
  documentId: string,
  segmentId: string,
  content: string,
  answer?: string,
  keywords?: string[]
): Promise<any> {
  const path = `/datasets/${datasetId}/docs/${documentId}/segments/${segmentId}`
  
  const requestBody = {
    segment: {
      content,
      answer: answer || "",
      keywords: keywords || [],
      enabled: true
    }
  }
  
  console.log(`Updating segment ${segmentId} in document ${documentId} of dataset ${datasetId}`)
  const response = await fetchFromKnowledgeApi(path, {
    method: 'PUT',
    body: JSON.stringify(requestBody)
  })
  
  return response
}

/**
 * 환경변수에 설정된 데이터셋 목록을 가져옵니다
 */
export async function getDatasetList(datasetIds: string[]): Promise<Array<{id: string, name: string}>> {
  console.log(`Fetching details for configured datasets: ${datasetIds.join(", ")}`)
  
  const datasets: Array<{id: string, name: string}> = []
  
  for (const datasetId of datasetIds) {
    try {
      // 각 데이터셋의 상세 정보를 가져옵니다
      const path = `/datasets/${datasetId}`
      const response = await fetchFromKnowledgeApi<{
        id: string, 
        name: string, 
        description?: string,
        permission: string,
        data_source_type?: string,
        indexing_technique?: string,
        app_count: number,
        document_count: number,
        word_count: number,
        created_by: string,
        created_at: number,
        updated_by: string,
        updated_at: number
      }>(path)
      
      datasets.push({
        id: response.id,
        name: response.name
      })
    } catch (error) {
      console.error(`Error fetching dataset ${datasetId}:`, error)
      // 오류가 발생한 데이터셋은 ID만으로 표시
      datasets.push({
        id: datasetId,
        name: `Dataset ${datasetId} (오류)`
      })
    }
  }
  
  return datasets
}

/**
 * 특정 데이터셋의 문서 목록을 가져옵니다
 */
export async function getDocumentList(datasetId: string): Promise<Array<{id: string, name: string}>> {
  const documents = await getDocumentsInDataset(datasetId)
  return documents.map(doc => ({
    id: doc.id,
    name: doc.name
  }))
}

/**
 * 모든 데이터셋의 문서 목록을 가져옵니다
 */
export async function getAllDocuments(datasetIds: string[]): Promise<Array<{id: string, name: string, datasetId: string, datasetName: string}>> {
  const allDocuments: Array<{id: string, name: string, datasetId: string, datasetName: string}> = []
  
  for (const datasetId of datasetIds) {
    try {
      console.log(`Fetching documents for dataset: ${datasetId}`)
      const documents = await getDocumentsInDataset(datasetId)
      
      // 데이터셋 이름도 가져오기
      let datasetName = datasetId
      try {
        const datasetInfo = await fetchFromKnowledgeApi<{id: string, name: string}>(`/datasets/${datasetId}`)
        datasetName = datasetInfo.name
      } catch (error) {
        console.error(`Error fetching dataset ${datasetId} info:`, error)
      }
      
      for (const doc of documents) {
        allDocuments.push({
          id: doc.id,
          name: doc.name,
          datasetId: datasetId,
          datasetName: datasetName
        })
      }
    } catch (error) {
      console.error(`Error fetching documents for dataset ${datasetId}:`, error)
    }
  }
  
  return allDocuments
}

/**
 * 중복검사를 위해 기존 세그먼트들의 조번호나 row_id를 추출합니다
 */
export async function checkDuplicateIds(
  datasetId: string,
  documentId: string,
  type: 'regulation' | 'faq'
): Promise<{ 
  existingIds: string[], 
  lastId?: string,
  suggestedId?: string 
}> {
  console.log(`Checking duplicates for ${type} in document ${documentId}`)
  
  const segments = await getSegmentsInDocument(datasetId, documentId)
  const existingIds: string[] = []
  
  for (const segment of segments) {
    if (segment.content) {
      if (type === 'regulation') {
        // 조번호 추출: "조번호: 제62조" 형태에서 "제62조" 추출
        const match = segment.content.match(/조번호:\s*([^;]+)/i)
        if (match) {
          existingIds.push(match[1].trim())
        }
      } else if (type === 'faq') {
        // row_id 추출: "row_id: FAQ_025" 형태에서 "FAQ_025" 추출
        const match = segment.content.match(/row_id:\s*([^;]+)/i)
        if (match) {
          existingIds.push(match[1].trim())
        }
      }
    }
  }
  
  // 마지막 ID 찾기 및 다음 ID 제안
  let lastId: string | undefined
  let suggestedId: string | undefined
  
  if (type === 'faq' && existingIds.length > 0) {
    // FAQ_001, FAQ_002 형태의 ID에서 숫자 부분을 추출하여 정렬
    const numericIds = existingIds
      .filter(id => /^FAQ_\d+$/i.test(id))
      .map(id => {
        const match = id.match(/^FAQ_(\d+)$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .sort((a, b) => b - a) // 내림차순 정렬
    
    if (numericIds.length > 0) {
      const maxNumber = numericIds[0]
      lastId = `FAQ_${maxNumber.toString().padStart(3, '0')}`
      suggestedId = `FAQ_${(maxNumber + 1).toString().padStart(3, '0')}`
    }
  } else if (type === 'regulation' && existingIds.length > 0) {
    // 제1조, 제2조 형태에서 숫자 추출
    const numericIds = existingIds
      .filter(id => /^제\d+조$/i.test(id))
      .map(id => {
        const match = id.match(/^제(\d+)조$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .sort((a, b) => b - a) // 내림차순 정렬
    
    if (numericIds.length > 0) {
      const maxNumber = numericIds[0]
      lastId = `제${maxNumber}조`
      suggestedId = `제${maxNumber + 1}조`
    }
  }
  
  console.log(`Found ${existingIds.length} existing IDs, last: ${lastId}, suggested: ${suggestedId}`)
  
  return {
    existingIds,
    lastId,
    suggestedId
  }
}

/**
 * 모든 데이터셋에서 중복검사를 위해 기존 세그먼트들의 조번호나 row_id를 추출합니다
 */
export async function checkDuplicateIdsInAllDatasets(
  datasetIds: string[],
  type: 'regulation' | 'faq'
): Promise<{ 
  existingIds: string[], 
  lastId?: string,
  suggestedId?: string 
}> {
  console.log(`Checking duplicates for ${type} across all datasets`)
  
  const allExistingIds: string[] = []
  
  for (const datasetId of datasetIds) {
    try {
      const documents = await getDocumentsInDataset(datasetId)
      
      for (const doc of documents) {
        const segments = await getSegmentsInDocument(datasetId, doc.id)
        
        for (const segment of segments) {
          if (segment.content) {
            if (type === 'regulation') {
              // 조번호 추출: "조번호: 제62조" 형태에서 "제62조" 추출
              const match = segment.content.match(/조번호:\s*([^;]+)/i)
              if (match) {
                allExistingIds.push(match[1].trim())
              }
            } else if (type === 'faq') {
              // row_id 추출: "row_id: FAQ_025" 형태에서 "FAQ_025" 추출
              const match = segment.content.match(/row_id:\s*([^;]+)/i)
              if (match) {
                allExistingIds.push(match[1].trim())
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking duplicates in dataset ${datasetId}:`, error)
    }
  }
  
  // 중복 제거
  const uniqueIds = [...new Set(allExistingIds)]
  
  // 마지막 ID 찾기 및 다음 ID 제안
  let lastId: string | undefined
  let suggestedId: string | undefined
  
  if (type === 'faq' && uniqueIds.length > 0) {
    // FAQ_001, FAQ_002 형태의 ID에서 숫자 부분을 추출하여 정렬
    const numericIds = uniqueIds
      .filter(id => /^FAQ_\d+$/i.test(id))
      .map(id => {
        const match = id.match(/^FAQ_(\d+)$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .sort((a, b) => b - a) // 내림차순 정렬
    
    if (numericIds.length > 0) {
      const maxNumber = numericIds[0]
      lastId = `FAQ_${maxNumber.toString().padStart(3, '0')}`
      suggestedId = `FAQ_${(maxNumber + 1).toString().padStart(3, '0')}`
    }
  } else if (type === 'regulation' && uniqueIds.length > 0) {
    // 제1조, 제2조 형태에서 숫자 추출
    const numericIds = uniqueIds
      .filter(id => /^제\d+조$/i.test(id))
      .map(id => {
        const match = id.match(/^제(\d+)조$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .sort((a, b) => b - a) // 내림차순 정렬
    
    if (numericIds.length > 0) {
      const maxNumber = numericIds[0]
      lastId = `제${maxNumber}조`
      suggestedId = `제${maxNumber + 1}조`
    }
  }
  
  console.log(`Found ${uniqueIds.length} unique existing IDs across all datasets, last: ${lastId}, suggested: ${suggestedId}`)
  
  return {
    existingIds: uniqueIds,
    lastId,
    suggestedId
  }
}
