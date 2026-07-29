import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.log('navigationRef not ready, retrying in 250ms...');
    let retries = 0;
    const interval = setInterval(() => {
      retries++;
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
        clearInterval(interval);
      } else if (retries >= 12) {
        console.warn('navigationRef failed to become ready after 3 seconds');
        clearInterval(interval);
      }
    }, 250);
  }
}
