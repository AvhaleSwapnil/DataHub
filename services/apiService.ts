const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchWithAuth(endpoint: string, retries = 2): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, { cache: "no-store" }); // bypass HTTP cache on every filter change
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.warn(`[Rate Limit] ${endpoint} 429. Waiting 2s before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await fetchWithAuth(endpoint, retries - 1);
      }
      if ((res.status === 401 || res.status === 403) && retries > 0) {
        console.warn(`[Auth Error] ${endpoint} 401. Refreshing Token...`);
        await fetch(`${API_BASE_URL}/refresh-token`);
        return await fetchWithAuth(endpoint, retries - 1);
      }
      throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}
