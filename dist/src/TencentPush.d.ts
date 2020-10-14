import { TencentPushEventName } from './TencentPushEventName';
export declare class TencentCloudPush {
    private nativeEventsRegistry;
    private retryParamsMap;
    private retryLeftMap;
    constructor();
    /**
     * 配置 TPNS 集群域名
     * @param domainName 域名
     */
    configureClusterDomainName(domainName: string): void;
    /**
     * 设置是否开启调试模式，底层 SDK 会打印详细信息
     *
     * @param {boolean} enable
     */
    setDebug(enable: boolean): void;
    /**
     * 启动信鸽推送服务，如果是通过点击推送打开的 App，调用 start 后会触发 notification 事件
     * Android仅设置了配置未调用启动与注册代码
     *
     * @param {number} accessId
     * @param {string} accessKey
     */
    start(accessId: number, accessKey: string): void;
    /**
     * 启动并注册
     */
    registerPush(): void;
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
     * @param name 通知名
     * @param listener 回调处理函数
     */
    addEventListener(name: TencentPushEventName, listener: (data: any) => void): import("react-native").EmitterSubscription;
    private nativeRetryHandler;
    private resetRetryLeftMap;
    private nativeEventCallback;
    private eventEmitAndReset;
    private retryHandler;
    /*************************** Android 独有的配置 **********************************/
    /**
     * 设置是否开启第三方推送通道
     *
     * @param {boolean} enable
     */
    enableOtherPush(enable: boolean): void;
    /**
     * 设置是否开启华为推送的调试模式
     *
     * @param {boolean} enable
     */
    setHuaweiDebug(enable: boolean): void;
    /**
     * 配置小米推送
     *
     * @param {string} appId
     * @param {string} appKey
     */
    setXiaomi(appId: string, appKey: string): void;
    /**
     * 配置魅族推送
     *
     * @param {string} appId
     * @param {string} appKey
     */
    setMeizu(appId: string, appKey: string): void;
    /**
     * 推送进程唤起主进程消息处理
     */
    handleNotificationIfNeeded(): Promise<any>;
    /**
     *  不好获取ReactInstanceManager引用, js那边来赋值, 用于推送进程唤起主进程
     */
    appLaunched(): void;
}
