import { PostEditor } from "./post.editor.interface";
import { PostPublisher } from "./post.publisher.interface";

export interface PostFactory{
    createPublisher(): PostPublisher;
    createEditor(): PostEditor;

}