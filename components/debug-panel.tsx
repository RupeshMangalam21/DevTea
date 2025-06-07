"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Download, Trash2 } from "lucide-react"

interface DebugLog {
  id: string
  timestamp: number
  type: "info" | "error" | "warning" | "success"
  category: string
  message: string
  data?: any
}

interface DebugPanelProps {
  isVisible: boolean
  onToggle: () => void
}

// Global debug logger
class DebugLogger {
  private logs: DebugLog[] = []
  private listeners: ((logs: DebugLog[]) => void)[] = []
  private maxLogs = 100

  log(type: DebugLog["type"], category: string, message: string, data?: any) {
    const log: DebugLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      category,
      message,
      data,
    }

    this.logs.unshift(log) // Add to beginning
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]))

    // Also log to console for backup
    const consoleMethod = type === "error" ? "error" : type === "warning" ? "warn" : "log"
    console[consoleMethod](`[${category}] ${message}`, data || "")
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener)
    listener([...this.logs]) // Send current logs
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  clear() {
    this.logs = []
    this.listeners.forEach((listener) => listener([]))
  }

  exportLogs() {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs,
    }

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `devtea-debug-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Global instance
export const debugLogger = new DebugLogger()

export function DebugPanel({ isVisible, onToggle }: DebugPanelProps) {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe(setLogs)
    return unsubscribe
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true
    return log.type === filter
  })

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getLogColor = (type: DebugLog["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400"
      case "warning":
        return "text-yellow-400"
      case "success":
        return "text-green-400"
      default:
        return "text-gray-300"
    }
  }

  const getBadgeVariant = (type: DebugLog["type"]) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "secondary"
      case "success":
        return "default"
      default:
        return "outline"
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={onToggle} variant="outline" size="sm" className="bg-gray-800 border-gray-600">
          🐛 Debug ({logs.length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center space-x-2">
              <span>🐛 Debug Console</span>
              <Badge variant="outline" className="text-xs">
                {logs.length}
              </Badge>
            </CardTitle>
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => debugLogger.exportLogs()}>
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => debugLogger.clear()}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggle}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex space-x-1">
            {["all", "error", "warning", "info", "success"].map((filterType) => (
              <Button
                key={filterType}
                size="sm"
                variant={filter === filterType ? "default" : "ghost"}
                onClick={() => setFilter(filterType)}
                className="text-xs h-6"
              >
                {filterType}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-sm">No logs to display</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="border border-gray-700 rounded p-2">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleLogExpansion(log.id)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Badge variant={getBadgeVariant(log.type)} className="text-xs">
                        {log.type}
                      </Badge>
                      <span className="text-xs text-gray-400">{log.category}</span>
                      <span className={`text-xs ${getLogColor(log.type)} truncate`}>{log.message}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      {log.data && (
                        <ChevronDown
                          className={`h-3 w-3 text-gray-400 transition-transform ${
                            expandedLogs.has(log.id) ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </div>
                  {expandedLogs.has(log.id) && log.data && (
                    <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
                      <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
