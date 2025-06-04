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

  // Ensure KNOWLEDGE_API_ENDPOINT does not end with a slash and path does not start with one, or handle appropriately.
  // Assuming KNOWLEDGE_API_ENDPOINT is like "https://your-api.com" and path is like "/ext/v1/..."
  const url = `${KNOWLEDGE_API_ENDPOINT.replace(/\/$/, "")}${path}`

  const headers = {
    Authorization: `Bearer ${KNOWLEDGE_API_KEY}`,
    "Content-Type": "application/json", // Usually for POST/PUT, but often sent for GET too
    Accept: "application/json", // Explicitly request JSON response
    ...options.headers,
  }

  console.log(`Calling MISO Knowledge API: ${options.method || "GET"} ${url}`)

  const response = await fetch(url, { ...options, headers })
  const responseText = await response.text() // Get raw text first for debugging

  if (!response.ok) {
    console.error(`MISO Knowledge API Error (${response.status}) for ${url}. Response Text: ${responseText}`)
    throw new Error(
      `Knowledge API request failed: ${response.status} ${response.statusText}. Check server logs for response body.`,
    )
  }

  if (response.status === 204 && !responseText) {
    // Handle No Content
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
      `Knowledge API returned non-JSON response. Check if the endpoint is correct or if the API is down. Response starts with: ${responseText.substring(0, 200)}`,
    )
  }
}

/**
 * Fetches all documents within a given dataset.
 */
async function getDocumentsInDataset(datasetId: string): Promise<MisoKnowledgeDocListItem[]> {
  const response = await fetchFromKnowledgeApi<MisoKnowledgeDocListResponse>(`/datasets/${datasetId}/docs`)
  return response.data || []
}

/**
 * Fetches all segments for a given document within a dataset.
 */
async function getSegmentsInDocument(datasetId: string, documentId: string): Promise<MisoKnowledgeSegmentDetail[]> {
  const response = await fetchFromKnowledgeApi<MisoKnowledgeDocSegmentsResponse>(
    `/ext/v1/datasets/${datasetId}/docs/${documentId}/segments`,
  )
  return response.data || []
}

export async function fetchSegmentDetails(
  datasetIds: string[],
  targetSegmentIds: string[],
): Promise<KnowledgeSegment[]> {
  const fetchedSegments: KnowledgeSegment[] = []
  const retrievedSegmentIds = new Set<string>()

  for (const datasetId of datasetIds) {
    if (retrievedSegmentIds.size === targetSegmentIds.length && targetSegmentIds.length > 0) break // Optimization

    console.log(`Fetching documents for Dataset ID: ${datasetId}`)
    const documents = await getDocumentsInDataset(datasetId)
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
  // Re-order segments to match the order from targetSegmentIds (workflow output)
  const orderedSegments = targetSegmentIds
    .map((id) => fetchedSegments.find((s) => s.id === id))
    .filter((s) => s !== undefined) as KnowledgeSegment[]

  return orderedSegments
}
