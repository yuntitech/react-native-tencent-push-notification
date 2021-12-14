export declare type PushParam = {
    debug: boolean;
    accessId: string;
    accessKey: string;
};
export declare type TpnsEventListener = {
    (pushNotification: PushNotification): void;
};
export declare type AndroidPushChannelParam = {
    enable: boolean;
    huawei?: HuaWeiOption;
    meizu?: MeizuOption;
    oppo?: OppoOption;
    miPush?: MiPushOption;
};
export declare type MiPushOption = {
    appId?: string;
    appKey?: string;
};
export declare type HuaWeiOption = {
    debugMode?: boolean;
};
export declare type MeizuOption = {
    appId: string;
    appKey: string;
};
export declare type OppoOption = {
    appKey: string;
    appSecret: string;
};
export declare type PushNotification = {
    tp: number;
    msg: string;
    st: string;
    pushId?: number;
    type: number;
    sellerId?: string;
    pushPlanId?: number;
    pushRecordId?: number;
    msgGroupScene?: string;
    groupId?: string;
    clicked: boolean;
    presented: boolean;
    isIM: boolean;
    isSilentPush: boolean;
    ext?: string;
};
export declare class TencentCloudPush {
    private nativeEventsRegistry;
    private retryParamsMap;
    private retryLeftMap;
    constructor();
    initTPNS(params: {
        pushParam: PushParam;
        eventListener: TpnsEventListener;
        iosDomainName?: string;
        androidPushChannelParam?: AndroidPushChannelParam;
    }): void;
    /**
     * 配置 TPNS 集群域名 (Android端该配置在configJson中完成)
     * @param domainName 域名
     */
    private configureClusterDomainName;
    /**
     * 设置是否开启调试模式，底层 SDK 会打印详细信息
     *
     * @param {boolean} enable
     */
    /**
     * 启动信鸽推送服务，如果是通过点击推送打开的 App，调用 start 后会触发 notification 事件
     *
     * @param {string} accessId
     * @param {string} accessKey
     */
    private start;
    /**
     * 停止信鸽推送服务
     */
    stop(): void;
    /**
     * 绑定帐号
     *
     * @param {string} account
     */
    bindAccount(account: string): any;
    /**
     * 解绑帐号
     *
     * @param {string} account
     */
    unbindAccount(account: string): void;
    /**
     * 绑定标签
     *
     * @param {Array<string>} tags
     */
    bindTags(tags: string[]): void;
    /**
     * 解绑标签
     *
     * @param {Array<string>} tags
     */
    unbindTags(tags: string[]): void;
    /**
     * 获取当前角标数字
     *
     * @return {Promise} 返回 { badge: 0 }
     */
    getBadge(): Promise<{
        badge: number;
    }>;
    /**
     * 设置当前角标数字
     *
     * @param {number} badge
     */
    setBadge(badge: number): void;
    /**
     * 监听 腾讯推送事件回调
     * @param listener 回调处理函数
     */
    subscribeTPNSEvent: (eventListener: TpnsEventListener) => void;
    private getNotificationFromData;
    private nativeRetryHandler;
    private resetRetryLeftMap;
    private nativeEventCallback;
    private eventEmitAndReset;
    private retryHandler;
    /*************************** Android 独有的配置 **********************************/
    /**
     * 推送进程唤起主进程消息处理
     */
    handleNotificationIfNeeded(): Promise<PushNotification | null>;
    /**
     *  不好获取ReactInstanceManager引用, js那边来赋值, 用于推送进程唤起主进程
     */
    appLaunched(): void;
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
    private initAndroidPushChannel;
}
