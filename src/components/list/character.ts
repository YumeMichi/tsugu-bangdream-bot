import { Character } from '../../types/Character'
import { Server,getServerByPriority } from '../../types/Server'
import { drawList } from '../list'
import { Canvas, Image } from 'canvas'

interface CharacterInListOptions {
    key?: string;
    content: Array<Character>
    text?: string
}
export async function drawCharacterInList({
    key,
    content,
    text
}: CharacterInListOptions): Promise<Canvas> {
    var server = getServerByPriority(content[0].characterName)
    var list: Array<string | Image | Canvas> = []
    if (content.length == 1 && text == undefined) {
        list.push(await content[0].getIcon())
        list.push(server.getContentByServer(content[0].getCharacterName()))
        var canvas = drawList({
            key: key,
            content: list
        })
        return canvas
    }
    else{
        for (let i = 0; i < content.length; i++) {
            const character = content[i];
            list.push(await character.getIcon())
        }
        if (text != undefined) {
            list.push(text)
        }
        var canvas = drawList({
            key: key,
            content: list,
            spacing: 0
        })
        return canvas
    }

}