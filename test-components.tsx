// Test file to verify component imports work correctly
import { PromptInput } from "@/components/prompt-input"
import { ImageDisplay } from "@/components/image-display"
import { SVGConverter } from "@/components/svg-converter"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { ProgressLogs } from "@/components/ui/progress-logs"
import { useState, useEffect } from "react"

// This file is just to test imports - will be deleted
export function TestComponents() {
  const [logs, setLogs] = useState<string[]>([])
  const [isActive, setIsActive] = useState(false)

  // Simulate progress logs for testing
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [INFO] Processing step ${prev.length + 1}...`
        ])
      }, 1000)

      // Stop after 5 logs
      setTimeout(() => {
        setIsActive(false)
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SUCCESS] Processing completed successfully`
        ])
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isActive])

  const startTest = () => {
    setLogs([`[${new Date().toLocaleTimeString()}] [INFO] Request queued for processing`])
    setIsActive(true)
  }

  const resetTest = () => {
    setLogs([])
    setIsActive(false)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Progress Feedback Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Spinner</h2>
        <div className="flex gap-4 items-center">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Progress Logs</h2>
        <div className="flex gap-4 mb-4">
          <button 
            onClick={startTest}
            disabled={isActive}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Start Test
          </button>
          <button 
            onClick={resetTest}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Reset
          </button>
        </div>
        <ProgressLogs
          logs={logs}
          title="Test Progress"
          isActive={isActive}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Other Components</h2>
        <PromptInput 
          prompt="" 
          onPromptChange={() => {}} 
          onGenerate={() => {}} 
          isGenerating={false} 
        />
        <ImageDisplay 
          imageData={null} 
          isLoading={false} 
          error={null} 
        />
        <SVGConverter 
          imageUrl={null} 
          svgResult={null} 
          onConvert={() => {}} 
          isConverting={false} 
          error={null} 
        />
        <ErrorMessage error="Sample error message" />
      </div>
    </div>
  )
}