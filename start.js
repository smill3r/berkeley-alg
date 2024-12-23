import Node from './node.js';
import Coordinator from './coordinator.js';

(async () => {
    const ports = [3001, 3002, 3003];
    const nodes = ports.map((port) => ({ address: `tcp://127.0.0.1:${port}` }));

    // Start nodes
    for (const port of ports) {
        const node = new Node(port);
        node.start();
    }

    // Start coordinator
    const coordinator = new Coordinator(nodes);
    await coordinator.start();
})();
