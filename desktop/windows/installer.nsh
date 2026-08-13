; Close an existing DailyFlora process before NSIS replaces the installed files.
; This makes assisted upgrades work when the user launches the installer while
; the previous desktop window or screensaver instance is still open.
!macro customInit
  nsExec::ExecToLog 'taskkill /IM DailyFlora.exe /T'
  Pop $0
  Sleep 800
  nsExec::ExecToLog 'taskkill /F /IM DailyFlora.exe /T'
  Pop $0
  Sleep 300
!macroend
