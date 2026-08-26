import csv
import json
import re

def parse_needs(needs_str):
    if not needs_str or needs_str == '-':
        return []
    items = []
    parts = needs_str.split(',')
    for part in parts:
        part = part.strip()
        m = re.match(r'^(.*?)\s*\((\d+)\)$', part)
        if m:
            item_name = m.group(1).strip()
            count = int(m.group(2))
            items.append({'item': item_name, 'count': count})
        elif part:
            items.append({'item': part, 'count': 1})
    return items

def get_bottleneck_level(ingredients):
    if not ingredients:
        return 'EASY'
    
    has_high_bottleneck = False
    has_med_bottleneck = False
    
    for ing in ingredients:
        iname = ing['item'].lower()
        if any(b in iname for b in ['cheese', 'butter', 'cream', 'white sugar', 'brown sugar', 'syrup', 'mayonnaise', 'olive oil', 'toffee', 'jam']):
            has_high_bottleneck = True
        elif any(b in iname for b in ['milk', 'egg', 'bacon', 'bread', 'cotton fabric']):
            has_med_bottleneck = True

    if has_high_bottleneck:
        return 'HIGH'
    if has_med_bottleneck:
        return 'MED'
    return 'EASY'

crops_data = [
    # Field crops
    {'name': 'Wheat', 'level': 1, 'maxPrice': 3, 'timeHours': 2/60, 'xp': 1, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Corn', 'level': 2, 'maxPrice': 7, 'timeHours': 5/60, 'xp': 1, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Soybean', 'level': 5, 'maxPrice': 10, 'timeHours': 20/60, 'xp': 2, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Sugarcane', 'level': 7, 'maxPrice': 14, 'timeHours': 30/60, 'xp': 3, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Carrot', 'level': 9, 'maxPrice': 7, 'timeHours': 10/60, 'xp': 2, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Indigo', 'level': 13, 'maxPrice': 25, 'timeHours': 120/60, 'xp': 5, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Pumpkin', 'level': 15, 'maxPrice': 32, 'timeHours': 180/60, 'xp': 6, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Cotton', 'level': 18, 'maxPrice': 28, 'timeHours': 150/60, 'xp': 6, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Chili Pepper', 'level': 25, 'maxPrice': 36, 'timeHours': 240/60, 'xp': 7, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Tomato', 'level': 30, 'maxPrice': 43, 'timeHours': 360/60, 'xp': 8, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Strawberries', 'level': 34, 'maxPrice': 50, 'timeHours': 480/60, 'xp': 10, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Potato', 'level': 35, 'maxPrice': 36, 'timeHours': 220/60, 'xp': 7, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Sesame', 'level': 50, 'maxPrice': 54, 'timeHours': 60/60, 'xp': 6, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Pineapple', 'level': 52, 'maxPrice': 57, 'timeHours': 180/60, 'xp': 7, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Lily', 'level': 53, 'maxPrice': 61, 'timeHours': 90/60, 'xp': 7, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Rice', 'level': 56, 'maxPrice': 18, 'timeHours': 45/60, 'xp': 3, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Garlic', 'level': 60, 'maxPrice': 14, 'timeHours': 30/60, 'xp': 3, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Peony', 'level': 63, 'maxPrice': 72, 'timeHours': 240/60, 'xp': 9, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Beetroot', 'level': 72, 'maxPrice': 36, 'timeHours': 45/60, 'xp': 4, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Bell pepper', 'level': 74, 'maxPrice': 36, 'timeHours': 270/60, 'xp': 7, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Cucumber', 'level': 79, 'maxPrice': 46, 'timeHours': 210/60, 'xp': 6, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},
    {'name': 'Onion', 'level': 68, 'maxPrice': 36, 'timeHours': 300/60, 'xp': 7, 'building': 'Plantio / Cultivo', 'category': 'CROPS'},

    # Trees & Bushes
    {'name': 'Apple', 'level': 15, 'maxPrice': 39, 'timeHours': 16, 'xp': 7, 'building': 'Macieira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Raspberry', 'level': 19, 'maxPrice': 46, 'timeHours': 18, 'xp': 9, 'building': 'Framboeseiro (Arbusto)', 'category': 'TREES', 'toolReq': '✂️ Tesoura de Poda (Axes)'},
    {'name': 'Blackberry', 'level': 26, 'maxPrice': 82, 'timeHours': 25, 'xp': 16, 'building': 'Amoreira (Arbusto)', 'category': 'TREES', 'toolReq': '✂️ Tesoura de Poda (Axes)'},
    {'name': 'Cherry', 'level': 22, 'maxPrice': 68, 'timeHours': 28, 'xp': 13, 'building': 'Cerejeira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Cacao', 'level': 36, 'maxPrice': 86, 'timeHours': 34, 'xp': 17, 'building': 'Cacauueiro (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Coffee bean', 'level': 42, 'maxPrice': 64, 'timeHours': 25, 'xp': 13, 'building': 'Cafeeiro (Arbusto)', 'category': 'TREES', 'toolReq': '✂️ Tesoura de Poda (Axes)'},
    {'name': 'Olive', 'level': 57, 'maxPrice': 82, 'timeHours': 24, 'xp': 17, 'building': 'Oliveira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Lemon', 'level': 66, 'maxPrice': 93, 'timeHours': 26, 'xp': 19, 'building': 'Limoeiro (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Orange', 'level': 71, 'maxPrice': 97, 'timeHours': 24, 'xp': 19, 'building': 'Laranjeira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Peach', 'level': 76, 'maxPrice': 100, 'timeHours': 30, 'xp': 20, 'building': 'Pêssego (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Banana', 'level': 88, 'maxPrice': 104, 'timeHours': 28, 'xp': 21, 'building': 'Bananeira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Plum', 'level': 94, 'maxPrice': 82, 'timeHours': 25, 'xp': 16, 'building': 'Ameixeira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Mango', 'level': 97, 'maxPrice': 100, 'timeHours': 30, 'xp': 20, 'building': 'Mangueira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Coconut', 'level': 101, 'maxPrice': 108, 'timeHours': 32, 'xp': 22, 'building': 'Coqueiro (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'},
    {'name': 'Guava', 'level': 104, 'maxPrice': 112, 'timeHours': 34, 'xp': 23, 'building': 'Goiabeira (Árvore)', 'category': 'TREES', 'toolReq': '🪓 Serrote (Saw)'}
]

