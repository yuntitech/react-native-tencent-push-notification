package com.yunti.rntpush

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.collection.ArraySet
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.tencent.android.tpush.XGIOperateCallback
import com.tencent.android.tpush.XGPushBaseReceiver
import com.tencent.android.tpush.XGPushConfig
import com.tencent.android.tpush.XGPushManager
import com.xiaomi.push.it
import com.yunti.rntpush.utils.Constant
import com.yunti.rntpush.utils.createClickedNotifiction
import com.yunti.rntpush.utils.fromJson
import me.leolin.shortcutbadger.ShortcutBadger
import org.json.JSONException
import org.json.JSONObject

/**
 *
 *   Create by cyberlouis on 2020/10/20
 */

class RNTXingePushModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
    ActivityEventListener, LifecycleEventListener {

    companion object {
        var isStarted = false
        var launchIntent: Intent? = null
    }

    private var badge = 0

    private var launchInfo: WritableMap? = null
    private var isAppLaunched = false

    init {
        reactContext.addActivityEventListener(this)
        reactContext.addLifecycleEventListener(this)
        registerReceivers()
    }

    override fun getName(): String {
        return "RNTXingePush"
    }

    //这个开关表明是否打印TPNS SDK的日志信息
    @ReactMethod
    fun setDebug(debug: Boolean) {
        XGPushConfig.enableDebug(reactContext, debug)

    }

    @ReactMethod
    fun enableOtherPush(enable: Boolean) {
        XGPushConfig.enableOtherPush(reactContext, enable)
    }

    @ReactMethod
    fun setHuaweiDebug(debug: Boolean) {
        XGPushConfig.setHuaweiDebug(debug)
    }

    @ReactMethod
    fun setXiaomi(appId: String, appKey: String) {
        XGPushConfig.setMiPushAppId(reactContext, appId)
        XGPushConfig.setMiPushAppKey(reactContext, appKey)
    }

    @ReactMethod
    fun setMeizu(appId: String, appKey: String) {
        XGPushConfig.setMzPushAppId(reactContext, appId)
        XGPushConfig.setMzPushAppKey(reactContext, appKey)
    }

    //启动TPNS推送服务
    @ReactMethod
    fun start(accessId: Int, accessKey: String) {

        isStarted = true

        XGPushConfig.setAccessId(reactContext, accessId.toLong())
        XGPushConfig.setAccessKey(reactContext, accessKey)
    }

    @ReactMethod
    fun registerPush() {
        XGPushManager.registerPush(reactContext, object : XGIOperateCallback {
            override fun onSuccess(data: Any?, flag: Int) {
                onRegister(XGPushConfig.getToken(reactContext), XGPushBaseReceiver.SUCCESS)
            }

            override fun onFail(data: Any?, errCode: Int, msg: String) {
                onRegister("", errCode)
            }
        })
    }

    //停止TPNS推送服务
    @ReactMethod
    fun stop() {
        XGPushManager.unregisterPush(reactContext, object : XGIOperateCallback {
            override fun onSuccess(data: Any?, flag: Int) {
                onStop(XGPushBaseReceiver.SUCCESS)
            }

            override fun onFail(data: Any?, errCode: Int, msg: String) {
                onStop(errCode)
            }
        })
    }

    //绑定账号
    @ReactMethod
    fun bindAccount(account: String) {
        XGPushManager.bindAccount(reactContext, account, object : XGIOperateCallback {
            override fun onSuccess(data: Any?, flag: Int) {
                onBindAccount(XGPushBaseReceiver.SUCCESS)
            }

            override fun onFail(data: Any?, errCode: Int, msg: String) {
                onBindAccount(errCode)
            }
        })
    }

    // 解绑账号
    @ReactMethod
    fun unbindAccount(account: String) {
        XGPushManager.delAccount(reactContext, account, object : XGIOperateCallback {
            override fun onSuccess(data: Any?, flag: Int) {
                onUnbindAccount(XGPushBaseReceiver.SUCCESS)
            }

            override fun onFail(data: Any?, errCode: Int, msg: String) {
                onUnbindAccount(errCode)
            }
        })
    }

    //绑定标签
    @ReactMethod
    fun bindTags(tags: ReadableArray) {
        val set = ArraySet<String>()
        for (i in 0 until tags.size()) {
            set.add(tags.getString(i))
        }
        XGPushManager.addTags(reactContext, "addTags", set)
    }

    //解绑标签
    @ReactMethod
    fun unbindTags(tags: ReadableArray) {
        val set = ArraySet<String>()
        for (i in 0 until tags.size()) {
            set.add(tags.getString(i))
        }
        XGPushManager.deleteTags(reactContext, "deleteTags", set)
    }

    //设置角标
    @ReactMethod
    fun setBadge(badge: Int) {
        this.badge = badge
        ShortcutBadger.applyCount(reactContext, badge)
    }

    //获取角标
    @ReactMethod
    fun getBadge(promise: Promise) {
        val map = Arguments.createMap()
        map.putInt("badge", badge)
        promise.resolve(map)
    }

    @ReactMethod
    fun handleNotificationIfNeeded(promise: Promise) {
        if (launchInfo != null) {
            promise.resolve(launchInfo)
            launchInfo = null
        } else {
            promise.reject(Exception("launchInfo is null"))
        }
    }

    @ReactMethod
    fun appLaunched() {
        //ReactInstanceManager不好传进来, js那边来赋值
        isAppLaunched = true
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
    }

    private fun onStart(code: Int) {
        val map = Arguments.createMap()
        map.putInt("error", code)
        sendEvent("start", map)
    }

    private fun onStop(code: Int) {
        val map = Arguments.createMap()
        map.putInt("error", code)
        sendEvent("stop", map)
    }

    private fun onRegister(deviceToken: String, code: Int) {
        val map = Arguments.createMap()
        map.putString("deviceToken", deviceToken)
        map.putInt("error", code)
        sendEvent("register", map)
    }

    private fun onBindAccount(code: Int) {
        val map = Arguments.createMap()
        map.putInt("error", code)
        sendEvent("bindAccount", map)
    }

    private fun onUnbindAccount(code: Int) {
        val map = Arguments.createMap()
        map.putInt("error", code)
        sendEvent("unbindAccount", map)
    }

    private fun onBindTags(code: Int) {
        val map = Arguments.createMap()
        map.putInt("error", code)
        sendEvent("bindTags", map)
    }

    private fun onUnbindTags(code: Int) {
        val map = Arguments.createMap()
        map.putInt("error", code)
        sendEvent("unbindTags", map)
    }

    private fun onMessage(intent: Intent) {

        val customContent = intent.getStringExtra("customContent")

        sendEvent("message", getCustomContent(customContent))

    }

    private fun onNotifaction(intent: Intent?) {

        val customContent = intent?.getStringExtra("customContent")
        val result = Arguments.fromBundle(intent?.extras)
        result.putMap("customContent", customContent?.fromJson())
        sendEvent("notification", result)

    }

    private fun getCustomContent(customContent: String?): WritableMap {

        val body = Arguments.createMap()

        if (customContent == null || customContent.isEmpty()) {
            return body
        }

        try {
            val json = JSONObject(customContent)
            val iterator = json.keys()
            while (iterator.hasNext()) {
                val key = iterator.next()
                // 貌似信鸽只支持字符串
                body.putString(key, json.getString(key))
            }
        } catch (e: JSONException) {
            e.printStackTrace()
        }

        return body

    }

    override fun onHostResume() {
        XGPushManager.onActivityStarted(currentActivity)
        currentActivity?.intent?.createClickedNotifiction()?.let{

        }
        currentActivity?.intent?.createClickedNotifiction()?.let {
            if (isAppLaunched) {
                sendEvent("notification", it)
            } else {
                launchInfo = it
            }
        }
    }

    override fun onHostPause() {
        XGPushManager.onActivityStoped(currentActivity)
    }

    override fun onHostDestroy() {

    }




    private fun registerReceivers() {

        val intentFilter = IntentFilter()
        intentFilter.addAction(Constant.ACTION_BIND_TAGS)
        intentFilter.addAction(Constant.ACTION_UNBIND_TAGS)
        intentFilter.addAction(Constant.ACTION_MESSAGE)
        intentFilter.addAction(Constant.ACTION_NOTIFICATION)

        reactContext.registerReceiver(object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                when (intent.action) {
                    Constant.ACTION_BIND_TAGS -> onBindTags(intent.getIntExtra("code", -1))
                    Constant.ACTION_UNBIND_TAGS -> onUnbindTags(intent.getIntExtra("code", -1))
                    Constant.ACTION_MESSAGE -> onMessage(intent)
                    Constant.ACTION_NOTIFICATION -> onNotifaction(intent)
                    else -> {
                    }
                }

            }
        }, intentFilter)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {

    }

}
