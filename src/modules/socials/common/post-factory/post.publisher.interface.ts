export interface PostPublisher {
  publish(typePostName: string, fields: any, data: any): Promise<void>;
}
