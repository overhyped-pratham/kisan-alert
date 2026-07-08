import React, { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {
  const hydrateFromSession = useAppStore((s) => s.hydrateFromSession);

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  return <AppRoutes />;
};

export default App;
