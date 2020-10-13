//
//  RNTencentPushModule.h
//  RNTencentPush
//
//  Created by leejunhui on 2020/10/13.
//

#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

#import "XGPush.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNTencentPushModule : RCTEventEmitter <RCTBridgeModule, XGPushDelegate, XGPushTokenManagerDelegate>

+ (void)didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;

+ (void)didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

@end

NS_ASSUME_NONNULL_END
