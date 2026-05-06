export async function authFetch(url: string, options: RequestInit = {}, handle401: boolean = true): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401 && handle401) {
    // Token is invalid, logout and redirect
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