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
          <span>{title}</span>
          <span className={`${colorClass} text-xs rounded-full px-2 py-1`}>{count}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-2 pt-0 pb-2 overflow-auto">
        {children}
      </CardContent>
    </Card>
  )
}

