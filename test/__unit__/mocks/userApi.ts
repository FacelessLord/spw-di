import { createCrudApi } from "./crudApi";

export type User = {
  id: string;
  name: string;
};

export const createUserApi = createCrudApi<User>;
