import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PromptInputProps } from "@/lib/types"
import { useCallback, useRef, useEffect } from "react"
import { Sparkles, Loader2 } from "lucide-react"

export function PromptInput({ 
  prompt, 
  onPromptChange, 
  onGenerate, 
  isGenerating,
  isConverting 
}: PromptInputProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const submitAttemptedRef = useRef(false)

  // Reset submit attempt flag when operations complete
  useEffect(() => {
    if (!isGenerating && !isConverting) {
      submitAttemptedRef.current = false
    }
  }, [isGenerating, isConverting])

  // Enhanced form submission handling with duplicate request prevention
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (submitAttemptedRef.current) {
      return
    }
    
    // Validate prompt and check if operations are in progress
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isGenerating || isConverting) {
      return
    }
    
    // Mark submission as attempted to prevent duplicates
    submitAttemptedRef.current = true
    
    // Blur the textarea to remove focus and provide visual feedback
    if (textareaRef.current) {
      textareaRef.current.blur()
    }
    
    onGenerate()
  }, [prompt, isGenerating, isConverting, onGenerate])

  // Enhanced button state logic with multiple conditions
  const getButtonState = useCallback(() => {
    const trimmedPrompt = prompt.trim()
    
    // Button is disabled if:
    // 1. No prompt text
    // 2. Currently generating
    // 3. Currently converting
    // 4. Submit has been attempted (prevents double-click)
    const isDisabled = !trimmedPrompt || isGenerating || isConverting || submitAttemptedRef.current
    
    // Determine button variant based on state
    let variant: "default" | "secondary" | "outline" = "default"
    if (isGenerating || isConverting) {
      variant = "secondary"
    }
    
    return { isDisabled, variant }
  }, [prompt, isGenerating, isConverting])

  const { isDisabled, variant } = getButtonState()

  // Handle Enter key submission (Ctrl+Enter or Cmd+Enter)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      // Directly call the generation logic instead of form submission
      if (!isDisabled) {
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
        submitAttemptedRef.current = true
        onGenerate()
      }
    }
  }, [isDisabled, onGenerate])

  // Enhanced button content with better visual feedback
  const getButtonContent = useCallback(() => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Image...
        </>
      )
    }
    
    if (isConverting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please Wait...
        </>
      )
    }
    
    return (
      <>
        <Sparkles className="mr-2 h-4 w-4" />
        Generate Image
      </>
    )
  }, [isGenerating, isConverting])

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="a horse, a kid flying a kite, a cat sleeping..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] resize-none transition-all duration-200"
          disabled={isGenerating || isConverting}
        />
        {/* Character count indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {prompt.length}/1000
        </div>
      </div>
      
      <Button 
        type="submit"
        variant={variant}
        className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        disabled={isDisabled}
      >
        {getButtonContent()}
      </Button>
      
      {/* Enhanced helper text with state-aware messaging */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        {isGenerating ? (
          <p>Image generation in progress...</p>
        ) : isConverting ? (
          <p>Please wait for SVG conversion to complete...</p>
        ) : (
          <>
            <p>Press Ctrl+Enter (Cmd+Enter on Mac) to generate</p>
            {!prompt.trim() && (
              <p className="text-amber-600">Enter a prompt to get started</p>
            )}
          </>
        )}
      </div>
    </form>
  )
}