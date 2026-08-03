import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RefinementView from './pages/RefinementView';
import TokenGate from './components/TokenGate';

function App() {
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem('jwt_token'));

  if (!hasToken) {
    return <TokenGate onAuthenticated={() => setHasToken(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout onLogout={() => setHasToken(false)} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile onLogout={() => setHasToken(false)} />} />
        </Route>
        <Route path="/refinement/:jobId" element={<RefinementView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
