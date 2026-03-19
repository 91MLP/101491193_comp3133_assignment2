import { Injectable, inject } from '@angular/core';

import { SessionService } from './session.service';

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class GraphqlService {
  private readonly session = inject(SessionService);
  private readonly endpoint = '/graphql';
  private backendUnavailable = false;

  async request<T>(query: string, variables: object = {}): Promise<T> {
    if (this.backendUnavailable) {
      throw new Error('GraphQL backend is unavailable');
    }

    let response: Response;

    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.session.token() ? { Authorization: `Bearer ${this.session.token()}` } : {})
        },
        body: JSON.stringify({ query, variables })
      });
    } catch {
      this.backendUnavailable = true;
      throw new Error('GraphQL backend is unavailable');
    }

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const payload = await response.json() as GraphqlResponse<T>;

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((entry) => entry.message).join(', '));
    }

    if (!payload.data) {
      throw new Error('No GraphQL data returned from server');
    }

    return payload.data;
  }
}
