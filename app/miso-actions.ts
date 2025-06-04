"use server"

import { runMisoWorkflow } from "@/lib/miso/workflow-client"
import { fetchSegmentDetails, fetchRandomSegments, addSegmentToDocument, getDatasetList, getDocumentList, checkDuplicateIds, getAllDocuments, checkDuplicateIdsInAllDatasets, updateSegmentInDocument } from "@/lib/miso/knowledge-client"
import type { KnowledgeSegment } from "@/lib/miso/types"

const MISO_KNOWLEDGE_DATASET_IDS_STRING = process.env.MISO_KNOWLEDGE_DATASET_IDS

export async function searchMisoKnowledge(query: string): Promise<{ data?: KnowledgeSegment[]; error?: string }> {
  if (!MISO_KNOWLEDGE_DATASET_IDS_STRING) {
    return { error: "MISO Knowledge Dataset IDs are not configured in environment variables." }
  }

  const datasetIds = MISO_KNOWLEDGE_DATASET_IDS_STRING.split(",")
    .map((id) => id.trim())
    .filter((id) => id)

  if (datasetIds.length === 0) {
    return { error: "No valid MISO Knowledge Dataset IDs found in configuration." }
  }

  try {
    // Step 1: Call MISO Workflow API to get segment IDs
    console.log(`Initiating workflow for query: "${query}"`)
    const workflowResponse = await runMisoWorkflow(query)
    console.log("Workflow response received:", JSON.stringify(workflowResponse, null, 2))

    // Correctly access the nested result field
    const workflowResultString = workflowResponse.data?.outputs?.result

    if (!workflowResultString) {
      console.error("Workflow API response missing 'data.outputs.result' field or result is empty:", workflowResponse)
      return {
        error:
          "Failed to get segment IDs from workflow. The response format might be unexpected or the result was empty.",
      }
    }

    let segmentIdsFromWorkflow: string[]
    try {
      // The result is a JSON string array, e.g., "[\"id1\", \"id2\"]"
      segmentIdsFromWorkflow = JSON.parse(workflowResultString)
      if (!Array.isArray(segmentIdsFromWorkflow) || !segmentIdsFromWorkflow.every((id) => typeof id === "string")) {
        throw new Error("Parsed workflow result is not an array of strings.")
      }
    } catch (e: any) {
      console.error("Failed to parse segment IDs from workflow result string:", workflowResultString, e)
      return {
        error: `Failed to parse segment IDs from workflow: ${e.message}. Raw result string: ${workflowResultString}`,
      }
    }

    console.log(`Segment IDs from workflow: ${segmentIdsFromWorkflow.join(", ")}`)

    if (segmentIdsFromWorkflow.length === 0) {
      console.log("Workflow returned no segment IDs.")
      return { data: [] } // No segments found by workflow, return empty results
    }

    // Step 2: Fetch details for these segments from MISO Knowledge API
    console.log(
      `Fetching details for ${segmentIdsFromWorkflow.length} segments across datasets: ${datasetIds.join(", ")}`,
    )
    const segments = await fetchSegmentDetails(datasetIds, segmentIdsFromWorkflow)
    console.log(`Successfully fetched ${segments.length} segment details.`)

    return { data: segments }
  } catch (error: any) {
    console.error("Error in searchMisoKnowledge action:", error)
    // Provide a more user-friendly error message, but log the detailed one.
    let userErrorMessage = "An unexpected error occurred while searching knowledge."
    if (
      error.message.includes("Workflow API is not configured") ||
      error.message.includes("Knowledge API is not configured")
    ) {
      userErrorMessage = "API service is not configured correctly. Please contact support."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "Could not connect to the MISO API service. Please try again later."
    }
    // Avoid exposing too many internal details from error.message directly to client if it's sensitive.
    return { error: userErrorMessage }
  }
}

