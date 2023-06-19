import { drawCutoffDetail } from '../view/cutoffDetail'
import { Server, getServerByName } from '../types/Server';
import { getPresentEvent } from '../types/Event'
import { listToBase64, isServer } from './utils';
import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
    console.log(req.baseUrl, req.body)

    const { server, tier, eventId } = req.body;
    // 检查类型是否正确
    if (
        !isServer(server) ||
        typeof tier !== 'number' ||
        (typeof eventId !== 'number' && eventId !== undefined)
    ) {
        res.status(404).send('错误: 参数类型不正确');
        return;
    }
    try {
        const result = await commandYcx(server, tier, eventId);
        res.send(listToBase64(result));
    } catch (e) {
        console.log(e)
    res.status(400).send([{ type: 'string', string: '内部错误' }]);
    }
});

export async function commandYcx(server: Server, tier: number, eventId?: number): Promise<Array<Buffer | string>> {
    if (!tier) {
        return ['请输入排名']
    }
    if (!eventId) {
        eventId = getPresentEvent(server).eventId
    }
    return await drawCutoffDetail(eventId, tier, server)

}

export { router as ycxRouter }