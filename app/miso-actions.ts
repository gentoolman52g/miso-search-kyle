"use server"

import { runMisoWorkflow } from "@/lib/miso/workflow-client"
import { fetchSegmentDetails } from "@/lib/miso/knowledge-client"
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
