const dgram = require('dgram');

const locates = ["luz_guarita", "ar_guarita", "luz_estacionamento", "luz_galpao_externo", "luz_galpao_interno", "luz_escritorios", "ar_escritorios", "luz_sala_reunioes", "ar_sala_reunioes"];
const locateStatuses = Array(locates.length).fill(false);

const server = dgram.createSocket("udp4");
const port = 5700;

class Message {
    constructor(command, locate, value) {
        this.command = command;
        this.locate = locate;
        this.value = value;
    }
}

server.on('listening', () => {
    const address = server.address();
    console.log(`Server started at ${address.address}:${address.port}`);
});

server.on('message', (data, rinfo) => {
    let json = JSON.parse(data.toString());

    handleReceivedMessage(json, rinfo);
});

server.on('error', (err) => {
    console.error('Error in UDP server:', err);
    server.close();
});

server.bind(port);

function handleReceivedMessage(msg, rinfo) {
    if (!msg.command || !msg.locate) {
        return;
    }

    switch (msg.command) {
        case "get":
            handleGetSet(msg, rinfo, false);
            break;

        case "set":
            handleGetSet(msg, rinfo, true);
            break;

        case "get_all":
            handleGetAll(msg, rinfo);
            break;

        default:
            server.send(`ERROR, no such command: ${msg.command}`, rinfo.port, rinfo.address);
            return;
    }
}

function handleGetSet(msg, rinfo, isSet) {
    if (locates.indexOf(msg.locate) === -1) {
        server.send(`ERROR, no such locale: ${msg.locate}`);
        return;
    }

    if (isSet) {
        locateStatuses[locates.indexOf(msg.locate)] = !locateStatuses[locates.indexOf(msg.locate)];
    }

    let status = "off"
    if (locateStatuses[locates.indexOf(msg.locate)]) status = "on"

    server.send(`{"locate": "${msg.locate}", "status": "${status}"}`, rinfo.port, rinfo.address);
}

function handleGetAll(msg, rinfo) {
    server.send(`${locateStatuses.toString()}`, rinfo.port, rinfo.address);
}