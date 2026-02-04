import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, Typography } from 'antd';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';

const { Header, Content } = Layout;

function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ display: 'flex', alignItems: 'center' }}>
            <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
              Project Tracker
            </Typography.Title>
          </Header>
          <Content style={{ background: '#f5f5f5' }}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