price_dict = {}
for c in crops_data:
    price_dict[c['name'].lower()] = c['maxPrice']

items = []

for c in crops_data:
    mph = c['maxPrice'] / c['timeHours'] if c['timeHours'] > 0 else c['maxPrice']
    xph = c['xp'] / c['timeHours'] if c['timeHours'] > 0 else c['xp']
    item_obj = {
        'name': c['name'],
        'level': c['level'],
        'building': c['building'],
        'category': c['category'],
        'maxPrice': float(c['maxPrice']),
        'maxPriceStr': f"${c['maxPrice']}",
        'timeHours': round(c['timeHours'], 4),
        'maxPerHour': round(mph, 2),
        'maxPerHourStr': f"${mph:.2f}",
        'xp': float(c['xp']),
        'xpPerHour': round(xph, 2),
        'xpPerHourStr': f"{xph:.2f}",
        'ingredients': [],
        'ingredientCost': 0.0,
        'netProfit': float(c['maxPrice']),
        'bottleneck': 'EASY'
    }
    if 'toolReq' in c:
        item_obj['toolReq'] = c['toolReq']
    items.append(item_obj)

goods_rows = []
with open('Hay Day Goods List v1.0 - goods_list.csv', 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) >= 8:
            name = row[0].strip()
            level = int(row[1]) if row[1].isdigit() else 1
            xp = float(row[2].replace(',', '.')) if row[2] else 0.0
            building = row[3].strip()
            needs_raw = row[4].strip()
            
            t_str = row[5]
            parts = t_str.split(':')
            time_hours = 0.0
            if len(parts) == 2:
                try:
                    time_hours = float(parts[0]) + float(parts[1]) / 60.0
                except:
                    time_hours = 0.0
            
            max_price = float(row[7].replace(',', '.')) if row[7] else 0.0
            
            if building in ['Field', 'Apple tree', 'Raspberry bush', 'Blackberry bush', 'Cherry tree', 'Cacao tree', 'Coffee bush', 'Olive tree', 'Lemon tree', 'Orange tree', 'Peach tree', 'Banana tree', 'Plum tree', 'Mango tree', 'Coconut tree', 'Guava tree']:
                continue

            price_dict[name.lower()] = max_price
            goods_rows.append({
                'name': name,
                'level': level,
                'xp': xp,
                'building': building,
                'needs_raw': needs_raw,
                'timeHours': time_hours,
                'maxPrice': max_price
            })

for g in goods_rows:
    raw_ingredients = parse_needs(g['needs_raw'])
    cost = 0.0
    detailed_ingredients = []
    
    for ing in raw_ingredients:
        iname = ing['item']
        cnt = ing['count']
        unit_price = price_dict.get(iname.lower(), 10.0) # default fallback if unmapped
        total_ing_price = unit_price * cnt
        cost += total_ing_price
        detailed_ingredients.append({
            'item': iname,
            'count': cnt,
            'unitPrice': unit_price,
            'totalPrice': total_ing_price
        })

    net_profit = max(0.0, g['maxPrice'] - cost)
    max_per_hour = (g['maxPrice'] / g['timeHours']) if g['timeHours'] > 0 else g['maxPrice']
    net_per_hour = (net_profit / g['timeHours']) if g['timeHours'] > 0 else net_profit
    xp_per_hour = (g['xp'] / g['timeHours']) if g['timeHours'] > 0 else g['xp']
    bottleneck = get_bottleneck_level(raw_ingredients)

    items.append({
        'name': g['name'],
        'level': g['level'],
        'building': g['building'],
        'category': 'MACHINES',
        'maxPrice': g['maxPrice'],
        'maxPriceStr': f"${int(g['maxPrice'])}",
        'timeHours': round(g['timeHours'], 4),
        'maxPerHour': round(max_per_hour, 2),
        'maxPerHourStr': f"${max_per_hour:.2f}",
        'ingredientCost': round(cost, 2),
        'netProfit': round(net_profit, 2),
        'netPerHour': round(net_per_hour, 2),
        'xp': g['xp'],
        'xpPerHour': round(xp_per_hour, 2),
        'xpPerHourStr': f"{xp_per_hour:.2f}",
        'ingredients': detailed_ingredients,
        'bottleneck': bottleneck
    })

print(f"Rebuilt data.json with detailed ingredient prices for {len(items)} items!")

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2, ensure_ascii=False)
