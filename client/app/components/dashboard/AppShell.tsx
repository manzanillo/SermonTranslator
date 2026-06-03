import { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'
import { User } from '../../types'
import { authFetch } from '../../utils/auth'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface AppShellProps {
  user: User
  children: ReactNode
}

export default function AppShell({ user, children }: AppShellProps) {
  useEffect(() => {
    if (user.role === 'listener' && 'serviceWorker' in navigator && 'PushManager' in window) {
      const subscribeUser = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await navigator.serviceWorker.register('/sw.js');
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            
            if (!vapidPublicKey) {
              console.error('VAPID public key not found');
              return;
            }

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
              });
            }

            const subPayload = (subscription as any).toJSON ? (subscription as any).toJSON() : subscription;
            console.log('Push subscription payload:', subPayload);
            const resp = await authFetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subPayload)
            });
            if (!resp.ok) {
              console.error('Failed to save subscription', await resp.text());
            }
          }
        } catch (error) {
          console.error('Error during push subscription:', error);
        }
      };

      subscribeUser();
    }
  }, [user]);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#eef7ec]">
      {/* Decorative background — mirrors AuthPageShell */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(24,191,35,0.13),_transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 -top-16 h-[34rem] w-[34rem] rounded-full bg-[#d9f5dd]/50 blur-[140px]" />

      <Sidebar user={user} />

      <main className="relative flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
