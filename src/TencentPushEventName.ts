/*
 * @Author: leejunhui
 * @Date: 2020-10-13 11:40:22
 * @LastEditTime: 2020-10-13 11:40:50
 * @LastEditors: leejunhui
 * @Description: 腾讯云推送事件
 */
export enum TencentPushEventName {
    Start = "start",
    Stop = "stop",
    RegisterSuccess = "registerSuccess",
    RegisterFail = "registerFail",
    BindAccountSuccess = "bindAccountSuccess",
    BindAccountFail = "bindAccountFail",
    BindTags = "bindTags",
    UnbindAccount = "unbindAccount",
    UnbindTags = "unbindTags",
    Message = "message",
    Notification = "notification"
}
