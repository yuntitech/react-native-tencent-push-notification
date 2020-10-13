"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TencentCloudPush = void 0;
/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:40:03
 * @LastEditTime: 2020-10-13 16:06:09
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
    /**
     * 设置是否开启调试模式，底层 SDK 会打印详细信息
     *
     * @param {boolean} enable
     */
    setDebug(enable) {
        RNTencentPush.setDebug(enable);
    }
    /**
     * 启动信鸽推送服务，如果是通过点击推送打开的 App，调用 start 后会触发 notification 事件
     * Android仅设置了配置未调用启动与注册代码
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
     * 启动并注册
     */
    registerPush() {
        if (react_native_1.Platform.OS === 'android') {
            RNTencentPush.registerPush();
        }
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
    /**
     * 监听 腾讯推送事件回调
     * @param name 通知名
     * @param listener 回调处理函数
     */
    addEventListener(name, listener) {
        return this.nativeEventsRegistry.addEventListener(name, listener);
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
                if (react_native_1.Platform.OS === 'android') {
                    this.registerPush();
                }
                else {
                    const accessConfig = this.retryParamsMap.get(eventType);
                    accessConfig != null ? this.start(accessConfig.accessId, accessConfig.accessKey) :
                        this.eventEmitAndReset(eventType, data);
                }
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
     * 设置是否开启第三方推送通道
     *
     * @param {boolean} enable
     */
    enableOtherPush(enable) {
        if (react_native_1.Platform.OS === 'android') {
            RNTencentPush.enableOtherPush(enable);
        }
    }
    /**
     * 设置是否开启华为推送的调试模式
     *
     * @param {boolean} enable
     */
    setHuaweiDebug(enable) {
        if (react_native_1.Platform.OS === 'android') {
            RNTencentPush.setHuaweiDebug(enable);
        }
    }
    /**
     * 配置小米推送
     *
     * @param {string} appId
     * @param {string} appKey
     */
    setXiaomi(appId, appKey) {
        if (react_native_1.Platform.OS === 'android') {
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
    setMeizu(appId, appKey) {
        if (react_native_1.Platform.OS === 'android') {
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
    handleNotificationIfNeeded() {
        if (react_native_1.Platform.OS === 'android') {
            return RNTencentPush.handleNotificationIfNeeded();
        }
        else {
            return Promise.reject({
                message: 'android only',
            });
        }
    }
    /**
     *  不好获取ReactInstanceManager引用, js那边来赋值, 用于推送进程唤起主进程
     */
    appLaunched() {
        if (react_native_1.Platform.OS === 'android') {
            RNTencentPush.appLaunched();
        }
    }
}
exports.TencentCloudPush = TencentCloudPush;
