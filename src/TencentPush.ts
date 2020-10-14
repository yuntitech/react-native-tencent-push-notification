/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:40:03
 * @LastEditTime: 2020-10-14 11:48:15
 * @LastEditors: leejunhui
 * @Description: 
 */
import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';
import {TencentPushEventName} from './TencentPushEventName';
import {NativeEventsRegistry} from "./registry/NativeEventsRegistry";

const { RNTencentPush } = NativeModules;

export class TencentCloudPush {
    private nativeEventsRegistry: NativeEventsRegistry
    private retryParamsMap: Map<string, any> = new Map<string, any>()
    private retryLeftMap: Map<string, number> = new Map<string, number>()

    constructor() {
        this.nativeEventsRegistry = new NativeEventsRegistry();
        this.nativeRetryHandler();
    }

    /**
     * 配置 TPNS 集群域名
     * @param domainName 域名
     */
    // TODO: leejunhui 安卓端需要实现 configureClusterDomainName 原生方法
    public configureClusterDomainName(domainName: string) {
        if (Platform.OS === 'android') {

        } else if (Platform.OS === 'ios') {
            RNTencentPush.configureClusterDomainName(domainName);
        }
    }

    /**
     * 设置是否开启调试模式，底层 SDK 会打印详细信息
     *
     * @param {boolean} enable
     */
    public setDebug(enable: boolean) {
        RNTencentPush.setDebug(enable);
    }

    /**
     * 启动信鸽推送服务，如果是通过点击推送打开的 App，调用 start 后会触发 notification 事件
     * Android仅设置了配置未调用启动与注册代码
     *
     * @param {number} accessId
     * @param {string} accessKey
     */
    public start(accessId: number, accessKey: string) {
        if (typeof accessId !== 'number') {
            console.error(`[TencentPush start] accessId is not a number.`);
        }
        if (typeof accessKey !== 'string') {
            console.error(`[TencentPush start] accessKey is not a string.`);
        }
        this.retryParamsMap.set(TencentPushEventName.RegisterFail, {accessId, accessKey})
        RNTencentPush.start(accessId, accessKey);
    }

    /**
     * 启动并注册
     */
    public registerPush() {
        if (Platform.OS === 'android') {
            RNTencentPush.registerPush()
        }
    }

    /**
     * 停止信鸽推送服务
     */
    public stop() {
        RNTencentPush.stop();
    }

    /**
     * 绑定帐号
     *
     * @param {string} account
     */
    public bindAccount(account: string) {
        if (typeof account !== 'string') {
            console.error(`[TencentPush bindAccount] account is not a string.`);
        }
        this.retryParamsMap.set(TencentPushEventName.BindAccountFail, account)
        return RNTencentPush.bindAccount(account);
    }

    /**
     * 解绑帐号
     *
     * @param {string} account
     */
    public unbindAccount(account: string) {
        if (typeof account !== 'string') {
            console.error(`[TencentPush unbindAccount] account is not a string.`);
        }
        RNTencentPush.unbindAccount(account);
    }

    /**
     * 绑定标签
     *
     * @param {Array<string>} tags
     */
    public bindTags(tags: string[]) {
        RNTencentPush.bindTags(tags);
    }

    /**
     * 解绑标签
     *
     * @param {Array<string>} tags
     */
    public unbindTags(tags: string[]) {
        RNTencentPush.unbindTags(tags);
    }

    /**
     * 获取当前角标数字
     *
     * @return {Promise} 返回 { badge: 0 }
     */
    getBadge(): Promise<{ badge: number }> {
        return RNTencentPush.getBadge();
    }

    /**
     * 设置当前角标数字
     *
     * @param {number} badge
     */
    setBadge(badge: number) {
        if (typeof badge !== 'number') {
            console.error(`[TencentPush setBadge] badge is not a number.`);
        }
        RNTencentPush.setBadge(badge);
    }

    /**
     * 监听 腾讯推送事件回调
     * @param name 通知名
     * @param listener 回调处理函数
     */
    public addEventListener(name: TencentPushEventName, listener: (data: any) => void) {
        return this.nativeEventsRegistry.addEventListener(name, listener);
    }