export async function fetchInitialKnowledgeData(limit: number = 50, offset: number = 0): Promise<{ data?: KnowledgeSegment[]; error?: string; hasMore?: boolean }> {
  if (!MISO_KNOWLEDGE_DATASET_IDS_STRING) {
    return { error: "MISO Knowledge Dataset IDs are not configured in environment variables." }
  }

  const datasetIds = MISO_KNOWLEDGE_DATASET_IDS_STRING.split(",")
    .map((id) => id.trim())
    .filter((id) => id)

  if (datasetIds.length === 0) {
    return { error: "No valid MISO Knowledge Dataset IDs found in configuration." }
  }

  try {
    console.log(`Fetching initial knowledge data (limit: ${limit}, offset: ${offset}) from datasets: ${datasetIds.join(", ")}`)
    const result = await fetchRandomSegments(datasetIds, limit, offset)
    console.log(`Successfully fetched ${result.segments.length} initial segments. Has more: ${result.hasMore}`)
    return { 
      data: result.segments, 
      hasMore: result.hasMore 
    }
  } catch (error: any) {
    console.error("Error in fetchInitialKnowledgeData action:", error)
    let userErrorMessage = "초기 지식 데이터를 불러오는 중 문제가 발생했습니다."
    if (
      error.message.includes("Knowledge API is not configured")
    ) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function addKnowledgeSegment(
  datasetId: string, 
  documentId: string, 
  content: string, 
  answer?: string, 
  keywords?: string[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const result = await addSegmentToDocument(datasetId, documentId, content, answer, keywords)
    return { success: true }
  } catch (error: any) {
    console.error('Error adding knowledge segment:', error)
    let userErrorMessage = "세그먼트 추가 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function updateKnowledgeSegment(
  datasetId: string, 
  documentId: string,
  segmentId: string,
  content: string, 
  answer?: string, 
  keywords?: string[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const result = await updateSegmentInDocument(datasetId, documentId, segmentId, content, answer, keywords)
    return { success: true }
  } catch (error: any) {
    console.error('Error updating knowledge segment:', error)
    let userErrorMessage = "세그먼트 수정 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function fetchDatasetList(): Promise<{ data?: Array<{id: string, name: string}>; error?: string }> {
  if (!MISO_KNOWLEDGE_DATASET_IDS_STRING) {
    return { error: "MISO Knowledge Dataset IDs are not configured in environment variables." }
  }

  const datasetIds = MISO_KNOWLEDGE_DATASET_IDS_STRING.split(",")
    .map((id) => id.trim())
    .filter((id) => id)

  if (datasetIds.length === 0) {
    return { error: "No valid MISO Knowledge Dataset IDs found in configuration." }
  }

  try {
    const datasets = await getDatasetList(datasetIds)
    return { data: datasets }
  } catch (error: any) {
    console.error('Error fetching dataset list:', error)
    let userErrorMessage = "데이터셋 목록을 불러오는 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function fetchDocumentList(datasetId: string): Promise<{ data?: Array<{id: string, name: string}>; error?: string }> {
  try {
    const documents = await getDocumentList(datasetId)
    return { data: documents }
  } catch (error: any) {
    console.error('Error fetching document list:', error)
    let userErrorMessage = "문서 목록을 불러오는 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function fetchAllDocuments(): Promise<{ data?: Array<{id: string, name: string, datasetId: string, datasetName: string}>; error?: string }> {
  if (!MISO_KNOWLEDGE_DATASET_IDS_STRING) {
    return { error: "MISO Knowledge Dataset IDs are not configured in environment variables." }
  }

  const datasetIds = MISO_KNOWLEDGE_DATASET_IDS_STRING.split(",")
    .map((id) => id.trim())
    .filter((id) => id)

  if (datasetIds.length === 0) {
    return { error: "No valid MISO Knowledge Dataset IDs found in configuration." }
  }

  try {
    const documents = await getAllDocuments(datasetIds)
    return { data: documents }
  } catch (error: any) {
    console.error('Error fetching all documents:', error)
    let userErrorMessage = "문서 목록을 불러오는 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function checkSegmentDuplicates(
  datasetId: string, 
  documentId: string, 
  type: 'regulation' | 'faq'
): Promise<{ 
  data?: { existingIds: string[], lastId?: string, suggestedId?: string }; 
  error?: string 
}> {
  try {
    const result = await checkDuplicateIds(datasetId, documentId, type)
    return { data: result }
  } catch (error: any) {
    console.error('Error checking duplicates:', error)
    let userErrorMessage = "중복검사 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function checkSegmentDuplicatesInAllDatasets(
  type: 'regulation' | 'faq'
): Promise<{ 
  data?: { existingIds: string[], lastId?: string, suggestedId?: string }; 
  error?: string 
}> {
  if (!MISO_KNOWLEDGE_DATASET_IDS_STRING) {
    return { error: "MISO Knowledge Dataset IDs are not configured in environment variables." }
  }

  const datasetIds = MISO_KNOWLEDGE_DATASET_IDS_STRING.split(",")
    .map((id) => id.trim())
    .filter((id) => id)

  if (datasetIds.length === 0) {
    return { error: "No valid MISO Knowledge Dataset IDs found in configuration." }
  }

  try {
    const result = await checkDuplicateIdsInAllDatasets(datasetIds, type)
    return { data: result }
  } catch (error: any) {
    console.error('Error checking duplicates in all datasets:', error)
    let userErrorMessage = "중복검사 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}

export async function fetchSegmentsByDocument(
  documentId: string, 
  datasetId: string
): Promise<{ data?: KnowledgeSegment[]; error?: string }> {
  try {
    // 먼저 해당 문서가 속한 데이터셋에서 모든 세그먼트를 가져옴
    const segments = await fetchRandomSegments([datasetId], 1000, 0) // 충분히 큰 수로 모든 세그먼트 가져오기
    
    // 해당 문서의 세그먼트만 필터링
    const documentSegments = segments.segments.filter(segment => segment.documentId === documentId)
    
    console.log(`Found ${documentSegments.length} segments for document ${documentId}`)
    return { data: documentSegments }
  } catch (error: any) {
    console.error('Error fetching segments by document:', error)
    let userErrorMessage = "문서별 세그먼트를 불러오는 중 문제가 발생했습니다."
    if (error.message.includes("Knowledge API is not configured")) {
      userErrorMessage = "API 서비스가 올바르게 구성되지 않았습니다. 지원팀에 문의하세요."
    } else if (error.message.includes("API request failed")) {
      userErrorMessage = "MISO API 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
    }
    return { error: userErrorMessage }
  }
}
