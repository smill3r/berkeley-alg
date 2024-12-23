import { Dealer, Router } from 'zeromq';

class Node {
    constructor(port) {
        this.port = port;
        this.timeOffset = Math.floor(Math.random() * 10000) - 5000; // Simulated offset in ms
        this.sock = new Router();
    }

    async start() {
        await this.sock.bind(`tcp://127.0.0.1:${this.port}`);
        console.log(`Node running on port ${this.port}`);

        for await (const [identity, message] of this.sock) {
            const [command, payload] = JSON.parse(message.toString());

            if (command === 'GET_TIME') {
                const currentTime = Date.now() + this.timeOffset;
                await this.sock.send([identity, JSON.stringify({ time: currentTime })]);
            } else if (command === 'ADJUST_TIME') {
                this.timeOffset += payload.adjustment;
                await this.sock.send([identity, JSON.stringify({ status: 'OK' })]);
            }
        }
    }
}

export default Node;
