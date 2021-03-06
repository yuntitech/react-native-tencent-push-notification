package com.yunti.rntpush.utils

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

import com.tencent.android.tpush.XGPushClickedResult
import com.tencent.android.tpush.XGPushTextMessage
import org.json.JSONException
import org.json.JSONObject

fun Intent.createClickedNotifiction(): WritableMap? {
    if (data == null) {
        return null
    }
    val uri = data
    val notification = Arguments.createMap()
    notification.putBoolean("clicked", true)
    for (key in listOf("tp", "pushPlanId", "pushRecordId")) {
        uri?.getQueryParameter(key)?.toDouble()?.let { notification.putDouble(key, it) }
    }
    for (key in listOf("msg")) {
        notification.putString(key, uri?.getQueryParameter(key))
    }
    return notification
}

fun XGPushClickedResult.toBodyMap(): WritableMap {
    val result = Arguments.createMap()
    result.putString("title", title)
    result.putString("content", content)
    result.putMap("customContent", customContent.fromJson())
    result.putInt("actionType", actionType.toInt())
    result.putBoolean("clicked", true)
    return result
}

fun XGPushTextMessage.toWritableMap(): WritableMap {
    val result = Arguments.createMap()
    result.putString("title", title)
    result.putString("content", content)
    result.putString("customContent", customContent)
    return result
}

fun String.fromJson(): WritableMap {
    val result = Arguments.createMap()
    if (isEmpty()) {
        return result
    }

    try {
        val json = JSONObject(this)
        val iterator = json.keys()
        while (iterator.hasNext()) {
            val key = iterator.next()
            result.putString(key, json.getString(key))
        }
    } catch (e: JSONException) {
        e.printStackTrace()
    }

    return result
}
