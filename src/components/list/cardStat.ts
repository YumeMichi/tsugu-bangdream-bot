import { Canvas, createCanvas, Image } from "canvas";
import { drawText } from "../text";
import { drawList } from "../list";
import {stackImage} from '../utils'
import { drawRoundedRect } from "../../image/drawRect";
import { Card, Stat, limitBreakRankStat } from "../../types/Card";

export const statConfig = {
    performance: { color: '#f76da1', name: '演出' },
    technique: { color: '#4fb9eb', name: '技巧' },
    visual: { color: '#fbc74f', name: '形象' },
}

export async function drawCardStatInList(card: Card) {
    const stat = await card.calcStat()
    const statTotal = stat.performance + stat.technique + stat.visual
    const limitBreakstat = limitBreakRankStat(card.rarity)
    const limitBreakstatTotal = limitBreakstat.performance + limitBreakstat.technique + limitBreakstat.visual
    const statImage = await drawCardStatDivided(stat, statTotal, limitBreakstat)
    const list = []
    list.push(drawList({
        key: '综合力', content: [`综合力: ${statTotal} + (${limitBreakstatTotal})`]
    }))
    list.push(createCanvas(1, 5))
    list.push(statImage)
    return stackImage(list)
}

async function drawCardStatDivided(stat: Stat, statTotal: number, limitBreakstat: Stat): Promise<Canvas> {
    const widthMax = 800

    function drawStatLine(key: string, value: number, total: number): Canvas {
        const canvas = createCanvas(800, 70)
        const ctx = canvas.getContext('2d')
        const textImage = drawText({
            text: `${statConfig[key].name}: ${value} + (${limitBreakstat[key] * 4})`,
            maxWidth: widthMax,
            textSize: 30,
            lineHeight: 30
        })
        var roundedRect = drawRoundedRect({
            width: widthMax * value / total * 2,
            height: 30,
            radius: 15,
            color: statConfig[key].color,
            strokeWidth: 0
        })
        ctx.drawImage(textImage, 20, 0)
        ctx.drawImage(roundedRect, 20, 35)
        return canvas
    }
    const list = []
    for (const key in stat) {
        if (Object.prototype.hasOwnProperty.call(stat, key)) {
            const element = stat[key];
            list.push(drawStatLine(key, element, statTotal))
        }
    }
    return stackImage(list)
}