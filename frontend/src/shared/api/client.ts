const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Generic API client for communicating with the FastAPI backend.
 */
export async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Include credentials by default for JWT / CORS cookies if needed later
  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  };

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    let errorMessage = "API request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.error?.message || errorMessage;
    } catch {
      // If parsing fails, fall back to default
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
