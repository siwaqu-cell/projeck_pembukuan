import base64
import os

images = {
    'SIB': r'C:\Users\siwa\.gemini\antigravity\brain\0c623fa9-9440-4e93-a6ed-238baea33eb9\media__1777737857656.png',
    'BL': r'C:\Users\siwa\.gemini\antigravity\brain\0c623fa9-9440-4e93-a6ed-238baea33eb9\media__1777737857576.png',
    'LJ': r'C:\Users\siwa\.gemini\antigravity\brain\0c623fa9-9440-4e93-a6ed-238baea33eb9\media__1777737857592.png',
    'AF': r'C:\Users\siwa\.gemini\antigravity\brain\0c623fa9-9440-4e93-a6ed-238baea33eb9\media__1777737857606.png'
}

js_code = 'function setupLogosOtomatis() {\n'
js_code += '  var ui = SpreadsheetApp.getUi();\n'
js_code += '  try {\n'

for key, path in images.items():
    with open(path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
        
    chunks = [b64[i:i+30000] for i in range(0, len(b64), 30000)]
    js_code += f'    var b64_{key} = [\n'
    for chunk in chunks:
        js_code += f'      \"{chunk}\",\n'
    js_code += '    ].join(\"\");\n'
    
    js_code += f'    var blob_{key} = Utilities.newBlob(Utilities.base64Decode(b64_{key}), \"image/png\", \"Logo_{key}.png\");\n'
    js_code += f'    var file_{key} = DriveApp.createFile(blob_{key});\n'
    js_code += f'    file_{key}.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);\n'
    js_code += f'    var url_{key} = \"https://drive.google.com/uc?export=view&id=\" + file_{key}.getId();\n'
    
    js_code += f'    _saveToConfig(\"LOGO_{key}\", url_{key}, \"Logo otomatis {key}\");\n\n'

# Adding LOGO_SEMUA as well, combining all is hard in apps script without canvas, but we can set LOGO_SEMUA to just one of them or empty string.
# The user said "satu logo gabungan 'SEMUA'". They didn't upload a 5th image. I'll just skip LOGO_SEMUA, it will fallback to emojis if not defined. Or I can set it to SIB.

js_code += '    ui.alert(\"Berhasil!\", \"Semua logo (4 Cabang) berhasil diupload ke Google Drive dan disetting ke dalam database Anda. Silakan Refresh (F5) halaman kasir Anda.\", ui.ButtonSet.OK);\n'
js_code += '  } catch(e) {\n'
js_code += '    ui.alert(\"Error\", e.toString(), ui.ButtonSet.OK);\n'
js_code += '  }\n'
js_code += '}\n\n'

js_code += 'function _saveToConfig(key, value, ket) {\n'
js_code += '  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"CONFIG\");\n'
js_code += '  var data = sheet.getDataRange().getValues();\n'
js_code += '  for (var i = 1; i < data.length; i++) {\n'
js_code += '    if (data[i][0] === key) {\n'
js_code += '      sheet.getRange(i + 1, 2).setValue(value);\n'
js_code += '      return;\n'
js_code += '    }\n'
js_code += '  }\n'
js_code += '  sheet.appendRow([key, value, ket]);\n'
js_code += '}\n'

with open(r'f:\proyek service hp\AutoUploadLogos.gs', 'w') as f:
    f.write(js_code)

print('Generated AutoUploadLogos.gs successfully!')
