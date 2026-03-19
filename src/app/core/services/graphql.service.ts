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
  private readonly endpoint = 'http://localhost:4000/graphql';

  async request<T>(query: string, variables: object = {}): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.session.token() ? { Authorization: `Bearer ${this.session.token()}` } : {})
      },
      body: JSON.stringify({ query, variables })
    });

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
