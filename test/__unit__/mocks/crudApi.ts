import {
  ensureSuccess,
  failure,
  type OperationResult,
  success,
} from "./operationResult";
import type { IApiClient } from "./apiClient";

type HasId = {
  id: string;
};

export type ICrudApi<T extends HasId> = {
  create: (item: T) => Promise<OperationResult<T>>;
  get: (itemId: string) => Promise<OperationResult<T>>;
  update: (item: T) => Promise<OperationResult<T>>;
  delete: (itemId: string) => Promise<OperationResult<T>>;
};

export const createCrudApi = async <T extends HasId>(
  apiClient: IApiClient,
): Promise<ICrudApi<T>> => {
  const authResult = await apiClient.authorize();
  ensureSuccess(authResult);

  const storage = new Map<string, T>();

  return {
    create: async (item: T) => {
      if (!item?.id) return failure(new Error("NRE"));
      storage.set(item.id, item);
      return success(item);
    },
    get: async (itemId: string) => {
      if (!itemId || !storage.has(itemId)) return failure(new Error("NRE"));
      return success(storage.get(itemId));
    },
    update: async (item: T) => {
      if (!item.id || !storage.has(item.id)) return failure(new Error("NRE"));
      storage.set(item.id, item);
      return success(item);
    },
    delete: async (itemId: string) => {
      if (!itemId || !storage.has(itemId)) return failure(new Error("NRE"));
      const item = storage.get(itemId);
      storage.delete(itemId);

      return success(item);
    },
  };
};
