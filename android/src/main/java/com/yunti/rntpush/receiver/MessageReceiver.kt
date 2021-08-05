package com.yunti.rntpush.receiver

import android.content.Context
import android.content.Intent
import android.util.Log
import com.yunti.rntpush.RNTencentPush

import com.yunti.rntpush.utils.Constant
import com.tencent.android.tpush.XGPushBaseReceiver
import com.tencent.android.tpush.XGPushClickedResult
import com.tencent.android.tpush.XGPushRegisterResult
import com.tencent.android.tpush.XGPushShowedResult
import com.tencent.android.tpush.XGPushTextMessage

// 信鸽的第三方推送经过它自己的封装后，会转发出以下两个 Intent，因此所有的推送在这个文件统一处理就行了
// com.tencent.android.tpush.action.PUSH_MESSAGE
// com.tencent.android.tpush.action.FEEDBACK

class MessageReceiver : XGPushBaseReceiver() {

    override fun onRegisterResult(context: Context, code: Int, result: XGPushRegisterResult) {

    }

    override fun onUnregisterResult(context: Context, code: Int) {

    }

    override fun onDeleteAccountResult(p0: Context?, p1: Int, p2: String?) {

    }

    override fun onSetTagResult(context: Context?, code: Int, tagName: String) {

        if (context == null) {
            return
        }

        Log.d("XINGE", "[XINGE] onSetTagResult $code $tagName")

        val intent = Intent(Constant.ACTION_BIND_TAGS)
        intent.putExtra("code", code)
        context.sendBroadcast(intent)

    }

    override fun onSetAttributeResult(p0: Context?, p1: Int, p2: String?) {

    }

    override fun onQueryTagsResult(p0: Context?, p1: Int, p2: String?, p3: String?) {
    
    }

    override fun onDeleteTagResult(context: Context?, code: Int, tagName: String) {

        if (context == null) {
            return
        }

        Log.d("XINGE", "[XINGE] onDeleteTagResult $code $tagName")

        val intent = Intent(Constant.ACTION_UNBIND_TAGS)
        intent.putExtra("code", code)
        context.sendBroadcast(intent)

    }

    override fun onTextMessage(context: Context?, message: XGPushTextMessage) {

        if (context == null) {
            return
        }

        Log.d("XINGE", "[XINGE] onTextMessage $message")

        // ios 只能取到 custom content
        // 因此安卓只取 custom content

        val intent = Intent(Constant.ACTION_MESSAGE)

        var customContent: String? = message.customContent
        if (customContent == null || customContent.isEmpty()) {
            // 某些第三方厂商会忽略自定义参数，因此用 content 做降级
            val content = message.content
            // 如果 content 是个 json，就用他代替 customContent
            if (content != null && content.startsWith("{") && content.endsWith("}")) {
                customContent = content

                // 华为会多加一层 content
                val prefix = "{\"content\":\""
                val suffix = "\"}"

                if (customContent.startsWith(prefix) && customContent.endsWith(suffix)) {
                    customContent = customContent.substring(prefix.length, customContent.length - suffix.length)
                }

                customContent = customContent.replace("\\\\\"".toRegex(), "\"")
            }
        }

        intent.putExtra("customContent", customContent ?: "")

        context.sendBroadcast(intent)

    }
    /**
     * 通知点击回调
     * actionType=1为该消息被清除
     * actionType=0为该消息被点击
     * 此处不能做点击消息跳转
     * 详细方法请参照官网的Android常见问题文档(https://xg.qq.com/docs/android_access/android_faq.html)
     *
     * @param context           app上下文
     * @param result 推送点击对象
     */
        override fun onNotificationClickedResult(context: Context?, result: XGPushClickedResult?) {
        if (context == null || result == null) {
            return
        }

        Log.d("XINGE", "[XINGE] onNotifactionClickedResult ${result.toString()}")
        //消息点击在onHostResume中处理
        if (result.actionType == XGPushClickedResult.NOTIFACTION_CLICKED_TYPE.toLong()) {
            return
        }

        val intent = Intent(Constant.ACTION_NOTIFICATION)
        val title = result.title
        val content = result.content
        val customContent = result.customContent

        intent.putExtra("title", title ?: "")
        intent.putExtra("content", content ?: "")
        intent.putExtra("customContent", customContent ?: "")

        val actionType = result.actionType
        if (actionType == XGPushClickedResult.NOTIFACTION_CLICKED_TYPE.toLong()) {
            intent.putExtra("clicked", true)
        }
        if (actionType == XGPushClickedResult.NOTIFACTION_DELETED_TYPE.toLong()) {
            intent.putExtra("deleted", true)
        }

        context.sendBroadcast(intent)

        // 在 RNTXingePushModule 还没初始化时，这个方法就会执行
        // 因此为了获取到启动 app 的那条推送，这里需要存一下
        if (!RNTencentPush.isStarted) {
            RNTencentPush.launchIntent = intent
        }
    }

    override fun onDeleteAttributeResult(p0: Context?, p1: Int, p2: String?) {
    }

    override fun onSetAccountResult(p0: Context?, p1: Int, p2: String?) {
    }

    override fun onNotificationShowedResult(context: Context?, result: XGPushShowedResult?) {
        if (context == null) {
            return
        }

        Log.d("XINGE", "[XINGE] onNotifactionShowedResult $result")

        val intent = Intent(Constant.ACTION_NOTIFICATION)
        val title = result?.title
        val content = result?.content
        val customContent = result?.customContent

        intent.putExtra("title", title ?: "")
        intent.putExtra("content", content ?: "")
        intent.putExtra("customContent", customContent ?: "")

        intent.putExtra("presented", true)

        context.sendBroadcast(intent)
    }



}
