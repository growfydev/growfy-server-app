export interface PostPublisher {
  publish(
    accountId: string,
    token: string,
    typePostName: string,
    fields: any,
  ): Promise<void>;
}
