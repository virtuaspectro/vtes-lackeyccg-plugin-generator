param (
    [string]$title,
    [string]$text
)

[reflection.assembly]::loadwithpartialname("System.Windows.Forms")
[reflection.assembly]::loadwithpartialname("System.Drawing")

$notify = new-object system.windows.forms.notifyicon
$notify.icon = [System.Drawing.SystemIcons]::Exclamation
$notify.visible = $true
$notify.showballoontip(10, $title, $text, [system.windows.forms.tooltipicon]::None)