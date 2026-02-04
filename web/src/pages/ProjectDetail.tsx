import { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Table, Tag, Space, Popconfirm, Select, message, Skeleton, Empty, Input, Pagination } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { projectStore } from '../stores/ProjectStore';
import { taskStore } from '../stores/TaskStore';
import TaskForm from '../components/TaskForm';
import type { Task, CreateTaskPayload, TaskStatus } from '../types';
import type { TaskSortField, SortOrder } from '../api/tasks';

const priorityColors: Record<string, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const ProjectDetail = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const projectId = Number(id);

  useEffect(() => {
    if (projectId) {
      projectStore.fetchProject(projectId);
      taskStore.fetchTasks(projectId);
    }
    return () => {
      projectStore.clearCurrent();
      taskStore.clear();
    };
  }, [projectId]);

  const project = projectStore.currentProject;
  const { counts } = taskStore;

  const handleStatusFilterChange = (value: string) => {
    const status = value === 'all' ? undefined : (value as TaskStatus);
    taskStore.setFilters({ status, page: 1 });
  };

  const handleSortChange = (value: string) => {
    taskStore.setFilters({ sort: value as TaskSortField });
  };

  const handleOrderChange = (value: string) => {
    taskStore.setFilters({ order: value as SortOrder });
  };

  // debounced search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
  }, []);

  const handleSearch = () => {
    taskStore.setFilters({ search: searchInput, page: 1 });
  };

  const handlePageChange = (page: number) => {
    taskStore.setFilters({ page });
  };

  const handleCreate = async (values: CreateTaskPayload) => {
    await taskStore.createTask(projectId, values);
    message.success('Task created');
    setModalOpen(false);
  };

  const handleEdit = async (values: CreateTaskPayload) => {
    if (!editing) return;
    await taskStore.updateTask(editing.id, values);
    message.success('Task updated');
    setEditing(null);
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    await taskStore.updateStatus(taskId, status);
  };

  const handleDelete = async (taskId: number) => {
    await taskStore.deleteTask(taskId);
    message.success('Task deleted');
  };

  const handleBulkMarkDone = async () => {
    await taskStore.bulkUpdateStatus('done');
    message.success('Tasks marked as done');
  };

  const rowSelection = {
    selectedRowKeys: taskStore.selectedIds,
    onChange: (keys: React.Key[]) => {
      taskStore.selectedIds = keys as number[];
    },
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: string) => <Tag color={priorityColors[p]}>{p}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus, record: Task) => (
        <Select
          value={status}
          onChange={(val) => handleStatusChange(record.id, val)}
          style={{ width: 130 }}
          size="small"
          options={[
            { value: 'todo', label: 'To Do' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'done', label: 'Done' },
          ]}
        />
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string | null) => date || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Task) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(record)} />
          <Popconfirm title="Delete task?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (projectStore.loading && !project) {
    return (
      <div className="page-container">
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        Back to Projects
      </Button>

      {/* Project Header */}
      <div className="project-header">
        <div className="project-header__info">
          <h1 className="project-header__title">
            {project?.name}
            <Tag color={project?.status === 'active' ? 'green' : 'red'} style={{ marginLeft: 12 }}>
              {project?.status}
            </Tag>
          </h1>
          {project?.description && (
            <p className="project-header__description">{project.description}</p>
          )}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Task
        </Button>
      </div>

      {/* Stats Bar - Centered */}
      <div className="task-stats">
        <div className="task-stats__item task-stats__item--total">
          <div className="task-stats__count">{counts.total}</div>
          <div className="task-stats__label">Total</div>
        </div>
        <div className="task-stats__item task-stats__item--todo">
          <div className="task-stats__count">{counts.todo}</div>
          <div className="task-stats__label">To Do</div>
        </div>
        <div className="task-stats__item task-stats__item--in-progress">
          <div className="task-stats__count">{counts.in_progress}</div>
          <div className="task-stats__label">In Progress</div>
        </div>
        <div className="task-stats__item task-stats__item--done">
          <div className="task-stats__count">{counts.done}</div>
          <div className="task-stats__label">Done</div>
        </div>
      </div>

      {/* Tasks Card */}
      <Card>
        <div className="filter-bar">
          <div className="filter-bar__search">
            <Input.Search
              placeholder="Search tasks..."
              value={searchInput}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              style={{ width: 220 }}
              allowClear
            />
          </div>
          <div className="filter-bar__filters">
            <div className="filter-bar__item">
              <label>Status:</label>
              <Select
                value={taskStore.statusFilter || 'all'}
                onChange={handleStatusFilterChange}
                style={{ width: 130 }}
                options={[
                  { value: 'all', label: 'All Tasks' },
                  { value: 'todo', label: 'To Do' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'done', label: 'Done' },
                ]}
              />
            </div>
            <div className="filter-bar__item">
              <label>Sort:</label>
              <Select
                value={taskStore.sortField}
                onChange={handleSortChange}
                style={{ width: 130 }}
                options={[
                  { value: 'created_at', label: 'Created Date' },
                  { value: 'due_date', label: 'Due Date' },
                  { value: 'priority', label: 'Priority' },
                ]}
              />
            </div>
            <div className="filter-bar__item">
              <label>Order:</label>
              <Select
                value={taskStore.sortOrder}
                onChange={handleOrderChange}
                style={{ width: 120 }}
                options={[
                  { value: 'desc', label: 'Desc' },
                  { value: 'asc', label: 'Asc' },
                ]}
              />
            </div>
          </div>
        </div>

        {taskStore.selectedIds.length > 0 && (
          <div className="bulk-actions">
            <span>{taskStore.selectedIds.length} selected</span>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleBulkMarkDone}
            >
              Mark as Done
            </Button>
            <Button size="small" onClick={() => taskStore.clearSelection()}>
              Clear
            </Button>
          </div>
        )}

        {taskStore.loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : taskStore.tasks.length === 0 ? (
          <Empty
            description={
              taskStore.statusFilter
                ? `No ${statusLabels[taskStore.statusFilter]} tasks`
                : taskStore.searchQuery
                ? 'No tasks match your search'
                : 'No tasks yet'
            }
          >
            <Button type="primary" onClick={() => setModalOpen(true)}>
              Add Task
            </Button>
          </Empty>
        ) : (
          <>
            <Table
              dataSource={taskStore.tasks}
              columns={columns}
              rowKey="id"
              pagination={false}
              rowSelection={rowSelection}
            />
            {taskStore.totalPages > 1 && (
              <div className="pagination-wrapper">
                <Pagination
                  current={taskStore.currentPage}
                  total={taskStore.totalItems}
                  pageSize={taskStore.perPage}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <TaskForm
        open={modalOpen}
        onSubmit={handleCreate}
        onCancel={() => setModalOpen(false)}
      />
      <TaskForm
        open={!!editing}
        task={editing}
        onSubmit={handleEdit}
        onCancel={() => setEditing(null)}
      />
    </div>
  );
});

export default ProjectDetail;
