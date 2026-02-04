import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, Button, List, Tag, Popconfirm, Space, message, Select, Skeleton, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectStore } from '../stores/ProjectStore';
import ProjectForm from '../components/ProjectForm';
import type { Project, CreateProjectPayload, ProjectStatus } from '../types';

const ProjectList = observer(() => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    projectStore.fetchProjects();
  }, []);

  const handleStatusFilter = (value: string) => {
    const status = value === 'all' ? undefined : (value as ProjectStatus);
    projectStore.setStatusFilter(status);
  };

  const handleCreate = async (values: CreateProjectPayload) => {
    await projectStore.createProject(values);
    message.success('Project created');
    setModalOpen(false);
  };

  const handleEdit = async (values: CreateProjectPayload) => {
    if (!editing) return;
    await projectStore.updateProject(editing.id, values);
    message.success('Project updated');
    setEditing(null);
  };

  const handleArchiveToggle = async (project: Project) => {
    if (project.status === 'archived') {
      await projectStore.unarchiveProject(project.id);
      message.success('Project restored');
    } else {
      await projectStore.archiveProject(project.id);
      message.success('Project archived');
    }
  };

  const handleDelete = async (id: number) => {
    await projectStore.deleteProject(id);
    message.success('Project deleted');
  };

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((key) => (
        <List.Item key={key}>
          <Skeleton active avatar={{ shape: 'square', size: 'small' }} paragraph={{ rows: 1 }} />
        </List.Item>
      ))}
    </>
  );

  return (
    <div className="page-container">
      <Card
        title="Projects"
        extra={
          <Space>
            <div className="filter-bar__item">
              <label>Status:</label>
              <Select
                value={projectStore.statusFilter || 'all'}
                onChange={handleStatusFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New Project
            </Button>
          </Space>
        }
      >
        {projectStore.loading ? (
          <List>{renderSkeletons()}</List>
        ) : projectStore.projects.length === 0 ? (
          <Empty
            description={
              projectStore.statusFilter
                ? `No ${projectStore.statusFilter} projects found`
                : 'No projects yet'
            }
          >
            <Button type="primary" onClick={() => setModalOpen(true)}>
              Create Project
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={projectStore.projects}
            renderItem={(project) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="link"
                    icon={<FolderOutlined />}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    View
                  </Button>,
                  <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => setEditing(project)}
                  />,
                  <Button
                    key="archive"
                    type="link"
                    danger={project.status !== 'archived'}
                    onClick={() => handleArchiveToggle(project)}
                  >
                    {project.status === 'archived' ? 'Restore' : 'Archive'}
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="Delete this project?"
                    onConfirm={() => handleDelete(project.id)}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={project.name}
                  description={project.description || 'No description'}
                />
                <Space>
                  <Tag color={project.status === 'active' ? 'green' : 'red'}>
                    {project.status}
                  </Tag>
                  {project.tasks_count !== undefined && (
                    <Tag>{project.tasks_count} tasks</Tag>
                  )}
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <ProjectForm
        open={modalOpen}
        onSubmit={handleCreate}
        onCancel={() => setModalOpen(false)}
      />
      <ProjectForm
        open={!!editing}
        project={editing}
        onSubmit={handleEdit}
        onCancel={() => setEditing(null)}
      />
    </div>
  );
});

export default ProjectList;
