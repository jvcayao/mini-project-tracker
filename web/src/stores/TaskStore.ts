import { makeAutoObservable, runInAction } from 'mobx';
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskStatus } from '../types';
import * as api from '../api/tasks';
import type { TaskSortField, SortOrder, TaskFilters, TaskCounts } from '../api/tasks';

class TaskStore {
  tasks: Task[] = [];
  loading = false;
  currentProjectId: number | null = null;
  statusFilter: TaskStatus | undefined = undefined;
  sortField: TaskSortField = 'created_at';
  sortOrder: SortOrder = 'desc';
  searchQuery = '';

  // pagination
  currentPage = 1;
  totalPages = 1;
  perPage = 10;
  totalItems = 0;

  // counts from backend
  counts: TaskCounts = { total: 0, todo: 0, in_progress: 0, done: 0 };

  // bulk selection
  selectedIds: number[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setFilters(filters: { status?: TaskStatus; sort?: TaskSortField; order?: SortOrder; search?: string; page?: number }) {
    if (filters.status !== undefined) this.statusFilter = filters.status;
    if (filters.sort !== undefined) this.sortField = filters.sort;
    if (filters.order !== undefined) this.sortOrder = filters.order;
    if (filters.search !== undefined) this.searchQuery = filters.search;
    if (filters.page !== undefined) this.currentPage = filters.page;
    if (this.currentProjectId) {
      this.fetchTasks(this.currentProjectId);
    }
  }

  clearFilters() {
    this.statusFilter = undefined;
    this.sortField = 'created_at';
    this.sortOrder = 'desc';
    this.searchQuery = '';
    this.currentPage = 1;
  }

  toggleSelect(id: number) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(i => i !== id);
    } else {
      this.selectedIds.push(id);
    }
  }

  selectAll() {
    this.selectedIds = this.tasks.map(t => t.id);
  }

  clearSelection() {
    this.selectedIds = [];
  }

  async fetchTasks(projectId: number) {
    this.loading = true;
    this.currentProjectId = projectId;
    try {
      const filters: TaskFilters = {
        status: this.statusFilter,
        sort: this.sortField,
        order: this.sortOrder,
        search: this.searchQuery || undefined,
        page: this.currentPage,
        per_page: this.perPage,
      };
      const response = await api.getTasks(projectId, filters);

      runInAction(() => {
        this.tasks = response.data;
        this.currentPage = response.meta.current_page;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;
        this.counts = response.counts;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createTask(projectId: number, payload: CreateTaskPayload) {
    const task = await api.createTask(projectId, payload);
    // refetch to get updated counts
    await this.fetchTasks(projectId);
    return task;
  }

  async updateTask(id: number, payload: UpdateTaskPayload) {
    const updated = await api.updateTask(id, payload);
    runInAction(() => {
      const idx = this.tasks.findIndex(t => t.id === id);
      if (idx !== -1) this.tasks[idx] = updated;
    });
    return updated;
  }

  // optimistic update for status changes
  async updateStatus(id: number, status: TaskStatus) {
    const task = this.tasks.find(t => t.id === id);
    const prevStatus = task?.status;

    // optimistic: update UI immediately
    runInAction(() => {
      const idx = this.tasks.findIndex(t => t.id === id);
      if (idx !== -1) this.tasks[idx] = { ...this.tasks[idx], status };
    });

    try {
      await api.updateTaskStatus(id, status);
      // refetch to get updated counts
      if (this.currentProjectId) {
        await this.fetchTasks(this.currentProjectId);
      }
    } catch (e) {
      // rollback on error
      runInAction(() => {
        const idx = this.tasks.findIndex(t => t.id === id);
        if (idx !== -1 && prevStatus) this.tasks[idx] = { ...this.tasks[idx], status: prevStatus };
      });
      throw e;
    }
  }

  async bulkUpdateStatus(status: TaskStatus) {
    if (!this.currentProjectId || this.selectedIds.length === 0) return;

    const prevStates = this.selectedIds.map(id => {
      const t = this.tasks.find(task => task.id === id);
      return { id, status: t?.status };
    });

    // optimistic update
    runInAction(() => {
      this.selectedIds.forEach(id => {
        const idx = this.tasks.findIndex(t => t.id === id);
        if (idx !== -1) this.tasks[idx] = { ...this.tasks[idx], status };
      });
    });

    try {
      await api.bulkUpdateStatus(this.currentProjectId, this.selectedIds, status);
      runInAction(() => {
        this.selectedIds = [];
      });
      // refetch to get updated counts
      await this.fetchTasks(this.currentProjectId);
    } catch (e) {
      // rollback
      runInAction(() => {
        prevStates.forEach(({ id, status: prevStatus }) => {
          if (prevStatus) {
            const idx = this.tasks.findIndex(t => t.id === id);
            if (idx !== -1) this.tasks[idx] = { ...this.tasks[idx], status: prevStatus };
          }
        });
      });
      throw e;
    }
  }

  async deleteTask(id: number) {
    await api.deleteTask(id);
    // refetch to get updated counts
    if (this.currentProjectId) {
      await this.fetchTasks(this.currentProjectId);
    }
  }

  clear() {
    this.tasks = [];
    this.currentProjectId = null;
    this.selectedIds = [];
    this.counts = { total: 0, todo: 0, in_progress: 0, done: 0 };
    this.clearFilters();
  }
}

export const taskStore = new TaskStore();
