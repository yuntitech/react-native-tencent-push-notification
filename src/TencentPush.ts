/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:40:03
 * @LastEditTime: 2020-10-13 11:43:12
 * @LastEditors: leejunhui
 * @Description: 
 */
import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';
import {TencentPushEventName} from './TencentPushEventName';
import {NativeEventsRegistry} from "./registry/NativeEventsRegistry";

export class TencentCloudPush {
    private nativeEventsRegistry: NativeEventsRegistry
    private retryParamsMap: Map<string, any> = new Map<string, any>()
    private retryLeftMap: Map<string, number> = new Map<string, number>()

    
}