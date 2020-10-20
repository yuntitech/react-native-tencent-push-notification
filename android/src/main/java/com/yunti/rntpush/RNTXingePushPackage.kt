package com.yunti.rntpush.xingepush

import com.yunti.rntpush.RNTXingePushModule
import java.util.Arrays

import com.yunti.rntpush.ReactPackage
import com.yunti.rntpush.bridge.NativeModule
import com.yunti.rntpush.bridge.ReactApplicationContext
import com.yunti.rntpush.uimanager.ViewManager
import com.yunti.rntpush.bridge.JavaScriptModule

class RNTXingePushPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return Arrays.asList<NativeModule>(RNTXingePushModule(reactContext))
    }

    // Deprecated from RN 0.47
    fun createJSModules(): List<Class<out JavaScriptModule>> {
        return emptyList<Class<out JavaScriptModule>>()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList<ViewManager<*, *>>()
    }

}