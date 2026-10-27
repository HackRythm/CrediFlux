import type {
  HealthResponse,
  ModelsResponse,
  ProspectiveApplicantRequest,
  AssessResponseUnavailable,
  RetrospectiveLoanRecord,
  RetrospectiveScoreResponse,
  RetrospectiveBatchResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const body = await response.json();
          if (body.detail) {
            errorDetail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
          }
        } catch {
          // Fall back to status text
        }
        throw new Error(errorDetail);
      }

      return await response.json();
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(`Unable to connect to CrediFlux Backend at ${API_BASE_URL}. Ensure the FastAPI server is running on port 8000.`);
      }
      throw err;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>('/models');
  }

  async assessProspective(data: ProspectiveApplicantRequest): Promise<AssessResponseUnavailable> {
    return this.request<AssessResponseUnavailable>('/assess', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assessRetrospective(data: RetrospectiveLoanRecord): Promise<RetrospectiveScoreResponse> {
    return this.request<RetrospectiveScoreResponse>('/assess/retrospective', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assessRetrospectiveBatch(
    file: File,
    modelName: 'Logistic Regression' | 'Random Forest' = 'Logistic Regression'
  ): Promise<RetrospectiveBatchResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);

    const url = `${API_BASE_URL}/assess/retrospective/batch`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          if (body.detail) {
            errorDetail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
          }
        } catch {
          // ignore
        }
        throw new Error(errorDetail);
      }

      return await response.json();
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(`Unable to connect to CrediFlux Backend at ${API_BASE_URL}.`);
      }
      throw err;
    }
  }
}

export const api = new ApiService();
