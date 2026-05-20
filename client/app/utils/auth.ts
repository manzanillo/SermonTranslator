export function getCachedUser(): any | null {
  if (typeof window === 'undefined') return null;
  const cached = sessionStorage.getItem('zermon_user');
  return cached ? JSON.parse(cached) : null;
}

export function setCachedUser(user: any | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    sessionStorage.setItem('zermon_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('zermon_user');
  }
}

export async function authFetch(url: string, options: RequestInit = {}, handle401: boolean = true): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401 && handle401) {
    // Token is invalid, clear cache, logout and redirect
    setCachedUser(null);
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}