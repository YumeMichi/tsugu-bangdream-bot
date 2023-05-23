import { Gacha } from "../../types/Gacha";
import { drawDatablock, drawListWithLine, drawListByServerList } from "../list";
import { drawCharacterInList } from '../list/character'
import { drawAttributeInList } from "../list/attribute";
import { drawTimeInList } from "../list/time";
import { drawText } from "../text";
import { createCanvas, Image, Canvas } from "canvas";
import{draweventBannerImageCanvas} from './utils'

export async function drawGachaDatablock(gacha: Gacha, topLeftText?: string) {
    var list = []
    var gachaBannerImage = await gacha.getBannerImage()
    var gachaBannerImageCanvas = draweventBannerImageCanvas(gachaBannerImage)
    list.push(gachaBannerImageCanvas)

    var textImageList: Array<Canvas> = []
    /*
    //卡池名称
    textImageList.push(await drawListByServerList({
        content: gacha.gachaName
    }))
    */

    //卡池类型与ID
    textImageList.push(drawText({
        text: `${gacha.getTypeName()}   ID: ${gacha.gachaId}`,
        maxWidth: 800
    }))

    /*
    //卡池时间
    textImageList.push(await drawTimeInList({
        content: gacha.startAt
    }))
    */

    //画左侧有竖线的排版
    var textImageListImage = drawListWithLine(textImageList)
    list.push(textImageListImage)

    return (drawDatablock({ list, topLeftText }))
}
