//
//  RNTencentPushModule.m
//  RNTencentPush
//
//  Created by leejunhui on 2020/10/13.
//

#import "RNTencentPushModule.h"
#import <React/RCTUtils.h>
#import "XGPushPrivate.h"

#ifndef TPNS_DISPATCH_MAIN_SYNC_SAFE
#define TPNS_DISPATCH_MAIN_SYNC_SAFE(block)              \
    if ([NSThread isMainThread]) {                       \
        block();                                         \
    } else {                                             \
        dispatch_sync(dispatch_get_main_queue(), block); \
    }
#endif

static NSString *TencentPushEvent_Start = @"start";
static NSString *TencentPushEvent_Stop = @"stop";
static NSString *TencentPushEvent_Resgiter = @"register";
static NSString *TencentPushEvent_ResgiterSuccess = @"registerSuccess";
static NSString *TencentPushEvent_RegisterFail = @"registerFail";

static NSString *TencentPushEvent_BindAccountSuccess = @"bindAccountSuccess";
static NSString *TencentPushEvent_BindAccountFail = @"bindAccountFail";
static NSString *TencentPushEvent_BindAccount = @"bindAccount";
static NSString *TencentPushEvent_BindTags = @"bindTags";
static NSString *TencentPushEvent_UnbindAccount = @"unbindAccount";
static NSString *TencentPushEvent_UnbindTags = @"unbindTags";

static NSString *TencentPushEvent_Message = @"message";
static NSString *TencentPushEvent_Notification = @"notification";

static NSString *TencentPushEvent_RemoteNotification = @"TencentPushEvent_RemoteNotification";

static NSDictionary *RNTencentPush_LaunchUserInfo = nil;

// 获取自定义键值对
static NSMutableDictionary* TencentPush_GetCustomContent(NSDictionary *userInfo) {
  NSMutableDictionary *customContent = [[NSMutableDictionary alloc] init];
  
  NSEnumerator *enumerator = [userInfo keyEnumerator];
  id key;
  while ((key = [enumerator nextObject])) {
    if (![key isEqual: @"xg"] && ![key isEqual: @"aps"]) {
      customContent[key] = userInfo[key];
    }
  }
  return customContent;
};

// 获取推送消息
static NSMutableDictionary* TencentPush_GetNotification(NSDictionary *userInfo) {
  NSDictionary *customContent = TencentPush_GetCustomContent(userInfo);
  
  NSDictionary *alert = userInfo[@"aps"][@"alert"];
  
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  dict[@"custom_content"] = customContent[@"custom"];
  dict[@"body"] = @{
    @"title": alert[@"title"] ?: @"",
    @"subtitle": alert[@"subtitle"] ?: @"",
    @"content": alert[@"body"] ?: @""
  };
  return dict;
};

@implementation RNTencentPushModule
// 在主工程 AppDelegate.m 里调下面几个 did 开头的方法

#pragma mark - 开启服务
// didFinishLaunchingWithOptions return YES 之前调用
+ (void)didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // 传递didFinishLaunchingWithOptions的launchOptions，用于推送拉起app"启动数"统计
  [XGPush defaultManager].launchOptions = [launchOptions mutableCopy];
  // 点击推送启动 App
  if ([launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey]) {
    RNTencentPush_LaunchUserInfo = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
  }
  else {
    RNTencentPush_LaunchUserInfo = nil;
  }
}

/**
 1. 这个方法在 iOS7~iOS10 时, 用于代替之前的didReceiveRemoteNotification: , 处理所有的通知. 比didReceiveRemoteNotification还多一个功能, 就是 App 处于关闭状态时, 启动时会调用这个方法
 2. 在 iOS10 之后, 如果实现了 UserNotification 框架的下面两个方法, 那么didReceiveRemoteNotification:fetchCompletionHandler这个只会处理静默通知, 其他的通知交给 UN 框架;
 如果未实现 UN 框架的功能, 那么所有通知都会来到这个方法.
 UserNotification框架的方法:
 - willPresentNotification:withCompletionHandler 用于在前台接收到消息后处理, 是否弹窗, iOS10 之前前台无法弹窗.
 - didReceiveNotificationResponse:withCompletionHandler 用于处理用户点击通知等与通知交互的行为
 
 普通推送：收到推送后（有文字有声音），点开通知，进入APP后，才执行 - application:didReceiveRemoteNotification:fetchCompletionHandler:
 静默推送：aps中有这个字段且content-available: 1 , 收到推送（没有文字没有声音），不用点开通知，不用打开APP，就能执 application:didReceiveRemoteNotification:fetchCompletionHandler
 
 */
