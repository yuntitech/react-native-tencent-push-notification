require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']

  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platform     = :ios, "9.0"

  s.source       = { :git => "https://github.com/yuntitech/react-native-tencent-push-notification", :tag => "v#{s.version}" }
  s.source_files  = "ios/**/*.{h,m}"

  s.dependency 'React'
  s.dependency 'TPNS-iOS-Extension','~> 1.3.1.0'

  s.vendored_libraries = 'ios/TPNS-SDK/libXG-SDK-Cloud.a'
  s.frameworks = 'SystemConfiguration','CoreTelephony','UserNotifications','CoreData','CFNetwork','Foundation','CoreGraphics'
  s.vendored_frameworks = 'ios/TPNS-SDK/XGMTACloud.framework','ios/TPNS-SDK/InAppMessage/TPNSInAppMessage.framework'
  s.libraries = 'z','c++',"sqlite3"
  s.resource = 'ios/TPNS-SDK/InAppMessage/TPNSInAppMessageResource.bundle'
  s.pod_target_xcconfig = { 'OTHER_LDFLAGS' => '-lObjC' }


end
