import { drawRarityInList } from './rarity'
import { Gacha } from '../../types/Gacha'
import { Server } from '../../types/Server'
import { stackImage } from '../utils'
import { Canvas } from 'canvas'

export async function drawGachaRateInList(gacha: Gacha, server: Server): Promise<Canvas> {
    var rates = server.getContentByServer(gacha.rates)
    var list = []
    var times = 0
    for (var i in rates) {
        let key = undefined
        if (times == 0) {
            key = '概率分布'
        }
        list.push(await drawRarityInList({
            key,
            rarity: parseInt(i),
            trainingStatus: false,
            text: ` ${rates[i].rate.toString()}%`
        }))
        times++
    }
    return(stackImage(list))
}