+ (void)didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  [[NSNotificationCenter defaultCenter] postNotificationName:TencentPushEvent_RemoteNotification object:userInfo];
  completionHandler(UIBackgroundFetchResultNewData);
}

#pragma mark - 信鸽 XGPushDelegate 代理
#pragma mark - 推送消息回调代理
// iOS 10 新增 API
// iOS 10 会走新 API, iOS 10 以前会走到老 API
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

// App 用户点击通知
// App 用户选择通知中的行为
// App 用户在通知中心清除消息
// 无论本地推送还是远程推送都会走这个回调
- (void)xgPushUserNotificationCenter:(UNUserNotificationCenter *)center
      didReceiveNotificationResponse:(UNNotificationResponse *)response
               withCompletionHandler:(void (^)(void))completionHandler __IOS_AVAILABLE(10.0) {
  
  UNNotification *notification = response.notification;
  NSDictionary *userInfo = notification.request.content.userInfo;

  NSMutableDictionary *dict = TencentPush_GetNotification(userInfo);
  dict[@"clicked"] = @YES;
  [self sendEventWithName:TencentPushEvent_Notification body:dict];
  
  completionHandler();
}

// App 在前台弹通知需要调用这个接口, 不使用这个方法, 前台收到消息不会进行弹窗
- (void)xgPushUserNotificationCenter:(UNUserNotificationCenter *)center
             willPresentNotification:(UNNotification *)notification
               withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler __IOS_AVAILABLE(10.0) {
  
  NSDictionary *userInfo = notification.request.content.userInfo;
  

    NSMutableDictionary *dict = TencentPush_GetNotification(userInfo);
  dict[@"presented"] = @YES;
  [self sendEventWithName:TencentPushEvent_Notification body:dict];
  
  completionHandler(UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert);
}

#endif
#pragma mark - 各种事件回调
// 信鸽服务停止的回调
- (void)xgPushDidFinishStop:(BOOL)isSuccess error:(nullable NSError *)error {
  [self sendEventWithName:TencentPushEvent_Stop body:@{
    @"error": @(isSuccess ? 0 : error ? error.code : 0)
  }];
}

// 启动信鸽服务成功后，会触发此回调
- (void)xgPushDidRegisteredDeviceToken:(nullable NSString *)deviceToken error:(nullable NSError *)error{
    //在注册完成后上报角标数目
    if (!error) {
        //重置服务端自动+1基数
        [[XGPush defaultManager] setBadge:0];
    }
  NSString *token = deviceToken ?: @"";
  [self sendEventWithName:TencentPushEvent_Resgiter body:@{
    @"deviceToken": token,
    @"error": @(token.length > 0 ? 0 : error ? error.code : 0)
  }];
}

// 启动信鸽服务失败后，会触发此回调
- (void)xgPushDidFailToRegisterDeviceTokenWithError:(nullable NSError *)error
{
    [self sendEventWithName:TencentPushEvent_RegisterFail body:@{
      @"error": @(error ? error.code : 0)
    }];
}

// 绑定帐号的回调
- (void)xgPushDidAppendAccounts:(nonnull NSArray<NSDictionary *> *)accounts error:(nullable NSError *)error
{
    [self sendEventWithName:TencentPushEvent_BindAccount body:@{
      @"error": @(error ? error.code : 0)
    }];
}

// 绑定标签的回调
- (void)xgPushDidAppendTags:(nonnull NSArray<NSString *> *)tags error:(nullable NSError *)error
{
    [self sendEventWithName:TencentPushEvent_BindTags body:@{
      @"error": @(error ? error.code : 0)
    }];
}

// 解除绑定帐号的回调
- (void)xgPushDidDelAccounts:(nonnull NSArray<NSDictionary *> *)accounts error:(nullable NSError *)error
{
    [self sendEventWithName:TencentPushEvent_UnbindAccount body:@{
      @"error": @(error ? error.code : 0)
    }];
}

// 解除绑定标签的回调
- (void)xgPushDidDelTags:(nonnull NSArray<NSString *> *)tags error:(nullable NSError *)error
{
    [self sendEventWithName:TencentPushEvent_UnbindTags body:@{
      @"error": @(error ? error.code : 0)
    }];
}

