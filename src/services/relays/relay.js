import { Subject } from "rxjs";

export class Relay {
  constructor(url) {
    this.url = url;

    this.onOpen = new Subject();
    this.onClose = new Subject();
    this.onEvent = new Subject();
    this.onNotice = new Subject();
  }

  open() {
    if (this.okay) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onOpen.next(this);

      if (import.meta.env.DEV) {
        console.info(`Relay ${this.url} opened`);
      }
    };
    this.ws.onclose = () => {
      this.onClose.next(this);

      if (import.meta.env.DEV) {
        console.info(`Relay ${this.url} closed`);
      }
    };
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  send(json) {
    if (this.connected) {
      this.ws.send(JSON.stringify(json));
    }
  }
  close() {
    this.ws?.close();
  }

  get okay() {
    return this.connected || this.connecting;
  }
  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  get connecting() {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }
  get closing() {
    return this.ws?.readyState === WebSocket.CLOSING;
  }
  get closed() {
    return this.ws?.readyState === WebSocket.CLOSED;
  }
  get state() {
    return this.ws?.readyState;
  }

  handleMessage(event) {
    // skip empty events
    if (!event.data) return;

    try {
      const data = JSON.parse(event.data);
      const type = data[0];

      switch (type) {
        case "EVENT":
          this.onEvent.next({ type, subId: data[1], body: data[2] }, this);
          break;
        case "NOTICE":
          this.onNotice.next({ type, message: data[1] }, this);
          break;
      }
    } catch (e) {
      console.log(`Failed to parse event from ${this.url}`);
      console.log(event.data);
    }
  }
}
