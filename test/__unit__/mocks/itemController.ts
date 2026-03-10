import { isFailure, type OperationResult } from "./operationResult";
import type { Comment, Item } from "./itemApi";
import type { ICrudApi } from "./crudApi";
import type { User } from "./userApi";

export interface IItemController {
  changeTaskType(
    id: string,
    type: Item["type"],
  ): Promise<OperationResult<Item>>;
  addComment(
    itemId: string,
    commentText: string,
    authorId: string,
  ): Promise<OperationResult<Item>>;
}

export class ItemController implements IItemController {
  constructor(
    private readonly itemApi: ICrudApi<Item>,
    private readonly userApi: ICrudApi<User>,
  ) {}

  async changeTaskType(id: string, type: Item["type"]) {
    const itemResult: OperationResult<Item> = await this.itemApi.get(id);
    if (isFailure(itemResult)) return itemResult;
    const item = itemResult.value;
    item.type = type;
    return await this.itemApi.update(item);
  }
  async addComment(itemId: string, commentText: string, authorId: string) {
    const itemResult = await this.itemApi.get(itemId);
    if (isFailure(itemResult)) return itemResult;
    const userResult = await this.userApi.get(authorId);
    if (isFailure(userResult)) return userResult;

    const item = itemResult.value;
    const comment: Comment = {
      text: commentText,
      author: userResult.value,
    };
    item.comments.push(comment);
    return await this.itemApi.update(item);
  }
}
