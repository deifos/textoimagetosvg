import { fal } from "@fal-ai/client";
import type { QueueStatus, RequestLog } from "@fal-ai/client";
import {
  ImageGenerationParams,
  SVGConversionParams,
  ImageGenerationResult,
  SVGConversionResult,
  ErrorState,
  FluxProResponse,
  VectorizationResponse,
} from "./types";

// Configure fal.ai client to use the existing proxy endpoint
fal.config({
  proxyUrl: "/api/proxy",
});

// Progress callback type for queue updates
export type ProgressCallback = (logs: string[]) => void;

/**
 * Converts fal.ai API errors to user-friendly error states
 */
function handleFalError(error: unknown): ErrorState {
  console.error("fal.ai API error:", error);

  const errorObj = error as {
    message?: string;
    code?: string;
    status?: number;
  };

  if (errorObj.message?.includes("rate limit")) {
    return {
      type: "rate_limit",
      message: "Too many requests. Please wait a moment and try again.",
      retryable: true,
    };
  }

  if (
    errorObj.message?.includes("network") ||
    errorObj.code === "NETWORK_ERROR"
  ) {
    return {
      type: "network",
      message:
        "Network connection error. Please check your connection and try again.",
      retryable: true,
    };
  }

  if (errorObj.message?.includes("validation") || errorObj.status === 400) {
    return {
      type: "validation",
      message:
        "Invalid input parameters. Please check your prompt and try again.",
      retryable: false,
    };
  }

  return {
    type: "service",
    message:
      errorObj.message || "An unexpected error occurred. Please try again.",
    retryable: true,
  };
}

/**
 * Processes queue update logs and converts them to string array with timestamps
 */
function processQueueLogs(logs: RequestLog[]): string[] {
  return logs.map((log) => {
    const timestamp = new Date().toLocaleTimeString();
    return `[${timestamp}] [${log.level}] ${log.message}`;
  });
}

/**
 * Processes queue status updates and provides comprehensive progress information
 */
function processQueueStatus(update: QueueStatus, onProgress?: ProgressCallback): void {
  if (!onProgress) return;

  const timestamp = new Date().toLocaleTimeString();
  let statusLogs: string[] = [];

  if (update.status === "IN_QUEUE") {
    statusLogs.push(`[${timestamp}] [INFO] Request queued for processing`);
    if (update.queue_position !== undefined) {
      statusLogs.push(`[${timestamp}] [INFO] Queue position: ${update.queue_position}`);
    }
  } else if (update.status === "IN_PROGRESS") {
    statusLogs.push(`[${timestamp}] [INFO] Processing started`);
    if ("logs" in update && update.logs) {
      statusLogs = statusLogs.concat(processQueueLogs(update.logs));
    }
  } else if (update.status === "COMPLETED") {
    statusLogs.push(`[${timestamp}] [SUCCESS] Processing completed successfully`);
  }

  if (statusLogs.length > 0) {
    onProgress(statusLogs);
  }
}

/**
 * Generates an image using fal.ai FLUX kontext model
 */
export async function generateImage(
  params: ImageGenerationParams,
  onProgress?: ProgressCallback
): Promise<ImageGenerationResult> {
  try {
    // Add the style reference to the prompt as specified in requirements
    const enhancedPrompt = `${params.prompt} in this style`;

    const requestParams = {
      prompt: enhancedPrompt,
      guidance_scale: params.guidance_scale || 3.5,
      num_images: params.num_images || 1,
      output_format: (params.output_format as "jpeg" | "png") || "jpeg",
      aspect_ratio:
        (params.aspect_ratio as
          | "16:9"
          | "21:9"
          | "4:3"
          | "3:2"
          | "1:1"
          | "2:3"
          | "3:4"
          | "9:16"
          | "9:21") || "16:9",
      // Add the reference image URL from requirements
      image_url:
        "https://v3.fal.media/files/zebra/azeGR36A-TbLKKajVnhp__man-presenting.jpg",
    };

    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: requestParams,
      logs: true,
      onQueueUpdate: (update: QueueStatus) => {
        processQueueStatus(update, onProgress);
      },
    });

    const response = result.data as FluxProResponse;

    if (!response.images || response.images.length === 0) {
      return {
        success: false,
        error: {
          type: "service",
          message: "No images were generated. Please try again.",
          retryable: true,
        },
      };
    }

    return {
      success: true,
      data: response.images[0],
    };
  } catch (error) {
    return {
      success: false,
      error: handleFalError(error),
    };
  }
}

/**
 * Converts an image to SVG using fal.ai vectorization service
 */
export async function convertToSVG(
  params: SVGConversionParams,
  onProgress?: ProgressCallback
): Promise<SVGConversionResult> {
  try {
    const result = await fal.subscribe("fal-ai/recraft/vectorize", {
      input: {
        image_url: params.image_url,
      },
      logs: true,
      onQueueUpdate: (update: QueueStatus) => {
        processQueueStatus(update, onProgress);
      },
    });

    const response = result.data as VectorizationResponse;

    if (!response.image) {
      return {
        success: false,
        error: {
          type: "service",
          message: "SVG conversion failed. Please try again.",
          retryable: true,
        },
      };
    }

    return {
      success: true,
      data: response.image,
    };
  } catch (error) {
    console.error("SVG conversion error:", error);
    return {
      success: false,
      error: handleFalError(error),
    };
  }
}
