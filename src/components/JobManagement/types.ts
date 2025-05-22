export interface Job {
  id: string
  title: string
  client: string
  address: string
  priority: string
  status: string
  dueDate: string
  assignedTo: string
  queue: string
}

export interface Technician {
  id: string
  name: string
  avatar: string
} 