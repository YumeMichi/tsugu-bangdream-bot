import { Room } from "../../types/Room";
import { Player } from "../../types/Player";
import { getQQUserIcon, getBandoriStationUserIcon } from "../../api/userIcon"
import { Canvas, Image, createCanvas, loadImage } from 'canvas';
import { drawDatablock } from "../dataBlock";
import { drawList, line, drawListWithLine } from "../list";
import { drawText } from "../text";
import { stackImage, stackImageHorizontal } from "../utils";
import { changeTimefomant } from './time'
import { drawPlayerCardInList } from './playerCardIconList'
import { drawDegree } from '../degree'
import { Degree } from "../../types/Degree";
import { resizeImage } from "../utils";



export async function drawRoomListTitle() {
    const canvas = createCanvas(1000, 150)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ff3b72'
    ctx.fillRect(0, 0, 1000, 150)
    ctx.drawImage(drawText({
        color: '#ffffff',
        text: '房间列表',
        lineHeight: 70,
        textSize: 70,
        maxWidth: 1000
    }), 40, 40)
    const timeText = drawText({
        color: '#ffffff',
        text: changeTimefomant(new Date().getTime()),
        lineHeight: 30,
        textSize: 30,
        maxWidth: 1000
    })
    ctx.drawImage(timeText, 960 - timeText.width, 80)
    return canvas
}

const maxWidthText = 580
export async function drawRoonInList(room: Room) {
    const timeNow = new Date().getTime()
    //头像
    let Icon: Image
    if (room.avanter != undefined) {
        Icon = await getBandoriStationUserIcon(room.avanter)
    }
    else if (room.source = 'qq') {
        Icon = await getQQUserIcon(Number(room.userId))
    }

    //文本
    const textList: Canvas[] = []
    textList.push(drawText({
        text: `${room.userName} 来自${room.source} ${(timeNow - room.time) / 1000}秒前`,
        textSize: 30,
        maxWidth: maxWidthText
    }))
    textList.push(drawText({
        text: room.rawMessage,
        textSize: 40,
        maxWidth: maxWidthText
    }))
    //画text
    const textImage = stackImage(textList)
    const canvas = createCanvas(600, textImage.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(textImage, 20, 0)
    //画icon
    const canvasLeft = createCanvas(200, 200)
    const ctxLeft = canvasLeft.getContext('2d')
    ctxLeft.drawImage(Icon, 0, 0, 180, 180)
    //合并
    const canvasUp = stackImageHorizontal([canvasLeft, canvas])
    //画竖线
    const ctxUp = canvasUp.getContext('2d')
    let height = Math.max(180, textImage.height)
    ctxUp.fillStyle = '#a8a8a8'
    ctxUp.fillRect(200, 0, 5, height)
    let list = [canvasUp]

    if (room.player?.isExist) {
        list.push(line)
        list.push(await drawPlayerDetailInRoomList(room.player))
    }
    return (drawDatablock({ list: list }))
}

async function drawPlayerDetailInRoomList(player: Player) {
    const canvas = createCanvas(800, 110)
    const ctx = canvas.getContext('2d')
    //画卡
    const cardIconList = await drawPlayerCardInList(player, undefined, true, 100)
    ctx.drawImage(cardIconList, -20, 10)
    //画综合力
    const stat = await player.calcStat()
    let statText:string
    if(player.profile.publishTotalDeckPowerFlg){
        statText = `综合力: ${Math.floor(stat.performance + stat.technique + stat.visual)}`
    }
    else{
        statText = `综合力: 未公开`
    }
    const statTextImage = drawText({
        text: statText,
        textSize: 30,
        lineHeight: 50,
        maxWidth: 400
    })
    ctx.drawImage(statTextImage, 800 - statTextImage.width, 0)

    //画牌子
    var degreeImageList: Array<Canvas | Image> = []
    var userProfileDegreeMap = player.profile.userProfileDegreeMap.entries
    for (var i in userProfileDegreeMap) {
        var tempDegree = userProfileDegreeMap[i]
        var tempDegreeImage = await drawDegree(new Degree(tempDegree.degreeId), player.server)
        degreeImageList.push(resizeImage({
            image: tempDegreeImage,
            heightMax: 35
        }))
        degreeImageList.push(createCanvas(10, 35))
    }
    degreeImageList.pop()
    const degreeListImage = stackImageHorizontal(degreeImageList)
    ctx.drawImage(degreeListImage, 800 - degreeListImage.width, 56)
    return canvas
}