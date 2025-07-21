"use client";

import { useState, useCallback, useEffect } from "react";
import { PromptInput } from "@/components/prompt-input";
import { ImageDisplay } from "@/components/image-display";
import { SVGConverter } from "@/components/svg-converter";
import { Gallery } from "@/components/gallery";
import { generateImage, convertToSVG } from "@/lib/fal-service";
import { saveGalleryItem } from "@/lib/gallery-storage";
import type { AppState, GeneratedImage, SVGResult } from "@/lib/types";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export default function ImageGenerationApp() {
  // Comprehensive state management for the application
  const [state, setState] = useState<AppState>({
    prompt: "",
    generatedImage: null,
    svgResult: null,
    isGenerating: false,
    isConverting: false,
    generationError: null,
    conversionError: null,
    generationLogs: [],
    conversionLogs: [],
  });

  // Notification state for operation completion feedback
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({
    type: 'success',
    message: '',
    show: false
  });

  // Progress status state for overall operation tracking
  const [, setProgressStatus] = useState<{
    generation: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
    conversion: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  }>({
    generation: 'idle',
    conversion: 'idle'
  });

  // Gallery refresh trigger
  const [_galleryRefresh, setGalleryRefresh] = useState(0);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Show notification helper
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
  }, []);

  // Prompt handling
  const handlePromptChange = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      prompt,
      // Clear previous results when prompt changes
      generationError: null,
    }));
  }, []);

  // Enhanced image generation workflow with better state management and duplicate prevention
  const handleGenerate = useCallback(async () => {
    // Comprehensive validation to prevent duplicate requests
    const trimmedPrompt = state.prompt.trim();
    if (!trimmedPrompt || state.isGenerating || state.isConverting) {
      return;
    }

    // Additional validation for prompt length
    if (trimmedPrompt.length > 1000) {
      showNotification('error', 'Prompt is too long. Please keep it under 1000 characters.');
      return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationError: null,
      generatedImage: null,
      svgResult: null, // Clear SVG result when generating new image
      conversionError: null,
      generationLogs: [],
    }));

    setProgressStatus(prev => ({
      ...prev,
      generation: 'queued',
      conversion: 'idle' // Reset conversion status
    }));

    try {
      const result = await generateImage(
        { prompt: trimmedPrompt },
        (newLogs) => {
          setState(prev => ({
            ...prev,
            generationLogs: [...prev.generationLogs, ...newLogs],
          }));
          
          // Update progress status based on logs
          const latestLog = newLogs[newLogs.length - 1]?.toLowerCase() || '';
          if (latestLog.includes('processing started')) {
            setProgressStatus(prev => ({ ...prev, generation: 'processing' }));
          }
        }
      );

      if (result.success && result.data) {
        const generatedImage = result.data as GeneratedImage;
        setState(prev => ({
          ...prev,
          isGenerating: false,
          generatedImage,
          generationError: null,
        }));
        setProgressStatus(prev => ({ ...prev, generation: 'completed' }));
        
        // Save generated image to gallery
        try {
          saveGalleryItem({
            type: 'image',
            url: generatedImage.url,
            prompt: trimmedPrompt,
          });
          setGalleryRefresh(prev => prev + 1);
        } catch (error) {
          console.error('Error saving image to gallery:', error);
        }
        
        showNotification('success', 'Image generated successfully! You can now convert it to SVG.');
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          generationError: result.error?.message || "Failed to generate image",
        }));
        setProgressStatus(prev => ({ ...prev, generation: 'failed' }));
        showNotification('error', result.error?.message || "Failed to generate image");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during image generation";
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationError: errorMessage,
      }));
      setProgressStatus(prev => ({ ...prev, generation: 'failed' }));
      showNotification('error', errorMessage);
    }
  }, [state.prompt, state.isGenerating, state.isConverting, showNotification]);

  // Enhanced SVG conversion workflow with better state management and duplicate prevention
  const handleConvert = useCallback(async () => {
    // Comprehensive validation to prevent duplicate requests
    if (!state.generatedImage?.url || state.isConverting || state.isGenerating) {
      return;
    }

    setState(prev => ({
      ...prev,
      isConverting: true,
      conversionError: null,
      svgResult: null,
      conversionLogs: [],
    }));

    setProgressStatus(prev => ({
      ...prev,
      conversion: 'queued'
    }));

    try {
      const result = await convertToSVG(
        { image_url: state.generatedImage.url },
        (newLogs) => {
          setState(prev => ({
            ...prev,
            conversionLogs: [...prev.conversionLogs, ...newLogs],
          }));
          
          // Update progress status based on logs
          const latestLog = newLogs[newLogs.length - 1]?.toLowerCase() || '';
          if (latestLog.includes('processing started')) {
            setProgressStatus(prev => ({ ...prev, conversion: 'processing' }));
          }
        }
      );

      if (result.success && result.data) {
        const svgResult = result.data as SVGResult;
        setState(prev => ({
          ...prev,
          isConverting: false,
          svgResult,
          conversionError: null,
        }));
        setProgressStatus(prev => ({ ...prev, conversion: 'completed' }));
        
        // Save SVG to gallery
        try {
          saveGalleryItem({
            type: 'svg',
            url: svgResult.url,
            prompt: state.prompt.trim(),
          });
          setGalleryRefresh(prev => prev + 1);
        } catch (error) {
          console.error('Error saving SVG to gallery:', error);
        }
        
        showNotification('success', 'SVG conversion completed successfully! You can download it now.');
      } else {
        setState(prev => ({
          ...prev,
          isConverting: false,
          conversionError: result.error?.message || "Failed to convert to SVG",
        }));
        setProgressStatus(prev => ({ ...prev, conversion: 'failed' }));
        showNotification('error', result.error?.message || "Failed to convert to SVG");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during SVG conversion";
      setState(prev => ({
        ...prev,
        isConverting: false,
        conversionError: errorMessage,
      }));
      setProgressStatus(prev => ({ ...prev, conversion: 'failed' }));
      showNotification('error', errorMessage);
    }
  }, [state.generatedImage?.url, state.isConverting, state.isGenerating, showNotification]);

  // Enhanced global keyboard shortcuts for better user experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to cancel operations (if possible) or clear errors
      if (e.key === 'Escape') {
        if (state.generationError || state.conversionError) {
          setState(prev => ({
            ...prev,
            generationError: null,
            conversionError: null,
          }));
          showNotification('info', 'Errors cleared');
        }
      }
      
      // Ctrl/Cmd + Enter to generate image (when prompt is available and not busy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (state.prompt.trim() && !state.isGenerating && !state.isConverting) {
          handleGenerate();
        }
      }
      
      // Ctrl/Cmd + Shift + C to convert to SVG (when image is available)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (state.generatedImage?.url && !state.isConverting && !state.isGenerating) {
          handleConvert();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.prompt, state.generatedImage?.url, state.isConverting, state.isGenerating, state.generationError, state.conversionError, handleGenerate, handleConvert, showNotification]);

  return (
    <div className="min-h-screen bg-background">
      {/* Success/Error Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              AI-Powered Creative Tools
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
              Create Simple
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Doodle-Style Images
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-4 max-w-xl mx-auto">
              Generate doodle-style images from text and convert them to scalable SVG vectors.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Doodle Images
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                SVG Conversion
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Instant Download
              </div>
            </div>
            
            {/* Application status indicator DO NOT DELETE*/}
            {/* <div className="flex items-center justify-center gap-2 text-sm">
              {state.isGenerating && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <LoadingSpinner size="sm" />
                  <span className="font-medium">Generating image...</span>
                </div>
              )}
              {state.isConverting && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <LoadingSpinner size="sm" />
                  <span className="font-medium">Converting to SVG...</span>
                </div>
              )}
              {!state.isGenerating && !state.isConverting && state.generatedImage && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Ready for conversion</span>
                </div>
              )}
              {!state.isGenerating && !state.isConverting && !state.generatedImage && (
                <div className="px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground border border-muted">
                  <span>Enter a prompt below to get started</span>
                </div>
              )}
            </div> */}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
      </header>

      {/* Main Content - Enhanced Three Column Responsive Layout */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-fr">
          {/* Column 1: Prompt Input */}
          <div className="space-y-4 md:space-y-6 order-1">
            <div className="bg-card border rounded-lg p-4 sm:p-6 h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Text Prompt
              </h2>
              <div className="flex-1">
                <PromptInput
                  prompt={state.prompt}
                  onPromptChange={handlePromptChange}
                  onGenerate={handleGenerate}
                  isGenerating={state.isGenerating}
                  isConverting={state.isConverting}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Generated Image Display */}
          <div className="space-y-4 md:space-y-6 order-2 md:order-2 lg:order-2">
            <div className="bg-card border rounded-lg p-4 sm:p-6 h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  state.generatedImage ? 'bg-green-500' : 
                  state.isGenerating ? 'bg-yellow-500 animate-pulse' : 
                  'bg-gray-300'
                }`}></span>
                Generated Image
              </h2>
              <div className="flex-1">
                <ImageDisplay
                  imageData={state.generatedImage}
                  isLoading={state.isGenerating}
                  error={state.generationError}
                />
              </div>
            </div>
          </div>

          {/* Column 3: SVG Conversion */}
          <div className="space-y-4 md:space-y-6 order-3 md:col-span-2 lg:col-span-1 lg:order-3">
            <div className="bg-card border rounded-lg p-4 sm:p-6 h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  state.svgResult ? 'bg-green-500' : 
                  state.isConverting ? 'bg-yellow-500 animate-pulse' : 
                  state.generatedImage ? 'bg-blue-500' : 
                  'bg-gray-300'
                }`}></span>
                SVG Conversion
              </h2>
              <div className="flex-1">
                <SVGConverter
                  imageUrl={state.generatedImage?.url || null}
                  svgResult={state.svgResult}
                  onConvert={handleConvert}
                  isConverting={state.isConverting}
                  isGenerating={state.isGenerating}
                  error={state.conversionError}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mt-8">
          <Gallery onRefresh={() => setGalleryRefresh(prev => prev + 1)} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built by</span>
              <a 
                href="https://x.com/deifosv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors duration-200 hover:underline"
              >
                Vlad
              </a>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Powered by</span>
              <a 
                href="https://fal.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors duration-200 hover:underline flex items-center gap-1"
              >
                fal.ai
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                  />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Additional footer info */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="text-center text-xs text-muted-foreground">
              <p>Create simple doodle-style images and convert them to scalable SVG vectors.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
