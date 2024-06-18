import { downloadFileCache } from '@/api/downloadFileCache'
import { loadImage, Image } from 'skia-canvas'
import { globalDefaultServer, serverNameFullList } from '@/config'
import { globalServerPriority, Bestdoriurl } from '@/config'
import { loadImageFromPath, convertSvgToPngBuffer } from '@/image/utils';


//服务器列表，因为有TW而不适用country
export const serverList: Array<Server> = [0, 1, 2, 3, 4]

export enum Server {
    jp, en, tw, cn, kr
}

export function getServerByServerId(serverId: number): Server {
    //如果是string，转换为number
    if (typeof serverId == 'string') {
        serverId = Number(serverId)
    }
    // 根据服务器id获取对应服务器
    return serverList[serverId]
}

export function getServerByName(name: string): Server {
    // 根据服务器名获取对应服务器
    let server: Server
    server = Server[name as keyof typeof Server];
    if (server == undefined) {
        for (let i = 0; i < serverNameFullList.length; i++) {
            if (name == serverNameFullList[i]) {
                server = i
                break;
            }
        }
    }
    return server
}

let serverIconCache: { [server: number]: Image } = {}

export async function getIcon(server: Server): Promise<Image> {
    if (serverIconCache[server]) {
        return serverIconCache[server]
    }
    let image: Image
    if (server == Server.tw) {
        image = await loadImageFromPath('./assets/tw.png')
    }
    else {
        const iconSvgBuffer = await downloadFileCache(`${Bestdoriurl}/res/icon/${Server[server]}.svg`)
        const iconPngBuffer = await convertSvgToPngBuffer(iconSvgBuffer)
        image = await loadImage(iconPngBuffer)
    }
    serverIconCache[server] = image
    return image
}

export function getServerByPriority(content: Array<any>, defaultServerList: Server[] = globalDefaultServer) {
    const serverPriority: Server[] = [...new Set([...defaultServerList, ...globalServerPriority])];
    for (let i = 0; i < serverPriority.length; i++) {
        const tempServer = serverPriority[i];
        if (content[tempServer] != null) {
            return tempServer;
        }
    }
    return undefined;
}


