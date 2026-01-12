
import * as ftp from 'basic-ftp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: '45.84.204.95', // Or ftp.45.84.204.95
    user: 'u436888800.whiteknight.academy',
    password: 'Warszawa2026!',
    port: 21,
    secure: false, // Plain FTP based on port 21
    remoteRoot: '/public_html/wp-content/plugins/wk-chess-ui'
};

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access(config);
        console.log('Connected to FTP');

        const mainDir = path.join(__dirname, '..');

        // 1. Upload PHP file
        await client.uploadFrom(path.join(mainDir, 'wk-chess-ui.php'), `${config.remoteRoot}/wk-chess-ui.php`);
        console.log('Uploaded wk-chess-ui.php');

        // 2. Upload dist folder
        // basic-ftp has a convenient uploadFromDir method
        await client.ensureDir(`${config.remoteRoot}/dist`);
        await client.uploadFromDir(path.join(__dirname, '..', 'dist'), `${config.remoteRoot}/dist`);
        console.log('Uploaded dist folder');

        console.log('Deployment Complete! 🚀');
    } catch (err) {
        console.error('Deployment Failed:', err);
    } finally {
        client.close();
    }
}

deploy();
