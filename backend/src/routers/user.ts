import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bodyParser from 'body-parser';
import { tsuguUser, BindingStatus } from '@/config';
import { UserDB } from '@/database/userDB';
import { Player } from '@/types/Player';
import * as dotenv from 'dotenv';
import { generateVerifyCode, isServer, isServerList } from '@/routers/utils'
dotenv.config();

const router = express.Router();
let userDB: UserDB
if (process.env.LOCAL_DB == 'true') {
    userDB = new UserDB(process.env.MONGODB_URI, process.env.MONGODB_DATABASE_NAME);
    console.log(`user: 已连接至数据库: ${process.env.MONGODB_URI}`);
}
router.use(bodyParser.json());


// 查询或创建用户
router.post('/getUserData',
    [
        body('platform').isString(),
        body('user_id').isString(),
    ],
    async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ status: 'failed', data: '参数错误' });
        }

        console.log(req.ip, `${req.baseUrl}${req.path}`, req.body);
        const { platform, user_id } = req.body;
        try {
            let user = await userDB.getUser(platform, user_id);
            if (user == null) {
                user = await userDB.createUser(platform, user_id);
            }
            res.json({
                status: 'success',
                data: user
            });
        }
        catch (error) {
            res.status(400).json({ status: 'failed', data: `错误: ${error.message}` });
        }
    }
);

// 判断tsuguUser函数 (in key of tsuguUser)
function isPartialTsuguUser(obj: any): obj is Partial<tsuguUser> {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    if ('user_id' in obj && typeof obj.user_id !== 'string') {
        return false;
    }

    if ('platform' in obj && typeof obj.platform !== 'string') {
        return false;
    }

    if ('server_mode' in obj && !isServer(obj.server_mode)) {
        return false;
    }

    if ('default_server' in obj && !isServerList(obj.default_server)) {
        return false;
    }

    if ('car' in obj && typeof obj.car !== 'boolean') {
        return false;
    }

    if ('server_list' in obj) {
        if (!Array.isArray(obj.server_list) || obj.server_list.length !== 5) {
            return false;
        }

        for (const item of obj.server_list) {
            if (typeof item !== 'object' || item === null) {
                return false;
            }
            if (typeof item.playerId !== 'number') {
                return false;
            }
            if ('verifyCode' in item && typeof item.verifyCode !== 'number') {
                return false;
            }
            if (!(item.bindingStatus in BindingStatus)) {
                return false;
            }
        }
    }

    // 如果所有存在的属性都通过了检查，则返回 true
    return true;
}

// 修改用户数据
router.post('/changeUserData',
    [
        body('platform').isString(),
        body('user_id').isString(),
        body('update').custom(isPartialTsuguUser),
    ],
    async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ status: 'failed', data: '参数错误' });
        }

        req.ip
        console.log(req.ip, `${req.baseUrl}${req.path}`, req.body);
        const { platform, user_id, update } = req.body;
        try {
            const updateData = update as Partial<tsuguUser>;
            await userDB.updateUser(platform, user_id, updateData);
            res.json({ status: 'success' });
        } catch (error) {
            res.status(400).json({ status: 'failed', data: `错误: ${error.message}` });
        }
    }
);

// 绑定玩家请求，返回验证码
router.post('/bindPlayerRequest',
    [
        body('platform').isString(),
        body('user_id').isString(),
        body('server').custom(isServer),
        body('bindType').isBoolean(), //true为绑定，false为解绑
    ], async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ status: 'failed', data: '参数错误' });
        }

        console.log(req.url, req.body);
        const { platform, user_id, server } = req.body;
        try {
            let user = await userDB.getUser(platform, user_id);
            const curServer = user.server_list[server]
            //判断是否已经绑定，且请求为绑定玩家
            if (curServer.bindingStatus == BindingStatus.Success && req.body.bindType == true) {
                res.status(400).json({ status: 'failed', data: `错误: 已经绑定了玩家: ${curServer.playerId}` });
                return
            }
            //判断是否没有绑定，且请求为解绑玩家
            if (curServer.bindingStatus == BindingStatus.None && req.body.bindType == false) {
                res.status(400).json({ status: 'failed', data: `错误: 未绑定玩家` });
                return
            }
            else {
                //生成从10000到99999的随机数，且不包含64和89
                const verifyCode = generateVerifyCode()
                console.log(verifyCode)
                //只有在没有绑定玩家且请求为绑定玩家时才会修改绑定状态
                if (req.body.bindType == true && curServer.bindingStatus != BindingStatus.Success) {
                    curServer.bindingStatus = BindingStatus.Verifying
                }
                curServer.verifyCode = verifyCode
                await userDB.updateServerList(platform, user_id, server, curServer)
                res.json({ status: 'success', data: { verifyCode } });
            }
        }
        catch (error) {
            res.status(400).json({ status: 'failed', data: `错误: ${error.message}` });
        }
    }
);

