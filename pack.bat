dotnet publish -c release
rd /q /s dist
md dist\plugins dist\assets
x run _bundle.ss
copy bin\release\netcoreapp3.1\publish\Studio.dll dist\plugins\
xcopy /E bin\release\netcoreapp3.1\publish\wwwroot\assets .\dist\assets\
copy app.settings dist
copy wwwroot\* dist
