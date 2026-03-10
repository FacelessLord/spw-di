import { createCrudApi } from "./crudApi";
import type { User } from "./userApi";

export type Comment = {
  text: string;
  author: User;
};

export type Item = {
  id: string;
  type: "draft" | "task" | "metatask";
  header: string;
  text: string;
  comments: Comment[];
};

export const createItemApi = createCrudApi<Item>;
