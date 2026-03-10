import type { IItemController } from "./itemController";
import { type OperationResult, success } from "./operationResult";
import type { Item } from "./itemApi";

export const mockItemController: IItemController = {
  async addComment(
    itemId: string,
    commentText: string,
    authorId: string,
  ): Promise<OperationResult<Item>> {
    return success({} as Item);
  },
  async changeTaskType(
    id: string,
    type: Item["type"],
  ): Promise<OperationResult<Item>> {
    return success({} as Item);
  },
};