
import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: '45.84.204.95',
    username: 'u436888800.whiteknight.academy',
    password: 'Warszawa2026!',
    remotePath: '/public_html/wp-content/plugins/wk-chess-ui',
    readyTimeout: 60000, // 60 seconds
    retries: 3
};

async function deploy() {
    const sftp = new Client();
    const assetsDir = path.join(__dirname, 'dist', 'assets');
    const viteDir = path.join(__dirname, 'dist', '.vite');
    const mainDir = path.join(__dirname, '..'); // Root for php file

    try {
        await sftp.connect(config);
        console.log('Connected to SFTP');

        // 1. Upload PHP main file
        await sftp.put(path.join(mainDir, 'wk-chess-ui.php'), `${config.remotePath}/wk-chess-ui.php`);
        console.log('Uploaded wk-chess-ui.php');

        // 2. Upload Manifest
        const manifestPath = path.join(viteDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            await sftp.mkdir(`${config.remotePath}/dist/.vite`, true);
            await sftp.put(manifestPath, `${config.remotePath}/dist/.vite/manifest.json`);
            console.log('Uploaded manifest.json');
        }

        // 3. Upload Assets
        if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir);
            await sftp.mkdir(`${config.remotePath}/dist/assets`, true);

            for (const file of files) {
                const localPath = path.join(assetsDir, file);
                const remotePath = `${config.remotePath}/dist/assets/${file}`;
                await sftp.put(localPath, remotePath);
                console.log(`Uploaded ${file}`);
            }
        }

        console.log('Deployment Complete! 🚀');
    } catch (err) {
        console.error('Deployment Failed:', err.message);
    } finally {
        sftp.end();
    }
}

deploy();
