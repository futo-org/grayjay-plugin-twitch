import { createServer } from "node:http";
import { networkInterfaces } from 'os';
import { readFile } from "node:fs/promises";
const PORT = 8080;
// Define a map of files to serve
const files = {
    "/TwitchScript.js": {
        content: await readFile("TwitchScript.js"),
        type: "application/javascript",
    },
    "/TwitchConfig.json": {
        content: await readFile("TwitchConfig.json"),
        type: "application/json",
    },
    "/twitch.png": {
        content: await readFile("twitch.png"),
        type: "image/png",
    },
};
function getLocalIPAddress() {
    const br = networkInterfaces();
    const network_devices = Object.values(br);
    if (network_devices !== undefined) {
        for (const network_interface of network_devices) {
            if (network_interface === undefined) {
                continue;
            }
            for (const { address, family } of network_interface) {
                if (family === "IPv4" && address !== "127.0.0.1") {
                    return address;
                }
            }
        }
    }
    throw new Error("panic");
}
createServer((req, res) => {
    const file = (() => {
        switch (req.url) {
            case "/TwitchScript.js":
                return files[req.url];
            case "/TwitchConfig.json":
                return files[req.url];
            case "/twitch.png":
                return files[req.url];
            default:
                return undefined;
        }
    })();
    if (file !== undefined) {
        res.writeHead(200, { "Content-Type": file.type });
        res.end(file.content);
        return;
    }
    res.writeHead(404);
    res.end("File not found");
    return;
}).listen(PORT, () => {
    console.log(`Server running at http://${getLocalIPAddress()}:${PORT}/TwitchConfig.json`);
});
//# sourceMappingURL=server.js.map
