export type OperationSuccess<T> = {
  success: true;
  value: T;
};
type OperationFailure = {
  success: false;
  error: Error;
};
export type OperationResult<T> = OperationSuccess<T> | OperationFailure;

export const success = <T>(value: T): OperationSuccess<T> => ({
  success: true,
  value,
});
export const failure = (error: Error): OperationFailure => ({
  success: false,
  error,
});

export const isFailure = <T>(
  result: OperationResult<T>,
): result is OperationFailure => {
  return result.success === false;
};
export const isSuccess = <T>(
  result: OperationResult<T>,
): result is OperationSuccess<T> => {
  return result.success;
};

export function ensureSuccess<T>(
  result: OperationResult<T>,
): asserts result is OperationSuccess<T> {
  if (isFailure(result)) throw result.error;
  return;
}
