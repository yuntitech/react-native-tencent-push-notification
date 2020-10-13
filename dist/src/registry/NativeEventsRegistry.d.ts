import { EmitterSubscription } from 'react-native';
import { TencentPushEventName } from "../TencentPushEventName";
/**
 * 原生事件注册表
 */
export declare class NativeEventsRegistry {
    private emitter;
    constructor();
    addBindAccountListener(callback: (eventType: TencentPushEventName, data: any) => void): EmitterSubscription;
    addRegisterListener(callback: (eventType: TencentPushEventName, data: any) => void): EmitterSubscription;
    addEventListener(name: TencentPushEventName, callback: (data: any) => void): EmitterSubscription;
}
