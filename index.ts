/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:43:23
 * @LastEditTime: 2020-10-13 15:36:59
 * @LastEditors: leejunhui
 * @Description: 入口文件
 */
import {TencentCloudPush} from "./src/TencentPush";

export const TencentPush = new TencentCloudPush();

export * from './src/TencentPushEventName';
