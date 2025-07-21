// Core data models for the image generation application

// Generated image data model
export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

// SVG conversion result model
export interface SVGResult {
  url: string;
  content_type: string;
}

// Error state model
export interface ErrorState {
  type: 'network' | 'validation' | 'service' | 'rate_limit';
  message: string;
  retryable: boolean;
}

// Application state model
export interface AppState {
  prompt: string;
  generatedImage: GeneratedImage | null;
  svgResult: SVGResult | null;
  isGenerating: boolean;
  isConverting: boolean;
  generationError: string | null;
  conversionError: string | null;
  generationLogs: string[];
  conversionLogs: string[];
}

// API parameter models
export interface ImageGenerationParams {
  prompt: string;
  guidance_scale?: number;
  num_images?: number;
  output_format?: "jpeg" | "png";
  aspect_ratio?: "16:9" | "21:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21";
}

export interface SVGConversionParams {
  image_url: string;
}

// API response models
export interface FalResponse<T> {
  data: T;
  requestId: string;
}


// Component prop interfaces

// PromptInput component props
export interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isConverting?: boolean;
}

// ImageDisplay component props
export interface ImageDisplayProps {
  imageData: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
}

// SVGConverter component props
export interface SVGConverterProps {
  imageUrl: string | null;
  svgResult: SVGResult | null;
  onConvert: () => void;
  isConverting: boolean;
  isGenerating?: boolean;
  error: string | null;
}

// LoadingSpinner component props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ErrorMessage component props
export interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  retryable?: boolean;
}

// ProgressLogs component props
export interface ProgressLogsProps {
  logs: string[];
  title: string;
  isActive: boolean;
  className?: string;
}// fal.ai client integration types

// fal.ai FLUX Pro API response
export interface FluxProResponse {
  images: GeneratedImage[];
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

// fal.ai vectorization API response
export interface VectorizationResponse {
  image: SVGResult;
}



// Service function return types
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ErrorState;
}

// Image generation service result
export type ImageGenerationResult = ServiceResult<GeneratedImage>;

// SVG conversion service result
export type SVGConversionResult = ServiceResult<SVGResult>;