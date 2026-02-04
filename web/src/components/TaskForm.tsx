import { Form, Input, Modal, Select, DatePicker } from 'antd';
import type { Task, CreateTaskPayload } from '../types';
import { useEffect } from 'react';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  task?: Task | null;
  onSubmit: (values: CreateTaskPayload) => Promise<void>;
  onCancel: () => void;
}

export default function TaskForm({ open, task, onSubmit, onCancel }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && task) {
      form.setFieldsValue({
        ...task,
        due_date: task.due_date ? dayjs(task.due_date) : null,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, task, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      due_date: values.due_date?.format('YYYY-MM-DD') ?? null,
    };
    await onSubmit(payload);
    form.resetFields();
  };

  return (
    <Modal
      title={task ? 'Edit Task' : 'New Task'}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Title is required' },
            { min: 3, message: 'At least 3 characters' },
          ]}
        >
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item name="details" label="Details">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="priority" label="Priority" initialValue="medium">
          <Select>
            <Select.Option value="low">Low</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="high">High</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="status" label="Status" initialValue="todo">
          <Select>
            <Select.Option value="todo">To Do</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="done">Done</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="due_date" label="Due Date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
