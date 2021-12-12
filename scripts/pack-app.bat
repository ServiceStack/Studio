PUSHD ..
if exist dist\.publish copy dist\.publish scripts\deploy 
rd /q /s dist
md dist\assets
x run _bundle.ss -to /dist
xcopy /E wwwroot\assets .\dist\assets\
copy wwwroot\* dist
copy scripts\deploy\* dist

dotnet publish -c release
md dist\plugins 
copy bin\release\net6.0\publish\Studio.dll dist\plugins\
POPD