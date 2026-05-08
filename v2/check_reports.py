import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

for fname in ['LaporanKas.html', 'LaporanLabaRugi.html', 'LaporanLengkap.html', 'LaporanServisan.html', 'RingkasanHarian.html']:
    with open(V2_DIR + '/' + fname, 'r', encoding='utf-8') as f:
        text = f.read()
    
    print(f'=== {fname} ===')
    
    # Find getMonthStartStr or getTodayStr usage
    if 'getMonthStartStr' in text:
        print('  Uses: getMonthStartStr()')
    if 'getTodayStr' in text:
        print('  Uses: getTodayStr()')
    
    # Find API calls
    api_calls = re.findall(r'API\.call\(["\'](\w+)', text)
    print(f'  API calls: {api_calls}')
    
    # Find loading indicator
    if 'Loading.show' in text or 'Loading\.show' in text:
        print('  Has loading indicator: YES')
    else:
        print('  Has loading indicator: NO')
    
    # Find empty state handling
    if 'empty-state' in text or 'Belum ada data' in text or 'Tidak ada data' in text:
        print('  Has empty state: YES')
    else:
        print('  Has empty state: NO')
    
    # Find error handling
    if 'Toast.error' in text or 'catch' in text:
        print('  Has error handling: YES')
    else:
        print('  Has error handling: NO')
    
    print()
