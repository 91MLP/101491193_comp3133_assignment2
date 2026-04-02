import { Injectable, inject } from '@angular/core';

import { SessionUser } from '../../models/session-user';
import { GraphqlService } from './graphql.service';
import { SessionService } from './session.service';

interface StoredAuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface GraphqlUser {
  _id: string;
  username: string;
  email: string;
}

interface AuthResult {
  token: string;
  user: SessionUser;
}

const MOCK_USERS_KEY = 'employeehub.mock.users';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly graphql = inject(GraphqlService);
  private readonly session = inject(SessionService);

  async login(email: string, password: string): Promise<void> {
    try {
      const result = await this.loginWithGraphql(email, password);
      this.session.setSession(result.token, result.user);
      return;
    } catch {
      const result = this.loginWithFallback(email, password);
      this.session.setSession(result.token, result.user);
    }
  }

  async signup(name: string, email: string, password: string): Promise<void> {
    try {
      const result = await this.signupWithGraphql(name, email, password);
      this.session.setSession(result.token, result.user);
      return;
    } catch {
      const result = this.signupWithFallback(name, email, password);
      this.session.setSession(result.token, result.user);
    }
  }

  private async loginWithGraphql(email: string, password: string): Promise<AuthResult> {
    const query = `
      query Login($usernameOrEmail: String!, $password: String!) {
        login(usernameOrEmail: $usernameOrEmail, password: $password) {
          token
          user {
            _id
            username
            email
          }
        }
      }
    `;
    const data = await this.graphql.request<{ login: { token: string; user: GraphqlUser } }>(query, {
      usernameOrEmail: email,
      password
    });
    return {
      token: data.login.token,
      user: this.mapGraphqlUser(data.login.user)
    };
  }

  private async signupWithGraphql(name: string, email: string, password: string): Promise<AuthResult> {
    const query = `
      mutation Signup($name: String!, $email: String!, $password: String!) {
        signup(username: $name, email: $email, password: $password) {
          _id
          username
          email
        }
      }
    `;
    await this.graphql.request<{ signup: GraphqlUser }>(query, { name, email, password });
    return this.loginWithGraphql(email, password);
  }

  private loginWithFallback(email: string, password: string): AuthResult {
    const users = this.readUsers();
    const user = users.find((entry) => entry.email === email && entry.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    return {
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }

  private signupWithFallback(name: string, email: string, password: string): AuthResult {
    const users = this.readUsers();
    const alreadyExists = users.some((entry) => entry.email === email);

    if (alreadyExists) {
      throw new Error('An account with this email already exists');
    }

    const user: StoredAuthUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password
    };

    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([...users, user]));

    return {
      token: `mock-token-${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }

  private readUsers(): StoredAuthUser[] {
    const rawUsers = localStorage.getItem(MOCK_USERS_KEY);
    if (!rawUsers) {
      return [
        {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'Password123!'
        }
      ];
    }

    try {
      return JSON.parse(rawUsers) as StoredAuthUser[];
    } catch {
      localStorage.removeItem(MOCK_USERS_KEY);
      return [];
    }
  }

  private mapGraphqlUser(user: GraphqlUser): SessionUser {
    return {
      id: user._id,
      name: user.username,
      email: user.email
    };
  }
}
