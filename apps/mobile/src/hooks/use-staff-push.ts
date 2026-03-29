import { useEffect } from 'react';
import { registerStaffDeviceForPush } from '../lib/push';

export function useStaffPushRegistration(storeId: string | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !storeId) {
      return;
    }

    void registerStaffDeviceForPush(storeId);
  }, [enabled, storeId]);
}
