"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TencentPushEventName = void 0;
/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:40:22
 * @LastEditTime: 2020-10-13 11:40:50
 * @LastEditors: leejunhui
 * @Description: 腾讯云推送事件
 */
var TencentPushEventName;
(function (TencentPushEventName) {
    TencentPushEventName["Start"] = "start";
    TencentPushEventName["Stop"] = "stop";
    TencentPushEventName["RegisterSuccess"] = "registerSuccess";
    TencentPushEventName["RegisterFail"] = "registerFail";
    TencentPushEventName["BindAccountSuccess"] = "bindAccountSuccess";
    TencentPushEventName["BindAccountFail"] = "bindAccountFail";
    TencentPushEventName["BindTags"] = "bindTags";
    TencentPushEventName["UnbindAccount"] = "unbindAccount";
    TencentPushEventName["UnbindTags"] = "unbindTags";
    TencentPushEventName["Message"] = "message";
    TencentPushEventName["Notification"] = "notification";
})(TencentPushEventName = exports.TencentPushEventName || (exports.TencentPushEventName = {}));
