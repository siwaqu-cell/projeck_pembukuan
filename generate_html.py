import os
import markdown

brain_dir = r'C:\Users\siwa\.gemini\antigravity\brain'
out_file = r'f:\proyek service hp\Walkthrough_ServicePro_Lengkap.html'

md_content = '# 📖 BUKU PANDUAN & WALKTHROUGH SERVICEPRO HP (LENGKAP)\n\n'
md_content += 'Dokumen ini berisi seluruh ringkasan fitur, perbaikan, dan panduan penggunaan dari awal pengembangan hingga selesai.\n\n---\n\n'

folders = sorted(os.listdir(brain_dir))

for folder in folders:
    folder_path = os.path.join(brain_dir, folder)
    if os.path.isdir(folder_path) and not folder.startswith('.'):
        walk_path = os.path.join(folder_path, 'walkthrough.md')
        if os.path.exists(walk_path):
            with open(walk_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                first_line = content.strip().split('\n')[0]
                if first_line.startswith('# '):
                    title = first_line.replace('# ', '')
                    content = content[len(first_line):].strip()
                else:
                    title = 'Sesi Pengembangan: ' + folder
                
                md_content += f'<div class="page-break"></div>\n\n'
                md_content += f'## {title}\n\n'
                md_content += content
                md_content += '\n\n---\n\n'

html_template = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Walkthrough Lengkap ServicePro</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px; }
        h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 30px; }
        h2 { color: #2980b9; margin-top: 40px; }
        h3 { color: #16a085; }
        h4 { color: #8e44ad; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid #e9ecef; }
        code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; color: #e74c3c; font-family: Consolas, monospace; }
        blockquote { border-left: 4px solid #f1c40f; padding-left: 15px; color: #555; background: #fcfbf5; padding: 15px; margin-left: 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .page-break { page-break-before: always; margin-top: 50px; }
        img { max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        
        @media print {
            body { padding: 0; max-width: 100%; background: white; }
            .page-break { page-break-before: always; margin-top: 0; }
            pre, blockquote { border: 1px solid #ccc; }
        }
    </style>
</head>
<body>
'''

try:
    html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])
    html_template += html_content
    html_template += '</body></html>'

    with open(out_file, 'w', encoding='utf-8') as out:
        out.write(html_template)
    print('HTML generated successfully!')
except Exception as e:
    print('Error generating HTML:', str(e))
