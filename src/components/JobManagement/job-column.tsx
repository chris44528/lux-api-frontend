import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

interface JobColumnProps {
  id: string
  title: string
  count: number
  colorClass: string
  children: ReactNode
}

export function JobColumn({ id, title, count, colorClass, children }: JobColumnProps) {
  return (
    <Card 
      id={id}
      className="h-full max-h-[800px] flex flex-col border-t-4"
      style={{ borderTopColor: colorClass.includes("red") ? "#ef4444" : 
              colorClass.includes("amber") ? "#f59e0b" : 
              colorClass.includes("green") ? "#10b981" : "#64748b" }}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-md flex justify-between items-center">
          <span className="dark:text-gray-100">{title}</span>
          <span className={`text-xs rounded-full px-2 py-1 ${
            colorClass.includes("#ef4444") ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
            colorClass.includes("#f59e0b") ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
            colorClass.includes("#10b981") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }`}>{count}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-2 pt-0 pb-2 overflow-auto">
        {children}
      </CardContent>
    </Card>
  )
}

