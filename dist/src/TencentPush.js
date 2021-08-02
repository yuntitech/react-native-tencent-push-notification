"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TencentCloudPush = void 0;
/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:40:03
 * @LastEditTime: 2020-10-14 11:48:15
 * @LastEditors: leejunhui
 * @Description:
 */
const react_native_1 = require("react-native");
const TencentPushEventName_1 = require("./TencentPushEventName");
const NativeEventsRegistry_1 = require("./registry/NativeEventsRegistry");
const { RNTencentPush } = react_native_1.NativeModules;
class TencentCloudPush {
    constructor() {
        this.retryParamsMap = new Map();
        this.retryLeftMap = new Map();
        /**
         * 监听 腾讯推送事件回调
         * @param listener 回调处理函数
         */
        this.subscribeTPNSEvent = (eventListener) => {
            // iOS: 静默推送会来到这个方法
            this.nativeEventsRegistry.addEventListener(TencentPushEventName_1.TencentPushEventName.Message, data => {
                const notification = this.getNotificationFromData(data);
                if (notification) {
                    eventListener(notification);
                }
            });
            // 普通推送
            this.nativeEventsRegistry.addEventListener(TencentPushEventName_1.TencentPushEventName.Notification, data => {
                const notification = this.getNotificationFromData(data);
                if (notification) {
                    eventListener(notification);
                }
            });
        };
        this.getNotificationFromData = (data) => {
            let notification;
            try {
                if (react_native_1.Platform.OS === 'android') {
                    notification = data;
                }
                else {
                    const parsedCustomContent = JSON.parse(data.custom_content);
                    notification = parsedCustomContent.bookln_msg;
                }
            }
            catch (error) {
                console.log('==============wws❌❌❌: ParseNotificationError ', error);
                return null;
            }
            notification.clicked = data.clicked;
            notification.presented = data.presented;
            return notification;
        };
        this.nativeEventCallback = (eventType, data) => {
            const retryLeft = this.retryLeftMap.get(eventType) || -1;
            // 成功
            if ([TencentPushEventName_1.TencentPushEventName.BindAccountSuccess,
                TencentPushEventName_1.TencentPushEventName.RegisterSuccess].includes(eventType)) {
                this.eventEmitAndReset(eventType, data);
            }
            // 重试
            else if (retryLeft >= 0) {
                this.retryHandler(eventType, retryLeft, data);
            }
            // 失败
            else {
                this.eventEmitAndReset(eventType, data);
            }
        };
        this.nativeEventsRegistry = new NativeEventsRegistry_1.NativeEventsRegistry();
        this.nativeRetryHandler();
    }
    initTPNS(params) {
        const { pushParam, eventListener, iosDomainName, androidPushChannelParam } = params;
        const { debug, accessId, accessKey } = pushParam;
        RNTencentPush.setDebug(debug);
        if (react_native_1.Platform.OS === 'ios' && iosDomainName) {
            this.configureClusterDomainName(iosDomainName);
        }
        if (react_native_1.Platform.OS === 'android' && androidPushChannelParam) {
            this.initAndroidPushChannel(androidPushChannelParam);
        }
        this.subscribeTPNSEvent(eventListener);
        this.start(accessId, accessKey);
    }
    /**
     * 配置 TPNS 集群域名 (Android端该配置在configJson中完成)
     * @param domainName 域名
     */
    configureClusterDomainName(domainName) {
        if (react_native_1.Platform.OS === 'ios') {
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
     * @param {number} accessId
     * @param {string} accessKey
     */
    start(accessId, accessKey) {
        if (typeof accessId !== 'number') {
            console.error(`[TencentPush start] accessId is not a number.`);
        }
        if (typeof accessKey !== 'string') {
            console.error(`[TencentPush start] accessKey is not a string.`);
        }
        this.retryParamsMap.set(TencentPushEventName_1.TencentPushEventName.RegisterFail, { accessId, accessKey });
        RNTencentPush.start(accessId, accessKey);
    }
    /**
     * 停止信鸽推送服务
     */
    stop() {
        RNTencentPush.stop();
    }
    /**
     * 绑定帐号
     *
     * @param {string} account
     */
    bindAccount(account) {
        if (typeof account !== 'string') {
            console.error(`[TencentPush bindAccount] account is not a string.`);
        }
        this.retryParamsMap.set(TencentPushEventName_1.TencentPushEventName.BindAccountFail, account);
        return RNTencentPush.bindAccount(account);
    }
    /**
     * 解绑帐号
     *
     * @param {string} account
     */
    unbindAccount(account) {
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
    bindTags(tags) {
        RNTencentPush.bindTags(tags);
    }
    /**
     * 解绑标签
     *
     * @param {Array<string>} tags
     */
    unbindTags(tags) {
        RNTencentPush.unbindTags(tags);
    }
    /**
     * 获取当前角标数字
     *
     * @return {Promise} 返回 { badge: 0 }
     */
    getBadge() {
        return RNTencentPush.getBadge();
    }
    /**
     * 设置当前角标数字
     *
     * @param {number} badge
     */
    setBadge(badge) {
        if (typeof badge !== 'number') {
            console.error(`[TencentPush setBadge] badge is not a number.`);
        }
        RNTencentPush.setBadge(badge);
    }
    nativeRetryHandler() {
        this.resetRetryLeftMap();
        this.nativeEventsRegistry.addBindAccountListener(this.nativeEventCallback);
        this.nativeEventsRegistry.addRegisterListener(this.nativeEventCallback);
    }
    resetRetryLeftMap() {
        this.retryLeftMap.set(TencentPushEventName_1.TencentPushEventName.BindAccountFail, 5);
        this.retryLeftMap.set(TencentPushEventName_1.TencentPushEventName.RegisterFail, 5);
        this.retryParamsMap.delete(TencentPushEventName_1.TencentPushEventName.BindAccountFail);
        this.retryParamsMap.delete(TencentPushEventName_1.TencentPushEventName.RegisterFail);
    }
    eventEmitAndReset(eventType, data) {
        react_native_1.DeviceEventEmitter.emit(eventType, data);
        this.resetRetryLeftMap();
    }
    retryHandler(eventType, retryLeft, data) {
        this.retryLeftMap.set(eventType, retryLeft - 1);
        const account = this.retryParamsMap.get(eventType);
        switch (eventType) {
            case TencentPushEventName_1.TencentPushEventName.RegisterFail:
                const accessConfig = this.retryParamsMap.get(eventType);
                accessConfig != null ? this.start(accessConfig.accessId, accessConfig.accessKey) :
                    this.eventEmitAndReset(eventType, data);
                break;
            case TencentPushEventName_1.TencentPushEventName.BindAccountFail:
                account != null ? this.bindAccount(account) : this.eventEmitAndReset(eventType, data);
                break;
            default:
                break;
        }
    }
    /*************************** Android 独有的配置 **********************************/
    /**
     * 推送进程唤起主进程消息处理
     */
    handleNotificationIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            if (react_native_1.Platform.OS === 'android') {
                const data = yield RNTencentPush.handleNotificationIfNeeded();
                const notification = this.getNotificationFromData(data);
                return Promise.resolve(notification);
            }
            else {
                return Promise.reject({
                    message: 'android only',
                });
            }
        });
    }
    /**
     *  不好获取ReactInstanceManager引用, js那边来赋值, 用于推送进程唤起主进程
     */
    appLaunched() {
        if (react_native_1.Platform.OS === 'android') {
            RNTencentPush.appLaunched();
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
    initAndroidPushChannel(params) {
        const { enable, huawei, miPush, oppo, meizu } = params;
        if (huawei) {
            RNTencentPush.setHuaweiDebug(huawei.debugMode);
        }
        if (miPush) {
            RNTencentPush.setXiaomi(miPush.appId, miPush.appKey);
        }
        if (oppo) {
            RNTencentPush.setOppo(oppo.appKey, oppo.appSecret);
        }
        if (meizu) {
            RNTencentPush.setMeizu(meizu.appId, meizu.appKey);
        }
        RNTencentPush.enableOtherPush(enable);
    }
}
exports.TencentCloudPush = TencentCloudPush;
