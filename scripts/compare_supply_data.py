import pandas as pd
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
sample_data_dir = project_root / "public" / "sample_data"

print("공급 데이터 비교 검증")
print("=" * 60)

# 1. 통합 CSV 파일에서 공급 데이터 확인
integrated_file = sample_data_dir / "sample_data_integrated_2024_integrated.csv"
df_integrated = pd.read_csv(integrated_file)

solar_integrated = df_integrated[df_integrated['type'] == 'solar']
wind_integrated = df_integrated[df_integrated['type'] == 'wind']

solar_total_integrated = solar_integrated['value'].sum() / 1_000_000  # GWh
wind_total_integrated = wind_integrated['value'].sum() / 1_000_000  # GWh

print("통합 CSV 파일 (sample_data_integrated_2024_integrated.csv):")
print(f"  태양광 총 발전량: {solar_total_integrated:,.2f} GWh")
print(f"  풍력 총 발전량: {wind_total_integrated:,.2f} GWh")
print(f"  전체 공급량: {solar_total_integrated + wind_total_integrated:,.2f} GWh")

# 2. 개별 발전소 CSV 파일 합계
plant_list_file = sample_data_dir / "plant_list.csv"
plant_list_df = pd.read_csv(plant_list_file)

total_solar_individual = 0
total_wind_individual = 0

print("\n개별 발전소 CSV 파일:")
for _, plant in plant_list_df.iterrows():
    if pd.isna(plant['filename']) or not plant['filename']:
        continue
        
    plant_file = sample_data_dir / plant['filename']
    
    if plant_file.exists():
        df = pd.read_csv(plant_file)
        total_value_gwh = df['value'].sum() / 1_000_000
        
        if plant['type'] == 'solar':
            total_solar_individual += total_value_gwh
        elif plant['type'] == 'wind':
            total_wind_individual += total_value_gwh

print(f"  태양광 총 발전량: {total_solar_individual:,.2f} GWh")
print(f"  풍력 총 발전량: {total_wind_individual:,.2f} GWh")
print(f"  전체 공급량: {total_solar_individual + total_wind_individual:,.2f} GWh")

# 3. 차이 분석
print("\n" + "=" * 60)
print("데이터 소스 간 차이:")
solar_diff = solar_total_integrated - total_solar_individual
wind_diff = wind_total_integrated - total_wind_individual

print(f"  태양광 차이: {solar_diff:,.2f} GWh ({solar_diff/total_solar_individual*100:.1f}%)")
print(f"  풍력 차이: {wind_diff:,.2f} GWh ({wind_diff/total_wind_individual*100:.1f}%)")

# 4. 어떤 데이터를 사용해야 하는지 결정
print("\n" + "=" * 60)
print("결론:")
if abs(solar_diff) < 1 and abs(wind_diff) < 1:
    print("[OK] 두 데이터 소스가 거의 일치합니다.")
    print("  통합 CSV 파일을 사용하는 것이 적절합니다.")
else:
    print("[WARNING] 데이터 소스 간 차이가 있습니다.")
    print(f"  통합 CSV: 태양광 {solar_total_integrated:.2f} GWh, 풍력 {wind_total_integrated:.2f} GWh")
    print(f"  개별 CSV: 태양광 {total_solar_individual:.2f} GWh, 풍력 {total_wind_individual:.2f} GWh")
    print("\n  통합 CSV 파일이 더 많은 데이터를 포함하고 있습니다.")
    print("  -> 통합 CSV 파일의 데이터를 사용하는 것이 적절합니다.")

# 5. 최종 수치 (10% 적용)
print("\n" + "=" * 60)
print("최종 사용할 값 (통합 CSV 기준, 10% 적용):")
print(f"  태양광: {solar_total_integrated * 0.10:,.2f} GWh")
print(f"  풍력: {wind_total_integrated * 0.10:,.2f} GWh")
print(f"  전체 공급: {(solar_total_integrated + wind_total_integrated) * 0.10:,.2f} GWh")

# 수요 데이터와 함께 RE100 계산
demand_integrated = df_integrated[df_integrated['type'] == 'demand']
demand_total = demand_integrated['value'].sum() / 1_000_000  # GWh

print(f"\n수요: {demand_total * 0.10:,.2f} GWh (10% 적용)")
re100_rate = (solar_total_integrated + wind_total_integrated) / demand_total * 100
print(f"RE100 달성률: {re100_rate:.2f}%")