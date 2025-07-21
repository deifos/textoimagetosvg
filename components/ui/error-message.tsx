import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorMessageProps } from "@/lib/types"

export function ErrorMessage({ error, onRetry, retryable = false }: ErrorMessageProps) {
  if (!error) return null

  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
        {retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  )
}