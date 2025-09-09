import json
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
agg_data_dir = project_root / "public" / "agg_data"

# 발전소 이름 매핑
plant_name_mapping = {
    "solar_plant1": "육상태양광",
    "solar_plant2": "수상태양광1",
    "solar_plant3": "수상태양광2",
    "wind_plant1": "군산해상풍력",
    "wind_plant2": "새만금해상풍력",
    "wind_plant3": "서남해해상풍력"
}

def update_plant_names(data, mapping):
    """발전소 이름을 한글로 변경"""
    updated_data = {}
    for key, value in data.items():
        if key in mapping:
            updated_data[mapping[key]] = value
        else:
            updated_data[key] = value
    return updated_data

# 1. monthly_aggregated_original.json 수정
monthly_file = agg_data_dir / "monthly_aggregated_original.json"
with open(monthly_file, 'r', encoding='utf-8') as f:
    monthly_data = json.load(f)

# 태양광 데이터 이름 변경
if 'solar' in monthly_data:
    monthly_data['solar'] = update_plant_names(monthly_data['solar'], plant_name_mapping)

# 풍력 데이터 이름 변경
if 'wind' in monthly_data:
    monthly_data['wind'] = update_plant_names(monthly_data['wind'], plant_name_mapping)

# 저장
with open(monthly_file, 'w', encoding='utf-8') as f:
    json.dump(monthly_data, f, ensure_ascii=False, indent=2)

print(f"[OK] monthly_aggregated_original.json 발전소 이름 수정 완료")

# 2. plant_hourly_aggregated_original.json 수정
hourly_file = agg_data_dir / "plant_hourly_aggregated_original.json"
with open(hourly_file, 'r', encoding='utf-8') as f:
    hourly_data = json.load(f)

# 태양광 데이터 이름 변경
if 'solar' in hourly_data:
    hourly_data['solar'] = update_plant_names(hourly_data['solar'], plant_name_mapping)

# 풍력 데이터 이름 변경
if 'wind' in hourly_data:
    hourly_data['wind'] = update_plant_names(hourly_data['wind'], plant_name_mapping)

# 저장
with open(hourly_file, 'w', encoding='utf-8') as f:
    json.dump(hourly_data, f, ensure_ascii=False, indent=2)

print(f"[OK] plant_hourly_aggregated_original.json 발전소 이름 수정 완료")

print("\n수정된 발전소 이름:")
for eng, kor in plant_name_mapping.items():
    print(f"  {eng} → {kor}")