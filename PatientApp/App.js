import React, { useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext'; 
import { LanguageProvider } from './src/context/LanguageContext'; 
import AppNavigator from './src/navigation/AppNavigator';
import { requestUserPermission, notificationListener } from './src/utils/pushNotification';

const App = () => {
  useEffect(() => {
    requestUserPermission();
    notificationListener();
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>  
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;