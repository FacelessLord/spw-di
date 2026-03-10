import type { OperationResult } from "./operationResult";

type AuthInfo = {
  authToken: string;
};

export type IApiClient = {
  authorize(): Promise<OperationResult<AuthInfo>>;
  send<T>(
    request: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: {},
    auth: AuthInfo,
  ): Promise<OperationResult<T>>;
};

export class ApiClient implements IApiClient {
  constructor(
    private readonly login: string,
    private readonly password: string,
  ) {}

  async send<T>(
    request: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: {},
    auth: AuthInfo,
  ) {
    return {
      success: true,
      value: null as T,
    } as OperationResult<T>;
  }
  async authorize(): Promise<OperationResult<AuthInfo>> {
    return await this.send(
      "POST",
      "/auth",
      {
        login: this.login,
        password: this.password,
      },
      null,
    );
  }
}
