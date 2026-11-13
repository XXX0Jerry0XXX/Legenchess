#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif
#ifndef AppTag
  #define AppTag "v0.0.0"
#endif

[Setup]
AppId=Legenchess
AppName=传棋 Legenchess
AppVersion={#AppVersion}
AppVerName=传棋 Legenchess {#AppTag}
DefaultDirName={autopf}\Legenchess
DefaultGroupName=传棋 Legenchess
OutputDir=..\release
OutputBaseFilename=Legenchess-{#AppTag}-setup
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin

[Files]
Source: "..\release\node.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\server.cjs"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\launcher.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\release\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加任务："

[Icons]
Name: "{autoprograms}\传棋 Legenchess"; Filename: "wscript.exe"; Parameters: """{app}\launcher.vbs"""
Name: "{autodesktop}\传棋 Legenchess"; Filename: "wscript.exe"; Parameters: """{app}\launcher.vbs"""; Tasks: desktopicon

[Run]
Filename: "wscript.exe"; Parameters: """{app}\launcher.vbs"""; Description: "启动传棋 Legenchess"; Flags: nowait postinstall skipifsilent
