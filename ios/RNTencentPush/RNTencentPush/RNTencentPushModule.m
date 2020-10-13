//
//  RNTencentPushModule.m
//  RNTencentPush
//
//  Created by leejunhui on 2020/10/13.
//

#import "RNTencentPushModule.h"
#import <React/RCTUtils.h>

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
  dict[@"custom_content"] = customContent;
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

#pragma mark - 启动TPNS推送服务
//RCT_EXPORT_METHOD(start:(NSInteger)appID appKey:(NSString *)appKey) {
//
//}

@end
