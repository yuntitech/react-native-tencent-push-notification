package com.yunti.rntpush.xingepush

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.yunti.rntpush.RNTXingePushModule
import java.util.Arrays



class RNTXingePushPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return Arrays.asList<NativeModule>(RNTXingePushModule(reactContext))
    }

    // Deprecated from RN 0.47
    override fun createJSModules(): List<Class<out JavaScriptModule>> {
        return emptyList<Class<out JavaScriptModule>>()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList<ViewManager<*, *>>()
    }

}