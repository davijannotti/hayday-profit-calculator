import csv
import json

def parse_time_str(t_str):
    if not t_str:
        return 0.0
    parts = t_str.split(':')
    if len(parts) == 2:
        try:
            return float(parts[0]) + float(parts[1]) / 60.0
        except:
            return 0.0
    try:
        return float(t_str)
    except:
        return 0.0

items = []

# 1. Parse Hay Day Goods List v1.0 - goods_list.csv
with open('Hay Day Goods List v1.0 - goods_list.csv', 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) >= 8:
            name = row[0].strip()
            level = int(row[1]) if row[1].isdigit() else 1
            xp = float(row[2].replace(',', '.')) if row[2] else 0.0
            building = row[3].strip()
            time_hours = parse_time_str(row[5])
            max_price = float(row[7].replace(',', '.')) if row[7] else 0.0

            max_per_hour = (max_price / time_hours) if time_hours > 0 else max_price
            xp_per_hour = (xp / time_hours) if time_hours > 0 else xp

            items.append({
                'name': name,
                'level': level,
                'building': building,
                'maxPrice': max_price,
                'maxPriceStr': f'${int(max_price)}',
                'timeHours': round(time_hours, 4),
                'maxPerHour': round(max_per_hour, 2),
                'maxPerHourStr': f'${max_per_hour:.2f}',
                'xp': xp,
                'xpPerHour': round(xp_per_hour, 2),
                'xpPerHourStr': f'{xp_per_hour:.2f}'
            })

print(f'Goods extracted from goods_list.csv: {len(items)}')

# 2. Crops & Trees from Hay Day Analysis, v. 2 - By Machine.csv
crops_data = [
    {'name': 'Wheat', 'level': 1, 'maxPrice': 3, 'timeHours': 2/60, 'xp': 1, 'building': 'Plantio / Cultivo'},
    {'name': 'Corn', 'level': 2, 'maxPrice': 7, 'timeHours': 5/60, 'xp': 1, 'building': 'Plantio / Cultivo'},
    {'name': 'Carrot', 'level': 9, 'maxPrice': 7, 'timeHours': 10/60, 'xp': 2, 'building': 'Plantio / Cultivo'},
    {'name': 'Soybean', 'level': 5, 'maxPrice': 10, 'timeHours': 20/60, 'xp': 2, 'building': 'Plantio / Cultivo'},
    {'name': 'Sugarcane', 'level': 7, 'maxPrice': 14, 'timeHours': 30/60, 'xp': 3, 'building': 'Plantio / Cultivo'},
    {'name': 'Indigo', 'level': 13, 'maxPrice': 25, 'timeHours': 120/60, 'xp': 5, 'building': 'Plantio / Cultivo'},
    {'name': 'Pumpkin', 'level': 15, 'maxPrice': 32, 'timeHours': 180/60, 'xp': 6, 'building': 'Plantio / Cultivo'},
    {'name': 'Chili Pepper', 'level': 25, 'maxPrice': 36, 'timeHours': 240/60, 'xp': 7, 'building': 'Plantio / Cultivo'},
    {'name': 'Tomato', 'level': 30, 'maxPrice': 43, 'timeHours': 360/60, 'xp': 8, 'building': 'Plantio / Cultivo'},
    {'name': 'Strawberries', 'level': 34, 'maxPrice': 50, 'timeHours': 480/60, 'xp': 10, 'building': 'Plantio / Cultivo'},
    {'name': 'Potatoes', 'level': 35, 'maxPrice': 36, 'timeHours': 220/60, 'xp': 7, 'building': 'Plantio / Cultivo'},
    {'name': 'Cotton', 'level': 18, 'maxPrice': 28, 'timeHours': 150/60, 'xp': 6, 'building': 'Plantio / Cultivo'},
    {'name': 'Apple', 'level': 15, 'maxPrice': 39, 'timeHours': 960/60, 'xp': 7, 'building': 'Árvores & Arbustos'},
    {'name': 'Raspberry', 'level': 19, 'maxPrice': 46, 'timeHours': 1080/60, 'xp': 9, 'building': 'Árvores & Arbustos'},
    {'name': 'Blackberry', 'level': 26, 'maxPrice': 82, 'timeHours': 1500/60, 'xp': 16, 'building': 'Árvores & Arbustos'},
    {'name': 'Cherry', 'level': 22, 'maxPrice': 68, 'timeHours': 1680/60, 'xp': 13, 'building': 'Árvores & Arbustos'},
    {'name': 'Cacao', 'level': 36, 'maxPrice': 86, 'timeHours': 2040/60, 'xp': 17, 'building': 'Árvores & Arbustos'},
    {'name': 'Coffee bean', 'level': 42, 'maxPrice': 64, 'timeHours': 1500/60, 'xp': 13, 'building': 'Árvores & Arbustos'},
    {'name': 'Olive', 'level': 57, 'maxPrice': 82, 'timeHours': 1440/60, 'xp': 17, 'building': 'Árvores & Arbustos'},
    {'name': 'Lemon', 'level': 66, 'maxPrice': 93, 'timeHours': 1560/60, 'xp': 19, 'building': 'Árvores & Arbustos'},
    {'name': 'Orange', 'level': 71, 'maxPrice': 97, 'timeHours': 1440/60, 'xp': 19, 'building': 'Árvores & Arbustos'},
    {'name': 'Peach', 'level': 76, 'maxPrice': 100, 'timeHours': 1800/60, 'xp': 20, 'building': 'Árvores & Arbustos'}
]

for c in crops_data:
    mph = c['maxPrice'] / c['timeHours']
    xph = c['xp'] / c['timeHours']
    items.append({
        'name': c['name'],
        'level': c['level'],
        'building': c['building'],
        'maxPrice': float(c['maxPrice']),
        'maxPriceStr': f"${c['maxPrice']}",
        'timeHours': round(c['timeHours'], 4),
        'maxPerHour': round(mph, 2),
        'maxPerHourStr': f"${mph:.2f}",
        'xp': float(c['xp']),
        'xpPerHour': round(xph, 2),
        'xpPerHourStr': f"{xph:.2f}"
    })

print(f'Total items including crops & trees: {len(items)}')

# Save clean data.json
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2, ensure_ascii=False)
