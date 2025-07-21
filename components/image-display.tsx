import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { ImageDisplayProps } from "@/lib/types";

export function ImageDisplay({
  imageData,
  isLoading,
  error,
}: ImageDisplayProps) {
  const handleDownload = async () => {
    if (!imageData?.url) return;
    
    try {
      const response = await fetch(imageData.url);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${Date.now()}.${imageData.content_type.split("/")[1] || "png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" className="mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Generating image...</p>
                <p className="text-xs text-muted-foreground">This may take a few moments</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <ErrorMessage error={error} />
            
            {/* Enhanced error state with helpful information */}
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="text-center space-y-3">
                <div className="text-destructive text-sm font-medium">
                  Image Generation Failed
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Common solutions:</p>
                  <ul className="text-left space-y-1 max-w-xs mx-auto">
                    <li>• Try a different prompt</li>
                    <li>• Check your internet connection</li>
                    <li>• Wait a moment and try again</li>
                    <li>• Ensure prompt is appropriate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {imageData && !isLoading && !error && (
          <div className="space-y-4">
            {/* Enhanced responsive image display with proper aspect ratio preservation */}
            <div className="relative overflow-hidden rounded-lg border bg-muted/10 group">
              <div 
                className="relative w-full min-h-[200px] max-h-[400px] sm:max-h-[500px] lg:max-h-[600px]" 
                style={{ 
                  aspectRatio: `${imageData.width}/${imageData.height}`
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageData.url}
                  alt="Generated image"
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                  }}
                />
              </div>
              
              {/* Enhanced image overlay with metadata - responsive for mobile */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-end opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                <div className="w-full p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="text-white text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Dimensions: {imageData.width} × {imageData.height}</span>
                      <span>Format: {imageData.content_type.split('/')[1]?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile-friendly tap indicator */}
              <div className="absolute top-2 right-2 md:hidden">
                <div className="bg-black/20 backdrop-blur-sm rounded-full p-1">
                  <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Enhanced metadata display with more information - standardized with svg-converter */}
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Size:</span>
                  <span>{imageData.width} × {imageData.height} pixels</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Format:</span>
                  <span className="uppercase">{imageData.content_type.split('/')[1] || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Aspect Ratio:</span>
                  <span>{(imageData.width / imageData.height).toFixed(2)}:1</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleDownload}
                className="w-full flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary hover:text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                Download Image
              </Button>
            </div>
          </div>
        )}

        {!imageData && !isLoading && !error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Enter a prompt and click &ldquo;Generate Image&rdquo; to get
              started
            </p>
          </div>
        )}


    </div>
  );
}
