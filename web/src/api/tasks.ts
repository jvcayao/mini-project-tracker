import client from './client';
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskStatus } from '../types';

export type TaskSortField = 'due_date' | 'priority' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface TaskFilters {
  status?: TaskStatus;
  sort?: TaskSortField;
  order?: SortOrder;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface TaskCounts {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  counts: TaskCounts;
}

export const getTasks = (projectId: number, filters?: TaskFilters) => {
  const params: Record<string, string | number> = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.sort) params.sort = filters.sort;
  if (filters?.order) params.order = filters.order;
  if (filters?.search) params.search = filters.search;
  if (filters?.page) params.page = filters.page;
  if (filters?.per_page) params.per_page = filters.per_page;
  return client.get<PaginatedResponse<Task>>(`/projects/${projectId}/tasks`, { params }).then(res => res.data);
};

export const bulkUpdateStatus = (projectId: number, taskIds: number[], status: TaskStatus) =>
  client.patch<{ updated_count: number }>(`/projects/${projectId}/tasks/bulk-status`, {
    task_ids: taskIds,
    status,
  }).then(res => res.data);

export const createTask = (projectId: number, payload: CreateTaskPayload) =>
  client.post<{ data: Task }>(`/projects/${projectId}/tasks`, payload).then(res => res.data.data);

export const updateTask = (id: number, payload: UpdateTaskPayload) =>
  client.put<{ data: Task }>(`/tasks/${id}`, payload).then(res => res.data.data);

export const updateTaskStatus = (id: number, status: TaskStatus) =>
  client.patch<{ data: Task }>(`/tasks/${id}/status`, { status }).then(res => res.data.data);

export const deleteTask = (id: number) =>
  client.delete(`/tasks/${id}`);
