export type ProjectStatus = 'active' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  tasks_count?: number;
  tasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  details: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export interface CreateTaskPayload {
  title: string;
  details?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  details?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
}
