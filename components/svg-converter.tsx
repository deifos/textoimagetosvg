import {
  Download,
  FileImage,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { SVGConverterProps } from "@/lib/types";
import { useCallback, useState, useRef, useEffect } from "react";

export function SVGConverter({
  imageUrl,
  svgResult,
  onConvert,
  isConverting,
  isGenerating,
  error,
}: SVGConverterProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const convertAttemptedRef = useRef(false);
  const downloadAttemptedRef = useRef(false);

  // Reset attempt flags when operations complete
  useEffect(() => {
    if (!isConverting) {
      convertAttemptedRef.current = false;
    }
    if (!isDownloading) {
      downloadAttemptedRef.current = false;
    }
  }, [isConverting, isDownloading]);

  // Enhanced convert handler with duplicate request prevention
  const handleConvert = useCallback(() => {
    // Prevent duplicate conversion attempts
    if (convertAttemptedRef.current) {
      return;
    }

    // Validate conditions for conversion
    if (!imageUrl || isConverting || isGenerating) {
      return;
    }

    // Mark conversion as attempted
    convertAttemptedRef.current = true;
    onConvert();
  }, [imageUrl, isConverting, isGenerating, onConvert]);

  // Enhanced download handler with duplicate prevention
  const handleDownload = useCallback(async () => {
    // Prevent duplicate download attempts
    if (downloadAttemptedRef.current || isDownloading) {
      return;
    }

    if (!svgResult?.url) {
      return;
    }

    downloadAttemptedRef.current = true;
    setIsDownloading(true);

    try {
      const response = await fetch(svgResult.url);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `converted-image-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Reset attempt flag on error to allow retry
      downloadAttemptedRef.current = false;
    } finally {
      setIsDownloading(false);
    }
  }, [svgResult?.url, isDownloading]);

  // Enhanced button state logic
  const getConvertButtonState = useCallback(() => {
    // Button is disabled if:
    // 1. No image URL available
    // 2. Currently generating image
    // 3. Currently converting
    // 4. Convert has been attempted (prevents double-click)
    const isDisabled =
      !imageUrl || isGenerating || isConverting || convertAttemptedRef.current;

    // Determine button variant based on state
    let variant: "default" | "secondary" | "outline" = "default";
    if (svgResult && !error) {
      variant = "outline";
    } else if (isGenerating || isConverting) {
      variant = "secondary";
    }

    return { isDisabled, variant };
  }, [imageUrl, isGenerating, isConverting, svgResult, error]);

  // Enhanced convert button content with better visual feedback
  const getConvertButtonContent = useCallback(() => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Waiting for Image...
        </>
      );
    }

    if (isConverting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Converting to SVG...
        </>
      );
    }

    // if (svgResult && !error) {
    //   return (
    //     <>
    //       <RefreshCw className="mr-2 h-4 w-4" />
    //       Convert Again
    //     </>
    //   )
    // }

    return (
      <>
        <FileImage className="mr-2 h-4 w-4" />
        Convert to SVG
      </>
    );
  }, [isGenerating, isConverting, svgResult, error]);

  // Enhanced helper text with more detailed state information
  const getHelperText = useCallback(() => {
    if (isGenerating) {
      return "Waiting for image generation to complete...";
    }

    if (!imageUrl) {
      return "Generate an image first to enable SVG conversion";
    }

    if (isConverting) {
      return "Converting your image to SVG format...";
    }

    if (error) {
      return "Conversion failed. You can try again.";
    }

    if (!svgResult) {
      return "Click to convert the generated image to SVG format";
    }
  }, [isGenerating, imageUrl, isConverting, error, svgResult]);

  const { isDisabled: isConvertDisabled, variant: convertVariant } =
    getConvertButtonState();

  return (
    <div>
      {!svgResult && (
        <Button
          onClick={handleConvert}
          disabled={isConvertDisabled}
          variant={convertVariant}
          className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {getConvertButtonContent()}
        </Button>
      )}
      {/* Enhanced helper text with state-aware messaging */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>{getHelperText()}</p>
        {!imageUrl && !isGenerating && (
          <p className="text-amber-600">Generate an image first</p>
        )}
        {imageUrl && !isConverting && !svgResult && !error && (
          <p className="text-green-600">Ready to convert!</p>
        )}
      </div>

      {isConverting && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">
              Converting to SVG...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="space-y-4">
          <ErrorMessage error={error} />

          {/* Enhanced error state for SVG conversion */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="text-center space-y-3">
              <div className="text-destructive text-sm font-medium">
                SVG Conversion Failed
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Possible solutions:</p>
                <ul className="text-left space-y-1 max-w-xs mx-auto">
                  <li>• Try converting again</li>
                  <li>• Generate a new image first</li>
                  <li>• Check if image is valid</li>
                  <li>• Wait a moment and retry</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {svgResult && !isConverting && !error && (
        <div className="space-y-4">
          {/* Enhanced responsive SVG preview with better display */}
          <div className="relative overflow-hidden rounded-lg border bg-white group">
            <div className="relative w-full min-h-[200px] max-h-[400px] sm:max-h-[500px] lg:max-h-[600px]">
              {/* SVG preview with proper responsive scaling */}
              <div className="w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={svgResult.url}
                  alt="SVG Preview"
                  className="max-w-full max-h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.05]"
                  style={{
                    filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))",
                  }}
                  onError={(e) => {
                    console.error("SVG preview failed to load:", e);
                  }}
                />
              </div>
            </div>

            {/* Success indicator with animation */}
            <div className="absolute top-3 right-3">
              <div className="bg-green-100 rounded-full p-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>

            {/* SVG metadata overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="text-white text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span>Format: SVG Vector</span>
                  <span>Scalable: Yes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced download section with metadata */}
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Format:</span>
                <span className="uppercase">
                  {svgResult.content_type.split("/")[1] || "SVG"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <span>Vector Graphics</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Scalable:</span>
                <span className="text-green-600">Infinite Resolution</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading || downloadAttemptedRef.current}
              className="w-full flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary hover:text-primary-foreground"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading SVG...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download SVG
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!imageUrl && !isConverting && !error && !isGenerating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <FileImage className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm text-muted-foreground">
              Generate an image first to enable SVG conversion
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
