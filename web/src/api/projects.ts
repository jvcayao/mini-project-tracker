import client from './client';
import type { Project, CreateProjectPayload, UpdateProjectPayload, ProjectStatus } from '../types';

export const getProjects = (status?: ProjectStatus) => {
  const params = status ? { status } : {};
  return client.get<{ data: Project[] }>('/projects', { params }).then(res => res.data.data);
};

export const getProject = (id: number) =>
  client.get<{ data: Project }>(`/projects/${id}`).then(res => res.data.data);

export const createProject = (payload: CreateProjectPayload) =>
  client.post<{ data: Project }>('/projects', payload).then(res => res.data.data);

export const updateProject = (id: number, payload: UpdateProjectPayload) =>
  client.put<{ data: Project }>(`/projects/${id}`, payload).then(res => res.data.data);

export const archiveProject = (id: number) =>
  client.patch<{ data: Project }>(`/projects/${id}/archive`).then(res => res.data.data);

export const unarchiveProject = (id: number) =>
  client.patch<{ data: Project }>(`/projects/${id}/unarchive`).then(res => res.data.data);

export const deleteProject = (id: number) =>
  client.delete(`/projects/${id}`);
