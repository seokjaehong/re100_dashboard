import pandas as pd
import json
from pathlib import Path
from datetime import datetime

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
sample_data_dir = project_root / "public" / "sample_data"
agg_data_dir = project_root / "public" / "agg_data"

# 원본 CSV 파일 읽기
csv_file = sample_data_dir / "sample_data_integrated_2024_integrated.csv"
df = pd.read_csv(csv_file)

# datetime 파싱
df['datetime'] = pd.to_datetime(df['datetime'])
df['month'] = df['datetime'].dt.strftime('%Y-%m')
df['hour'] = df['datetime'].dt.hour

# value를 GWh로 변환 (kWh -> GWh)
df['value_gwh'] = df['value'] / 1_000_000

print("원본 데이터 그대로 사용하여 재집계 시작...")
print("=" * 60)

# 1. 월별 집계 (monthly_aggregated.json)
monthly_agg = {
    'solar': {},
    'wind': {},
    'demand': {}
}

# 태양광 데이터 집계
solar_data = df[df['type'] == 'solar']
if len(solar_data) > 0:
    # 발전소별 월별 집계
    solar_plants = solar_data['plant_name'].unique()
    for plant in solar_plants:
        plant_data = solar_data[solar_data['plant_name'] == plant]
        monthly_sum = plant_data.groupby('month')['value_gwh'].sum()
        monthly_agg['solar'][plant] = monthly_sum.to_dict()
    
    # 전체 태양광 월별 합계
    solar_monthly_total = solar_data.groupby('month')['value_gwh'].sum()
    monthly_agg['solar']['total'] = solar_monthly_total.to_dict()

# 풍력 데이터 집계
wind_data = df[df['type'] == 'wind']
if len(wind_data) > 0:
    # 발전소별 월별 집계
    wind_plants = wind_data['plant_name'].unique()
    for plant in wind_plants:
        plant_data = wind_data[wind_data['plant_name'] == plant]
        monthly_sum = plant_data.groupby('month')['value_gwh'].sum()
        monthly_agg['wind'][plant] = monthly_sum.to_dict()
    
    # 전체 풍력 월별 합계
    wind_monthly_total = wind_data.groupby('month')['value_gwh'].sum()
    monthly_agg['wind']['total'] = wind_monthly_total.to_dict()

# 수요 데이터 집계 (전체 기업 합계)
demand_data = df[df['type'] == 'demand']
demand_monthly_total = demand_data.groupby('month')['value_gwh'].sum()
monthly_agg['demand'] = demand_monthly_total.to_dict()

# 월별 집계 저장 (원본 값)
output_file = agg_data_dir / "monthly_aggregated_original.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(monthly_agg, f, ensure_ascii=False, indent=2)

print(f"[OK] 월별 집계 파일 생성 (원본): {output_file}")

# 2. 기업별 월별 집계 (company_monthly_aggregated.json)
company_monthly = {}
companies = demand_data['plant_name'].unique()

for company in companies:
    company_data = demand_data[demand_data['plant_name'] == company]
    monthly_sum = company_data.groupby('month')['value_gwh'].sum()
    company_monthly[company] = monthly_sum.to_dict()

# 기업별 월별 집계 저장 (원본 값)
output_file = agg_data_dir / "company_monthly_aggregated_original.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(company_monthly, f, ensure_ascii=False, indent=2)

print(f"[OK] 기업별 월별 파일 생성 (원본): {output_file}")

# 3. 발전소별 시간대별 집계
plant_hourly = {
    'solar': {},
    'wind': {}
}

# 태양광 발전소별 시간대별 평균
for plant in solar_plants:
    plant_data = solar_data[solar_data['plant_name'] == plant]
    hourly_avg = plant_data.groupby('hour')['value_gwh'].mean()
    plant_hourly['solar'][plant] = hourly_avg.to_dict()

# 풍력 발전소별 시간대별 평균
for plant in wind_plants:
    plant_data = wind_data[wind_data['plant_name'] == plant]
    hourly_avg = plant_data.groupby('hour')['value_gwh'].mean()
    plant_hourly['wind'][plant] = hourly_avg.to_dict()

# 발전소별 시간대별 집계 저장 (원본 값)
output_file = agg_data_dir / "plant_hourly_aggregated_original.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(plant_hourly, f, ensure_ascii=False, indent=2)

print(f"[OK] 발전소별 시간대별 파일 생성 (원본): {output_file}")

# 4. 검증 출력
print()
print("=" * 60)
print("데이터 검증:")
print()

# 원본 합계
total_solar = sum(sum(v for k, v in plant.items()) 
                  for name, plant in monthly_agg['solar'].items() 
                  if name != 'total')
total_wind = sum(sum(v for k, v in plant.items()) 
                 for name, plant in monthly_agg['wind'].items() 
                 if name != 'total')
total_demand = sum(monthly_agg['demand'].values())

print(f"원본 데이터 연간 합계:")
print(f"  태양광: {total_solar:,.2f} GWh")
print(f"  풍력: {total_wind:,.2f} GWh")
print(f"  수요: {total_demand:,.2f} GWh")
print()
print(f"RE100 달성률:")
print(f"  {((total_solar + total_wind) / total_demand * 100):.2f}%")

# 요약 통계 파일 생성
summary = {
    "annual_totals": {
        "solar": round(total_solar, 2),
        "wind": round(total_wind, 2),
        "supply": round(total_solar + total_wind, 2),
        "demand": round(total_demand, 2),
        "re100_rate": round(((total_solar + total_wind) / total_demand * 100), 2)
    },
    "note": "Original values from integrated CSV (no 10% adjustment)"
}

output_file = agg_data_dir / "summary_stats_original.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print()
print("=" * 60)
print("[COMPLETE] 모든 집계 파일 재생성 완료 (원본 값 사용)!")
print("다음 파일들이 생성되었습니다:")
print("  - monthly_aggregated_original.json")
print("  - company_monthly_aggregated_original.json")
print("  - plant_hourly_aggregated_original.json")
print("  - summary_stats_original.json")