- (void)didReceiveRemoteNotification:(NSNotification *)notification {
    NSDictionary *userInfo = notification.object;
    NSDictionary *aps = userInfo[@"aps"];
    
    int contentAvailable = 0;
    if ([aps objectForKey:@"content-available"]) {
      contentAvailable = [[NSString stringWithFormat:@"%@", aps[@"content-available"]] intValue];
    }
    
    if (contentAvailable == 1) {
      // 静默消息
      // 静默推送可以让 App在后台不启动应用时就能运行一段代码, 从服务器拉取消息, 执行didReceiveRemoteNotification:fetchCompletionHandler
      [self sendEventWithName:TencentPushEvent_Message body:TencentPush_GetCustomContent(userInfo)];
    }
    else {
      // 推送消息
      NSMutableDictionary *dict = TencentPush_GetNotification(userInfo);
      dict[@"presented"] = @YES;
      [self sendEventWithName:TencentPushEvent_Notification body:dict];
    }
}

#pragma mark - RN 方法

RCT_EXPORT_MODULE(RNTencentPush);
+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init {
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveRemoteNotification:)
                                                 name:TencentPushEvent_RemoteNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    TencentPushEvent_Start,
    TencentPushEvent_Stop,
    TencentPushEvent_Resgiter,
    TencentPushEvent_ResgiterSuccess,
    TencentPushEvent_RegisterFail,
    TencentPushEvent_BindAccount,
    TencentPushEvent_BindAccountSuccess,
    TencentPushEvent_BindAccountFail,
    TencentPushEvent_BindTags,
    TencentPushEvent_UnbindAccount,
    TencentPushEvent_UnbindTags,
    TencentPushEvent_Message,
    TencentPushEvent_Notification
  ];
}

#pragma mark - 配置TPNS集群域名
RCT_EXPORT_METHOD(configureClusterDomainName:(NSString *)domainName) {
    /// @note TPNS SDK1.2.7.1+
    [[XGPush defaultManager] configureClusterDomainName:domainName];
}

#pragma mark - 启动TPNS推送服务
RCT_EXPORT_METHOD(start:(NSInteger)accessID appKey:(NSString *)appKey) {
    [[XGPush defaultManager] startXGWithAccessID:(int)accessID accessKey:appKey delegate:self];
    [XGPushTokenManager defaultTokenManager].delegate = self;
    /// 角标数目清零,通知中心清空
    if ([XGPush defaultManager].xgApplicationBadgeNumber > 0) {
        TPNS_DISPATCH_MAIN_SYNC_SAFE(^{
            [XGPush defaultManager].xgApplicationBadgeNumber = 0;
        });
    }
    if (RNTencentPush_LaunchUserInfo != nil) {
      NSMutableDictionary *dict = TencentPush_GetNotification(RNTencentPush_LaunchUserInfo);
      dict[@"clicked"] = @YES;
      [self sendEventWithName:TencentPushEvent_Notification body:dict];
        RNTencentPush_LaunchUserInfo = nil;
    }
}

#pragma mark - 停止TPNS推送服务
RCT_EXPORT_METHOD(stop) {
  [[XGPush defaultManager] stopXGNotification];
}

#pragma mark - 绑定账号
RCT_EXPORT_METHOD(bindAccount:(NSString *)account) {
    [[XGPushTokenManager defaultTokenManager] appendAccounts:@[@{@"accountType":@(0),@"account":account}]];
}

#pragma mark - 解绑账号
RCT_EXPORT_METHOD(unbindAccount:(NSString *)account) {
    [[XGPushTokenManager defaultTokenManager] delAccounts:@[@{@"accountType":@(0),@"account":account}]];
}

#pragma mark - 绑定标签
RCT_EXPORT_METHOD(bindTags:(nonnull NSArray<NSString *> *)tags) {
    [[XGPushTokenManager defaultTokenManager] appendTags:tags];
}

#pragma mark - 解绑标签
RCT_EXPORT_METHOD(unbindTags:(nonnull NSArray<NSString *> *)tags) {
    [[XGPushTokenManager defaultTokenManager] delTags:tags];
}

#pragma mark - 设置角标
RCT_EXPORT_METHOD(setBadge:(NSInteger)badge) {
  // 这里本地角标
  [[XGPush defaultManager] setXgApplicationBadgeNumber:badge];
  // 上报服务器，方便实现 +1 操作
  [[XGPush defaultManager] setBadge:badge];
}

#pragma mark - 获取角标
RCT_EXPORT_METHOD(getBadge:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSInteger badge = [[XGPush defaultManager] xgApplicationBadgeNumber];
  resolve(@{
    @"badge": @(badge)
  });
}

#pragma mark - 这个开关表明是否打印TPNS SDK的日志信息
RCT_EXPORT_METHOD(setDebug:(BOOL)enable) {
  [[XGPush defaultManager] setEnableDebug:enable];
}



@end
