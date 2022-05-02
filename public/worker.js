let fileChunks = [];
self.addEventListener("message", handleMessage);

function handleMessage(message) {
    if (message.data === "download") {
        const fileBlob = new Blob(array);
        self.postMessage(fileBlob);
        array = [];
    } else if (message.data === "abort") {
        array = [];
    } else {
        array.push(message.data);
        console.info('[worker] Adding Data', message.data);
    }
}