    private nativeRetryHandler() {
        this.resetRetryLeftMap()
        this.nativeEventsRegistry.addBindAccountListener(this.nativeEventCallback)
        this.nativeEventsRegistry.addRegisterListener(this.nativeEventCallback)
    }

    private resetRetryLeftMap() {
        this.retryLeftMap.set(TencentPushEventName.BindAccountFail, 5)
        this.retryLeftMap.set(TencentPushEventName.RegisterFail, 5)
        this.retryParamsMap.delete(TencentPushEventName.BindAccountFail)
        this.retryParamsMap.delete(TencentPushEventName.RegisterFail)
    }

    private nativeEventCallback = (eventType: TencentPushEventName, data: any) => {
        const retryLeft: number = this.retryLeftMap.get(eventType) || -1
        // 成功
        if ([TencentPushEventName.BindAccountSuccess,
            TencentPushEventName.RegisterSuccess].includes(eventType)) {
            this.eventEmitAndReset(eventType, data)
        }
        // 重试
        else if (retryLeft >= 0) {
            this.retryHandler(eventType, retryLeft, data)
        }
        // 失败
        else {
            this.eventEmitAndReset(eventType, data)
        }
    }

    private eventEmitAndReset(eventType: string, data: any) {
        DeviceEventEmitter.emit(eventType, data)
        this.resetRetryLeftMap()
    }

    private retryHandler(eventType: string, retryLeft: number, data: any) {
        this.retryLeftMap.set(eventType, retryLeft - 1)
        const account = this.retryParamsMap.get(eventType)
        switch (eventType) {
            case TencentPushEventName.RegisterFail:
                if (Platform.OS === 'android') {
                    this.registerPush()
                } else {
                    const accessConfig = this.retryParamsMap.get(eventType)
                    accessConfig != null ? this.start(accessConfig.accessId, accessConfig.accessKey) :
                        this.eventEmitAndReset(eventType, data)
                }
                break
            case TencentPushEventName.BindAccountFail:
                account != null ? this.bindAccount(account) : this.eventEmitAndReset(eventType, data)
                break
            default:
                break
        }
    }

    /*************************** Android 独有的配置 **********************************/
    /**
     * 设置是否开启第三方推送通道
     *
     * @param {boolean} enable
     */
    public enableOtherPush(enable: boolean) {
        if (Platform.OS === 'android') {
            RNTencentPush.enableOtherPush(enable);
        }
    }


    /**
     * 设置是否开启华为推送的调试模式
     *
     * @param {boolean} enable
     */
    public setHuaweiDebug(enable: boolean) {
        if (Platform.OS === 'android') {
            RNTencentPush.setHuaweiDebug(enable);
        }
    }

    /**
     * 配置小米推送
     *
     * @param {string} appId
     * @param {string} appKey
     */
    public setXiaomi(appId: string, appKey: string) {
        if (Platform.OS === 'android') {
            if (typeof appId !== 'string') {
                console.error(`[TencentPush setXiaomi] appId is not a string.`);
            }
            if (typeof appKey !== 'string') {
                console.error(`[TencentPush setXiaomi] appKey is not a string.`);
            }
            RNTencentPush.setXiaomi(appId, appKey);
        }
    }

    /**
     * 配置魅族推送
     *
     * @param {string} appId
     * @param {string} appKey
     */
    public setMeizu(appId: string, appKey: string) {
        if (Platform.OS === 'android') {
            if (typeof appId !== 'string') {
                console.error(`[TencentPush setMeizu] appId is not a string.`);
            }
            if (typeof appKey !== 'string') {
                console.error(`[TencentPush setMeizu] appKey is not a string.`);
            }
            RNTencentPush.setMeizu(appId, appKey);
        }
    }

    /**
     * 推送进程唤起主进程消息处理
     */
    public handleNotificationIfNeeded(): Promise<any> {
        if (Platform.OS === 'android') {
            return RNTencentPush.handleNotificationIfNeeded();
        } else {
            return Promise.reject({
                message: 'android only',
            })
        }
    }

    /**
     *  不好获取ReactInstanceManager引用, js那边来赋值, 用于推送进程唤起主进程
     */
    public appLaunched(){
        if (Platform.OS === 'android') {
            RNTencentPush.appLaunched()
        }
    }

    
}