const { Transform } = require("node:stream");
const fs = require("node:fs/promises");

class Encrypt extends Transform {
    constructor(totalSize) {
        super();
        this.totalSize = totalSize;
        this.bytesProcessed = 0;
    }

    calculateAndLogProgress() {
        let percentage = ((this.bytesProcessed / this.totalSize) * 100).toFixed(2);
        if (percentage > 100) {
            percentage = 100;
        }
        console.log(`Progress: ${percentage}%`);
    }

    _transform(chunk, encoding, callback) {
        this.bytesProcessed += chunk.length;
        // <34 + 1, ff, a4 + 1, 11 + 1, 22 + 1....>
        for (let i = 0; i < chunk.length; ++i) {
            if (chunk[i] !== 255) {
                chunk[i] = chunk[i] + 1;
            }
        }
        callback(null, chunk);
    }
}
(async () => {
    const readFileHandle = await fs.open("read.txt", "r");
    const writeFileHandle = await fs.open("write.txt", "w");
    const { size: totalSize } = await readFileHandle.stat()

    const readStream = readFileHandle.createReadStream();
    const writeStream = writeFileHandle.createWriteStream();

    const encrypt = new Encrypt(totalSize);

    readStream.pipe(encrypt).pipe(writeStream);
    const interval = setInterval(() => {
        encrypt.calculateAndLogProgress();
        if (encrypt.bytesProcessed >= totalSize) {
            clearInterval(interval);
        }
    }, 200);

    readStream.pipe(encrypt).pipe(writeStream);

    writeStream.on('finish', () => {
        console.log('Encryption and writing completed.');
    });
})();