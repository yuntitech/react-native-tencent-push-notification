"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TencentPush = void 0;
/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:43:23
 * @LastEditTime: 2020-10-13 15:36:59
 * @LastEditors: leejunhui
 * @Description: 入口文件
 */
const TencentPush_1 = require("./src/TencentPush");
exports.TencentPush = new TencentPush_1.TencentCloudPush();
__exportStar(require("./src/TencentPushEventName"), exports);
