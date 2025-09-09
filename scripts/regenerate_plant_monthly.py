import pandas as pd
import json
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
sample_data_dir = project_root / "public" / "sample_data"
agg_data_dir = project_root / "public" / "agg_data"

# 발전소별 CSV 파일 로드 및 월별 집계
plant_monthly = {
    "solar": {},
    "wind": {}
}

# 태양광 발전소 처리
solar_plants = ['solar_plant1', 'solar_plant2', 'solar_plant3']
for plant in solar_plants:
    csv_path = sample_data_dir / f"{plant}.csv"
    if csv_path.exists():
        df = pd.read_csv(csv_path, parse_dates=['datetime'])
        # 월별 집계 (kWh -> GWh 변환)
        monthly = df.groupby(df['datetime'].dt.to_period('M'))['value'].sum() / 1000000
        
        plant_monthly['solar'][plant] = {}
        for period, value in monthly.items():
            month_key = str(period)  # "2024-01" 형식
            plant_monthly['solar'][plant][month_key] = value

# 풍력 발전소 처리  
wind_plants = ['wind_plant1', 'wind_plant2', 'wind_plant3']
for plant in wind_plants:
    csv_path = sample_data_dir / f"{plant}.csv"
    if csv_path.exists():
        df = pd.read_csv(csv_path, parse_dates=['datetime'])
        # 월별 집계 (kWh -> GWh 변환)
        monthly = df.groupby(df['datetime'].dt.to_period('M'))['value'].sum() / 1000000
        
        plant_monthly['wind'][plant] = {}
        for period, value in monthly.items():
            month_key = str(period)  # "2024-01" 형식
            plant_monthly['wind'][plant][month_key] = value

# JSON 파일로 저장
output_path = agg_data_dir / "plant_monthly_aggregated.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(plant_monthly, f, ensure_ascii=False, indent=2)

print(f"✅ plant_monthly_aggregated.json 재생성 완료")

# 검증
for plant_type in ['solar', 'wind']:
    print(f"\n{plant_type.upper()} 발전소:")
    for plant, data in plant_monthly[plant_type].items():
        months = len(data)
        total = sum(data.values())
        print(f"  {plant}: {months}개월, 연간 총 {total:.2f} GWh")
        if months < 12:
            print(f"    ⚠️ 경고: {months}개월만 있음")