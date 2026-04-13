/**
 * INFRASTRUCTURE LAYER - HTTP Client
 *
 * Fornece uma abstracao GENERICA para comunicacao HTTP.
 * Nao conhece nada sobre filmes, dominio ou regras de negocio.
 *
 * A interface HttpClient permite que a camada de dados
 * nao dependa diretamente do fetch() do browser.
 * Em testes, podemos substituir por um mock facilmente.
 */

export interface HttpClient {
  get<T>(endpoint: string): Promise<T>;
}

export class FetchHttpClient implements HttpClient {
  readonly baseUrl: string;
  readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
