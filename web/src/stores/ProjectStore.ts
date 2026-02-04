import { makeAutoObservable, runInAction } from 'mobx';
import type { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus } from '../types';
import * as api from '../api/projects';

class ProjectStore {
  projects: Project[] = [];
  currentProject: Project | null = null;
  loading = false;
  statusFilter: ProjectStatus | undefined = undefined;

  constructor() {
    makeAutoObservable(this);
  }

  setStatusFilter(status: ProjectStatus | undefined) {
    this.statusFilter = status;
    this.fetchProjects();
  }

  async fetchProjects() {
    this.loading = true;
    try {
      const data = await api.getProjects(this.statusFilter);
      runInAction(() => {
        this.projects = data;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async fetchProject(id: number) {
    this.loading = true;
    try {
      const data = await api.getProject(id);
      runInAction(() => {
        this.currentProject = data;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createProject(payload: CreateProjectPayload) {
    const project = await api.createProject(payload);
    runInAction(() => {
      this.projects.unshift(project);
    });
    return project;
  }

  async updateProject(id: number, payload: UpdateProjectPayload) {
    const updated = await api.updateProject(id, payload);
    runInAction(() => {
      const idx = this.projects.findIndex(p => p.id === id);
      if (idx !== -1) this.projects[idx] = updated;
      if (this.currentProject?.id === id) this.currentProject = updated;
    });
    return updated;
  }

  async archiveProject(id: number) {
    const updated = await api.archiveProject(id);
    runInAction(() => {
      const idx = this.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        if (this.statusFilter && updated.status !== this.statusFilter) {
          this.projects = this.projects.filter(p => p.id !== id);
        } else {
          this.projects[idx] = updated;
        }
      }
    });
  }

  async unarchiveProject(id: number) {
    const updated = await api.unarchiveProject(id);
    runInAction(() => {
      const idx = this.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        if (this.statusFilter && updated.status !== this.statusFilter) {
          this.projects = this.projects.filter(p => p.id !== id);
        } else {
          this.projects[idx] = updated;
        }
      }
    });
  }

  async deleteProject(id: number) {
    await api.deleteProject(id);
    runInAction(() => {
      this.projects = this.projects.filter(p => p.id !== id);
    });
  }

  clearCurrent() {
    this.currentProject = null;
  }
}

export const projectStore = new ProjectStore();