// 绑定玩家验证，返回绑定结果
router.post('/bindPlayerVerification',
    [
        body('platform').isString(),
        body('user_id').isString(),
        body('server').custom(isServer),
        body('playerId').isInt(),
        body('bindType').isBoolean(), //true为绑定，false为解绑
    ],
    async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ status: 'failed', data: '参数错误' });
        }

        console.log(req.ip, `${req.baseUrl}${req.path}`, req.body);
        const { platform, user_id, server, playerId } = req.body;
        try {
            let user = await userDB.getUser(platform, user_id);
            const curServer = user.server_list[server]
            //判断是否已经绑定，且请求为绑定玩家
            if (curServer.bindingStatus != BindingStatus.Verifying && req.body.bindType == true) {
                res.status(400).json({ status: 'failed', data: `错误: 未请求绑定或解除绑定玩家` });
                return
            }
            //初始化玩家信息
            const player = new Player(parseInt(playerId), server)
            await player.initFull()
            //判断玩家是否存在
            if (!player.isExist && req.body.bindType) {
                curServer.bindingStatus = BindingStatus.None
                curServer.playerId = 0
                //删除验证码
                delete curServer.verifyCode
                // userDB.updateServerList(platform, user_id, server, curServer)
                res.status(400).json({ status: 'failed', data: `错误: 不存在玩家或服务器错误: ${playerId}` });
                return
            }
            //如果请求是解除绑定，判断是否绑定了该玩家
            if (req.body.bindType == false && curServer.playerId != playerId) {
                curServer.bindingStatus = BindingStatus.None
                curServer.playerId = 0
                //删除验证码
                delete curServer.verifyCode
                userDB.updateServerList(platform, user_id, server, curServer)
                res.status(400).json({ status: 'failed', data: `错误: playerId与已绑定玩家不符` });
                return
            }
            //判断验证码是否正确
            const verifyCode = curServer.verifyCode
            if (player.profile.mainUserDeck.deckName != verifyCode.toString() && player.profile.introduction != verifyCode.toString()) {
                if (curServer.bindingStatus == BindingStatus.Verifying) {
                    curServer.bindingStatus = BindingStatus.None
                    curServer.playerId = 0
                }
                //删除验证码
                delete curServer.verifyCode
                userDB.updateServerList(platform, user_id, server, curServer)
                const text = `错误: \n评论为: "${player.profile.introduction}", \n卡组名为: "${player.profile.mainUserDeck.deckName}", \n都与验证码不匹配`
                res.status(400).json({ status: 'failed', data: text });
                return
            }
            //如果为绑定玩家，修改绑定状态
            if (req.body.bindType == true) {
                curServer.bindingStatus = BindingStatus.Success
                curServer.playerId = playerId
                //删除验证码
                delete curServer.verifyCode
                userDB.updateServerList(platform, user_id, server, curServer)
                res.json({ status: 'success', data: `绑定玩家${playerId}成功` });
            }
            //如果为解绑玩家，修改绑定状态
            else {
                curServer.bindingStatus = BindingStatus.None
                curServer.playerId = 0
                //删除验证码
                delete curServer.verifyCode
                userDB.updateServerList(platform, user_id, server, curServer)
                res.json({ status: 'success', data: `解绑玩家${playerId}成功` });
            }
        }
        catch (error) {
            res.status(400).json({ status: 'failed', data: `错误: ${error.message}` });
        }
    }
);

export { router as userRouter }