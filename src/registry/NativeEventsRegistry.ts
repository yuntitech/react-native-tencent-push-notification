/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:41:04
 * @LastEditTime: 2020-10-13 15:40:59
 * @LastEditors: leejunhui
 * @Description: 原生事件注册表
 */
import {EmitterSubscription, EventEmitter, NativeEventEmitter, NativeModules} from 'react-native'
import {TencentPushEventName} from "../TencentPushEventName";

const { RNTencentPush } = NativeModules;

/**
 * 原生事件注册表
 */
export class NativeEventsRegistry {
    private emitter: EventEmitter

    constructor() {
        try {
            this.emitter = new NativeEventEmitter(RNTencentPush);
        } catch (e) {
            this.emitter = ({
                addListener: () => {
                    return {
                        remove: () => undefined,
                    }
                },
            } as any) as EventEmitter
        }
    }

    public addBindAccountListener(callback: (eventType: TencentPushEventName, data: any) => void): EmitterSubscription {
        return this.emitter.addListener('bindAccount', data => {
            callback(data.error === 0 ? TencentPushEventName.BindAccountSuccess : TencentPushEventName.BindAccountFail, data)
        })
    }

    public addRegisterListener(callback: (eventType: TencentPushEventName, data: any) => void): EmitterSubscription {
        return this.emitter.addListener('register', data => {
            callback(data.error === 0 ? TencentPushEventName.RegisterSuccess : TencentPushEventName.RegisterFail, data)
        })
    }

    public addEventListener(name: TencentPushEventName, callback: (data: any) => void): EmitterSubscription {
        return this.emitter.addListener(name, callback)
    }
}