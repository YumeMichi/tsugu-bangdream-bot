import { drawSongMetaList } from '@/view/songMetaList';
import { Server, getServerByServerId } from '@/types/Server';
import { listToBase64, isServerList, isServer } from '@/routers/utils';
import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post('/', [
    // Define validation rules for request body
    body('default_servers').custom(isServerList),
    body('server').custom(isServer),
    body('compress').optional().isBoolean(),
], async (req, res) => {
    console.log(req.ip,`${req.baseUrl}${req.path}`, req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send([{ type: 'string', string: '参数错误' }]);
    }

    const { default_servers, server, compress } = req.body;

    try {
        const result = await commandSongMeta(default_servers, getServerByServerId(server), compress);
        res.send(listToBase64(result));
    } catch (e) {
        console.log(e);
        res.send([{ type: 'string', string: '内部错误' }]);
    }
});

export async function commandSongMeta(default_servers: Server[], server: Server, compress:boolean): Promise<Array<Buffer | string>> {
    for(let i = 0; i < default_servers.length; i++) {
        default_servers[i] = getServerByServerId(default_servers[i])
    }
    if (server == undefined) {
        server = default_servers[0]
    }
    return await drawSongMetaList(server, compress)
}

export { router as songMetaRouter }