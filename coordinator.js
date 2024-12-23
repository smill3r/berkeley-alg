import { Dealer } from 'zeromq';

class Coordinator {
    constructor(nodes) {
        this.nodes = nodes; // List of { address: "tcp://127.0.0.1:PORT" }
        this.period = 10000; // Synchronization period in ms
    }

    async getTimeFromNode(address) {
        const sock = new Dealer();
        await sock.connect(address);

        await sock.send(JSON.stringify(['GET_TIME', null]));
        const [message] = await sock.receive();
        sock.close();

        const response = JSON.parse(message.toString());
        return response.time;
    }

    async adjustTimeInNode(address, adjustment) {
        const sock = new Dealer();
        await sock.connect(address);

        await sock.send(JSON.stringify(['ADJUST_TIME', { adjustment }]));
        const [message] = await sock.receive();
        sock.close();

        const response = JSON.parse(message.toString());
        return response.status;
    }

    async synchronize() {
        console.log('Starting synchronization...');

        const times = [];
        for (const { address } of this.nodes) {
            try {
                const time = await this.getTimeFromNode(address);
                times.push({ address, time });
                console.log(`Time from ${address}: ${new Date(time)}`);
            } catch (err) {
                console.error(`Error getting time from ${address}:`, err.message);
            }
        }

        if (times.length === 0) {
            console.error('No times received. Skipping synchronization.');
            return;
        }

        const averageTime = Math.round(
            times.reduce((acc, { time }) => acc + time, 0) / times.length
        );
        console.log(`Calculated average time: ${new Date(averageTime)}`);

        for (const { address, time } of times) {
            const adjustment = averageTime - time;
            try {
                const status = await this.adjustTimeInNode(address, adjustment);
                console.log(`Adjusted time for ${address} by ${adjustment} ms (Status: ${status})`);
            } catch (err) {
                console.error(`Error adjusting time for ${address}:`, err.message);
            }
        }
    }

    async start() {
        while (true) {
            await this.synchronize();
            await new Promise((resolve) => setTimeout(resolve, this.period));
        }
    }
}

export default Coordinator;
