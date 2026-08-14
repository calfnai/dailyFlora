; Recovery-safe upgrade path for the assisted NSIS installer.
; Some electron-builder versions can leave a damaged old uninstaller behind.
; If NSIS tries to launch that uninstaller during an upgrade, it returns error 2
; before the new files can be installed. Clear only the old uninstall commands
; and executable; the new installer writes a fresh uninstaller at the end.
!macro DF_CLEAR_OLD_UNINSTALL ROOT_KEY
  ReadRegStr $R1 ${ROOT_KEY} "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  ${if} $R1 != ""
    Delete "$R1\Uninstall*.exe"
  ${endIf}
  DeleteRegValue ${ROOT_KEY} "${UNINSTALL_REGISTRY_KEY}" "UninstallString"
  DeleteRegValue ${ROOT_KEY} "${UNINSTALL_REGISTRY_KEY}" "QuietUninstallString"
!macroend

!macro customInit
  ; Close the desktop window or screensaver before replacing its files.
  nsExec::ExecToLog 'taskkill /IM DailyFlora.exe /T'
  Pop $0
  Sleep 800
  nsExec::ExecToLog 'taskkill /F /IM DailyFlora.exe /T'
  Pop $0
  Sleep 300

  ; Cover both registry views and both installation scopes. Failed deletes in
  ; the non-active scope are harmless; the active scope is rebuilt below.
  SetRegView 64
  !insertmacro DF_CLEAR_OLD_UNINSTALL HKCU
  !insertmacro DF_CLEAR_OLD_UNINSTALL HKLM
  SetRegView 32
  !insertmacro DF_CLEAR_OLD_UNINSTALL HKCU
  !insertmacro DF_CLEAR_OLD_UNINSTALL HKLM
!macroend

; DailyFlora is currently installed per user. Do not let recovery installs
; accidentally switch to a second machine-wide copy.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInstall
  ; Explicitly overwrite the files after the old uninstaller is bypassed.
  SetOverwrite on
!macroend
