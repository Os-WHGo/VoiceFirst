Pod::Spec.new do |s|
  s.name           = 'VoiceFirstAudioRoute'
  s.version        = '0.1.0'
  s.summary        = 'Read-only input route observability for VoiceFirst'
  s.description    = 'Foreground audio input route snapshots, without recording or route selection.'
  s.author         = 'MU'
  s.homepage       = 'https://github.com/Os-WHGo/VoiceFirst'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files   = '**/*.{h,m,mm,swift,hpp,cpp}'
end
