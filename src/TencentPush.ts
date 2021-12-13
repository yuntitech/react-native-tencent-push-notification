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

export type PushParam = {
    debug:boolean,
    accessId: string,
    accessKey: string
}

export type TpnsEventListener = {
    (pushNotification: PushNotification):void
}

export type AndroidPushChannelParam ={
    enable:boolean,
    huawei?:HuaWeiOption,
    meizu?:MeizuOption,
    oppo?:OppoOption,
    miPush?:MiPushOption
}

export type MiPushOption = {
    appId?:string
    appKey?:string
}

export type HuaWeiOption = {
    debugMode?:boolean
}

export type MeizuOption = {
    appId:string
    appKey:string
}

export type OppoOption = {
    appKey:string;
    appSecret:string
}

export type PushNotification = {
    tp: number; // 消息类型
    msg: string; // 消息内容
    st: string; // 消息发送时间
    pushId?: number; // 原推送消息
    type: number; // 消息创建类型（1=手工创建，2=系统创建）
    sellerId?: string; //  商家ID
    pushPlanId?: number; // （新增）智能推送ID（消息送达、点击上报埋点）
    pushRecordId?: number; // （新增）推送记录ID
    msgGroupScene?: string; // （新增）站内信场景（跳转到某一消息中心）
    groupId?: string; // （新增）站内信组Id
    clicked: boolean; // 用户是否已经点击
    presented: boolean; // 安卓上显示送达
    isIM:boolean; //是否是IM离线推送
    isSilentPush:boolean; //是否是静默推送
  }

export class TencentCloudPush {
    private nativeEventsRegistry: NativeEventsRegistry
    private retryParamsMap: Map<string, any> = new Map<string, any>()
    private retryLeftMap: Map<string, number> = new Map<string, number>()

    constructor() {
        this.nativeEventsRegistry = new NativeEventsRegistry();
        this.nativeRetryHandler();
    }

    public initTPNS(params:{pushParam:PushParam,eventListener:TpnsEventListener,iosDomainName?:string,androidPushChannelParam?:AndroidPushChannelParam}){
        const {pushParam,eventListener,iosDomainName,androidPushChannelParam} = params 
        const { debug, accessId , accessKey } = pushParam
        RNTencentPush.setDebug(debug);
        if(Platform.OS === 'ios' && iosDomainName){       
             this.configureClusterDomainName(iosDomainName)
        }
        if(Platform.OS === 'android' && androidPushChannelParam){
            this.initAndroidPushChannel(androidPushChannelParam)
        }
        this.subscribeTPNSEvent(eventListener)
        this.start(accessId,accessKey)
    }

    /**
     * 配置 TPNS 集群域名 (Android端该配置在configJson中完成)
     * @param domainName 域名
     */
    private configureClusterDomainName(domainName: string) {
        if (Platform.OS === 'ios') {
            RNTencentPush.configureClusterDomainName(domainName);
        }
    }

    /**
     * 设置是否开启调试模式，底层 SDK 会打印详细信息
     *
     * @param {boolean} enable
     */
    // private setDebug(enable: boolean) {
    //     RNTencentPush.setDebug(enable);
    // }

    /**
     * 启动信鸽推送服务，如果是通过点击推送打开的 App，调用 start 后会触发 notification 事件
     *
     * @param {string} accessId
     * @param {string} accessKey
     */
     private start(accessId: string, accessKey: string) {
        this.retryParamsMap.set(TencentPushEventName.RegisterFail, {accessId, accessKey})
        RNTencentPush.start(accessId, accessKey);
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
     * @param listener 回调处理函数
     */

    public subscribeTPNSEvent = (eventListener:TpnsEventListener) => {

        // iOS: 静默推送会来到这个方法
        this.nativeEventsRegistry.addEventListener(TencentPushEventName.Message, data => {            
            const notification = this.getNotificationFromData({...data,isSilentPush:true})
            if(notification){
                eventListener(notification);
            }
        });
    
        // 普通推送
        this.nativeEventsRegistry.addEventListener(TencentPushEventName.Notification, data => {
            const notification = this.getNotificationFromData({...data,isSilentPush:false})
            if(notification){
                eventListener(notification);
            }
        });
     };

     private getNotificationFromData = (data:any): PushNotification | null => {
        let notification: PushNotification;
        try {
          if (Platform.OS === 'android') {
            notification = data;
          } else {
            if(data.custom_content){
                const parsedCustomContent = JSON.parse(data.custom_content);
                notification = parsedCustomContent.bookln_msg;         
             }else{
                notification = data
             }
          }
        } catch (error) {
          console.log('==============wws❌❌❌: ParseNotificationError ', error);
          return null;
        }
    
        notification.clicked = data.clicked;
        notification.presented = data.presented;
        notification.isIM = data.isIM;
        return notification;
      };

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
                    const accessConfig = this.retryParamsMap.get(eventType)
                    accessConfig != null ? this.start(accessConfig.accessId, accessConfig.accessKey) :
                        this.eventEmitAndReset(eventType, data)
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
     * 推送进程唤起主进程消息处理
     */
    public async handleNotificationIfNeeded(): Promise<PushNotification | null> {
        if (Platform.OS === 'android') {
           const data = await RNTencentPush.handleNotificationIfNeeded()
           const notification = this.getNotificationFromData(data)
            return Promise.resolve(notification);
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
    /**
     * 
     * 调用需要在 @function start() 前
     * vivo没有需要在这里配置的内容 enable为true就可以启动
     * 
     * @param enable
     * @param hwOption 
     * @param meizu 
     * @param oppo 
     * @param miPush 
     */
    private initAndroidPushChannel(params:AndroidPushChannelParam){
        const { enable , huawei , miPush , oppo , meizu } = params
        if(huawei){
            RNTencentPush.setHuaweiDebug(huawei.debugMode);
        }
        if(miPush){
            RNTencentPush.setXiaomi(miPush.appId, miPush.appKey);
        }
        if(oppo){
            RNTencentPush.setOppo(oppo.appKey,oppo.appSecret)
        }
        if(meizu){
            RNTencentPush.setMeizu(meizu.appId,meizu.appKey)
        }
        RNTencentPush.enableOtherPush(enable);
    }
    
}