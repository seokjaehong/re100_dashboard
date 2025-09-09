import pandas as pd
import json
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
sample_data_dir = project_root / "public" / "sample_data"
agg_data_dir = project_root / "public" / "agg_data"

print("공급 데이터(발전소) 검증")
print("=" * 60)

# plant_list.csv 읽기
plant_list_file = sample_data_dir / "plant_list.csv"
plant_list_df = pd.read_csv(plant_list_file)

print("발전소 목록:")
for _, row in plant_list_df.iterrows():
    if pd.notna(row['plant_name']) and row['plant_name']:
        print(f"  - {row['plant_name']} ({row['type']}): {row['filename']}")

print("\n" + "=" * 60)

# 각 발전소 데이터 검증
total_solar_gwh = 0
total_wind_gwh = 0
plant_details = {}

for _, plant in plant_list_df.iterrows():
    if pd.isna(plant['filename']) or not plant['filename']:
        continue
        
    plant_file = sample_data_dir / plant['filename']
    
    if plant_file.exists():
        # CSV 파일 읽기
        df = pd.read_csv(plant_file)
        
        # 데이터 크기 확인
        total_rows = len(df)
        
        # value 합계 계산 (kWh -> GWh 변환)
        total_value_kwh = df['value'].sum()
        total_value_gwh = total_value_kwh / 1_000_000
        
        # 월별 집계
        df['datetime'] = pd.to_datetime(df['datetime'])
        df['month'] = df['datetime'].dt.to_period('M')
        monthly_sum = df.groupby('month')['value'].sum() / 1_000_000  # GWh
        
        print(f"\n{plant['plant_name']} ({plant['type']}):")
        print(f"  파일: {plant['filename']}")
        print(f"  데이터 행 수: {total_rows:,}")
        print(f"  연간 총 발전량: {total_value_gwh:,.2f} GWh")
        print(f"  10% 적용: {total_value_gwh * 0.10:,.2f} GWh")
        print(f"  월별 발전량 (처음 3개월):")
        for month, value in monthly_sum.head(3).items():
            print(f"    {month}: {value:,.2f} GWh")
        
        # 타입별 합계
        if plant['type'] == 'solar':
            total_solar_gwh += total_value_gwh
        elif plant['type'] == 'wind':
            total_wind_gwh += total_value_gwh
            
        plant_details[plant['plant_name']] = {
            'type': plant['type'],
            'annual_total_gwh': total_value_gwh,
            'monthly_avg_gwh': total_value_gwh / 12
        }
    else:
        print(f"\n{plant['plant_name']}: 파일 없음 ({plant_file})")

print("\n" + "=" * 60)
print("전체 공급 데이터 요약:")
print(f"  태양광 총 발전량: {total_solar_gwh:,.2f} GWh")
print(f"  풍력 총 발전량: {total_wind_gwh:,.2f} GWh")
print(f"  전체 공급량: {total_solar_gwh + total_wind_gwh:,.2f} GWh")
print()
print("10% 적용 후:")
print(f"  태양광: {total_solar_gwh * 0.10:,.2f} GWh")
print(f"  풍력: {total_wind_gwh * 0.10:,.2f} GWh")
print(f"  전체 공급: {(total_solar_gwh + total_wind_gwh) * 0.10:,.2f} GWh")

# 기존 집계 파일과 비교
print("\n" + "=" * 60)
print("기존 집계 파일과 비교:")

# monthly_aggregated.json 확인
monthly_agg_file = agg_data_dir / "monthly_aggregated.json"
if monthly_agg_file.exists():
    with open(monthly_agg_file, 'r', encoding='utf-8') as f:
        monthly_agg = json.load(f)
    
    if 'solar' in monthly_agg and 'total' in monthly_agg['solar']:
        existing_solar = sum(monthly_agg['solar']['total'].values())
        print(f"\n기존 monthly_aggregated.json:")
        print(f"  태양광 총계: {existing_solar:,.2f} GWh")
        print(f"  차이: {existing_solar - total_solar_gwh:,.2f} GWh")
    
    if 'wind' in monthly_agg and 'total' in monthly_agg['wind']:
        existing_wind = sum(monthly_agg['wind']['total'].values())
        print(f"  풍력 총계: {existing_wind:,.2f} GWh")
        print(f"  차이: {existing_wind - total_wind_gwh:,.2f} GWh")

# 새로 생성한 corrected 파일 확인
corrected_file = agg_data_dir / "monthly_aggregated_corrected.json"
if corrected_file.exists():
    with open(corrected_file, 'r', encoding='utf-8') as f:
        corrected_agg = json.load(f)
    
    print(f"\n새로운 monthly_aggregated_corrected.json:")
    if 'solar' in corrected_agg and 'total' in corrected_agg['solar']:
        corrected_solar = sum(corrected_agg['solar']['total'].values())
        print(f"  태양광 총계: {corrected_solar:,.2f} GWh")
        print(f"  원본 CSV 합계와 일치: {abs(corrected_solar - total_solar_gwh) < 0.01}")
    
    if 'wind' in corrected_agg and 'total' in corrected_agg['wind']:
        corrected_wind = sum(corrected_agg['wind']['total'].values())
        print(f"  풍력 총계: {corrected_wind:,.2f} GWh")
        print(f"  원본 CSV 합계와 일치: {abs(corrected_wind - total_wind_gwh) < 0.01}")

print("\n" + "=" * 60)
print("검증 완료!")