import { Listener } from "./listener";

export type response = {
  body: string
  err: string
};

export abstract class CommonConnect<requests> {
  readonly listener = new Listener<requests, response>();

  abstract connect(uri: string): Promise<response>;
  abstract disconnect(): Promise<response>;

  abstract sendImmediate(message: string): Promise<response>;
  abstract queueSend(message: string): void;
  abstract sendQueue(message: string): Promise<response>;

  abstract buildMessenger(): Messenger<requests>;
}

export abstract class Messenger<requests> {
  readonly listener = new Listener<requests, response>();

  abstract sendImmediate(message: string): Promise<response>;
  abstract queueSend(message: string): void;
  abstract sendQueue(message: string): Promise<response>;
}