import { ChannelBase, ClientBase, ConnectionBase } from "../connBase.js";
export class PeerConnection extends ConnectionBase {
    Peer;
    prefix;
    constructor(Peer, prefix) {
        super();
        this.Peer = Peer;
        this.prefix = prefix;
    }
    createNewClient(id, heartbeatInterval) { return new PeerClient(id, this, heartbeatInterval); }
    getFullId(id) { return this.prefix + id; }
    getLocalId(id) { return id.replace(this.prefix, ""); } // strip prefix
}
export class PeerClient extends ClientBase {
    peer;
    waitingForPeerOpen = null;
    conns = new Map(); // maps between client id and peerjs.conn object
    constructor(id, connection, heartbeatInterval) {
        super(id, connection, heartbeatInterval);
        this.peer = new connection.Peer(this.fullId);
        this.peer.on("open", (id) => {
            this.setReadyState(this.id, true); // self is ready
            console.log("ready to send!");
        });
        this.peer.on('connection', (conn) => {
            conn.on('data', (data) => {
                data = String(data); // stringify in case not yet
                this.listener.trigger("receive", data);
            });
            this.addPeerConnection(conn);
        });
        this.listener.on("readystatechange", (id) => {
            if (id == this.id && this.getReadyState(id) && this.waitingForPeerOpen) {
                this.waitingForPeerOpen();
                this.waitingForPeerOpen = null;
            }
        }, 200); // give high priority
    }
    addPeerConnection(conn) {
        const id = this.conn.getLocalId(conn.peer);
        this.setReadyState(id, true);
        this.conns.set(id, conn);
    }
    createNewChannel(id) { return new PeerChannel(id, this); }
    connectTo(id) {
        return new Promise((resolve, reject) => {
            if (this.getReadyState(this.id))
                return this.doConnectTo(id, resolve); // already able to connect
            this.waitingForPeerOpen = this.doConnectTo.bind(this, id, resolve); // wait until able to connect
        });
    }
    doConnectTo(id, resolve) {
        if (this.conns.has(id)) { // connection alrady established
            resolve(true);
            return;
        }
        const conn = this.peer.connect(this.conn.getFullId(id));
        conn.on("open", () => {
            this.conns.set(id, conn);
            this.setReadyState(id, true);
            resolve(true);
        });
        conn.on("data", (data) => {
            data = String(data); // stringify, just in case
            this.listener.trigger("receive", data);
        });
        this.conns.set(id, null); // indicate processing
    }
    async disconnectFrom(id) {
        if (this.conns.has(id)) {
            this.conns.get(id).close();
            this.conns.delete(id);
        }
        else
            return false; // error occurred
    }
    get fullId() { return this.conn.getFullId(this.id); }
    getConn(id) {
        return this.conns.get(id) ?? null;
    }
}
export class PeerChannel extends ChannelBase {
    doSend(msg, recipientId) {
        const conn = this.client.getConn(recipientId);
        if (conn) {
            conn.send(msg);
        }
        else {
            console.log("invalid!");
        }
    }
}
//# sourceMappingURL=peer.js.map