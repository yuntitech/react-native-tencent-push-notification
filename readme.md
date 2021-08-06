# react-native-tencent-push-notification
封装腾讯推送库供Js端使用

## 注意事项
###Android端

配置时

对应应用的腾讯推送配置文件:**tpns-configs.json**

华为推送配置文件:**agconnect-services.json**

需要放置到**主工程**对应目录下

**build.gradle**中也有一些配置需要写到主工程应用级build.gradle中

具体请查看android/build.gradle中的代码注释

###RN端
修改index.ts 以及src下.ts文件后要执行yarn build命令生成dist下对应文件