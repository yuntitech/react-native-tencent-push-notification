"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeEventsRegistry = void 0;
/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:41:04
 * @LastEditTime: 2020-10-13 15:40:59
 * @LastEditors: leejunhui
 * @Description: 原生事件注册表
 */
const react_native_1 = require("react-native");
const TencentPushEventName_1 = require("../TencentPushEventName");
const { RNTencentPush } = react_native_1.NativeModules;
/**
 * 原生事件注册表
 */
class NativeEventsRegistry {
    constructor() {
        try {
            this.emitter = new react_native_1.NativeEventEmitter(RNTencentPush);
        }
        catch (e) {
            this.emitter = {
                addListener: () => {
                    return {
                        remove: () => undefined,
                    };
                },
            };
        }
    }
    addBindAccountListener(callback) {
        return this.emitter.addListener('bindAccount', data => {
            callback(data.error === 0 ? TencentPushEventName_1.TencentPushEventName.BindAccountSuccess : TencentPushEventName_1.TencentPushEventName.BindAccountFail, data);
        });
    }
    addRegisterListener(callback) {
        return this.emitter.addListener('register', data => {
            callback(data.error === 0 ? TencentPushEventName_1.TencentPushEventName.RegisterSuccess : TencentPushEventName_1.TencentPushEventName.RegisterFail, data);
        });
    }
    addEventListener(name, callback) {
        return this.emitter.addListener(name, callback);
    }
}
exports.NativeEventsRegistry = NativeEventsRegistry;
