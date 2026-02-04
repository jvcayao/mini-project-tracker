import { Form, Input, Modal } from 'antd';
import type { Project, CreateProjectPayload } from '../types';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  project?: Project | null;
  onSubmit: (values: CreateProjectPayload) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({ open, project, onSubmit, onCancel }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(project ?? { name: '', description: '' });
    }
  }, [open, project, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={project ? 'Edit Project' : 'New Project'}
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
          name="name"
          label="Name"
          rules={[
            { required: true, message: 'Name is required' },
            { min: 3, message: 'At least 3 characters' },
          ]}
        >
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
