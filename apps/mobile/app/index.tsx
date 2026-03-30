import { Redirect } from 'expo-router';
import { useAuthState } from '../src/hooks/use-auth';

export default function IndexScreen() {
  const { isAuthenticated } = useAuthState();

  return <Redirect href={isAuthenticated ? '/store' : '/welcome'} />;
}
