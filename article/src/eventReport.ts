import * as axios from 'axios';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import { processRequest, tierListOfServer } from './utils';

const url = 'http://localhost:3000';
const projectRoot: string = path.resolve(path.dirname(__dirname));

async function main(eventIdString: string) {
    const eventId = parseInt(eventIdString);
    const outputDir = `${projectRoot}/output/eventReport/${eventId}`
    await processRequest(await axios.default.post(url + '/eventReport/eventReportTitle', { eventId }), `${outputDir}/0_eventReportTitle_`);
    await processRequest(await axios.default.post(url + '/eventReport/eventReportCutoffListOfEvent', { eventId, server: 3 }), `${outputDir}/2_ycxAll_`);
    await processRequest(await axios.default.post(url + '/eventReport/eventReportPlayerNumber', { eventId, server: 3 }), `${outputDir}/3_eventReportPlayerNumber_`);
    await processRequest(await axios.default.post(url + '/ycx', { eventId, tier: 10, server: 3 }), `${outputDir}/5_eventReportCutoffDetailTop_`);
    for (let i = 0, len = tierListOfServer.cn.length; i < len; i++) {
        const tier = tierListOfServer.cn[i];
        await processRequest(await axios.default.post(url + '/eventReport/eventReportCutoffDetail', { eventId, tier, server: 3 }), `${outputDir}/6_eventReportCutoffDetail${tier}_`);
    }

    fs.copyFileSync(`${projectRoot}/assets/title1.png`, `${outputDir}/1_title1.png`);
    fs.copyFileSync(`${projectRoot}/assets/title2.png`, `${outputDir}/4_title2.png`);
};

// Read eventId from command line
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('请输入活动ID：', (answer) => {
    main(answer);
    rl.close();
});
