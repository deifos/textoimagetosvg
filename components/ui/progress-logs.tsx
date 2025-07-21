import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface ProgressLogsProps {
  logs: string[]
  title: string
  isActive: boolean
  className?: string
}

export function ProgressLogs({ logs, title, isActive, className }: ProgressLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  if (!isActive && logs.length === 0) {
    return null
  }

  // Determine status based on activity and logs
  const getStatus = () => {
    if (isActive) {
      // Check if we're in queue or processing
      const hasQueuedLog = logs.some(log => log.toLowerCase().includes("queued"))
      const hasProcessingLog = logs.some(log => log.toLowerCase().includes("processing started"))
      
      if (hasProcessingLog) {
        return { label: "Processing", icon: Loader2, color: "bg-blue-500", animate: true }
      } else if (hasQueuedLog) {
        return { label: "Queued", icon: Clock, color: "bg-yellow-500", animate: false }
      }
      return { label: "Initializing", icon: Loader2, color: "bg-blue-500", animate: true }
    } else if (logs.length > 0) {
      // Check if the last log indicates completion or error
      const lastLog = logs[logs.length - 1]?.toLowerCase() || ""
      if (lastLog.includes("error") || lastLog.includes("failed")) {
        return { label: "Failed", icon: AlertCircle, color: "bg-red-500", animate: false }
      } else if (lastLog.includes("completed successfully")) {
        return { label: "Completed", icon: CheckCircle, color: "bg-green-500", animate: false }
      }
      return { label: "Finished", icon: CheckCircle, color: "bg-green-500", animate: false }
    }
    return { label: "Ready", icon: Clock, color: "bg-gray-500", animate: false }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  return (
    <Card className={cn("mt-4", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {title}
            {isActive && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <StatusIcon className={cn("w-3 h-3", status.animate && "animate-spin")} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-32 w-full rounded border bg-muted/30 p-3 overflow-y-auto">
          <div className="space-y-1">
            {logs.length === 0 && isActive && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                Initializing request...
              </div>
            )}
            {logs.length === 0 && !isActive && (
              <p className="text-xs text-muted-foreground italic">
                No activity yet
              </p>
            )}
            {logs.map((log, index) => {
              // Parse timestamp, log level and message
              const timestampMatch = log.match(/^\[([\d:]+)\]/)
              const timestamp = timestampMatch ? timestampMatch[1] : new Date().toLocaleTimeString()
              
              // Remove timestamp from log to parse level and message
              const logWithoutTimestamp = log.replace(/^\[[\d:]+\]\s*/, "")
              const logLevel = logWithoutTimestamp.match(/\[(.*?)\]/)?.[1] || "INFO"
              const message = logWithoutTimestamp.replace(/\[.*?\]\s*/, "")
              
              // Determine log color based on level
              const getLogColor = (level: string) => {
                switch (level.toUpperCase()) {
                  case "ERROR":
                    return "text-red-400"
                  case "WARN":
                  case "WARNING":
                    return "text-yellow-400"
                  case "INFO":
                    return "text-blue-400"
                  case "SUCCESS":
                    return "text-green-400"
                  case "DEBUG":
                    return "text-gray-400"
                  default:
                    return "text-foreground"
                }
              }

              // Add visual indicator for important messages
              const getLogIcon = (level: string, message: string) => {
                if (level.toUpperCase() === "ERROR" || message.toLowerCase().includes("failed")) {
                  return "🔴"
                } else if (level.toUpperCase() === "SUCCESS" || message.toLowerCase().includes("completed")) {
                  return "✅"
                } else if (message.toLowerCase().includes("queued")) {
                  return "⏳"
                } else if (message.toLowerCase().includes("processing")) {
                  return "⚡"
                }
                return "•"
              }

              return (
                <div key={index} className="text-xs font-mono flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0 min-w-[60px]">
                    {timestamp}
                  </span>
                  <span className="shrink-0">
                    {getLogIcon(logLevel, message)}
                  </span>
                  <span className={cn("shrink-0 font-semibold", getLogColor(logLevel))}>
                    [{logLevel}]
                  </span>
                  <span className="text-foreground break-words">{message}</span>
                </div>
              )
            })}
            <div ref={logsEndRef} />
          </div>
        </div>
        
        {/* Progress summary */}
        {logs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-muted">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{logs.length} log entries</span>
              {isActive && (
                <span className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  Processing...
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}