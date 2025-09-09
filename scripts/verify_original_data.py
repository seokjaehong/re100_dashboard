import pandas as pd
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
sample_data_dir = project_root / "public" / "sample_data"

# 원본 CSV 파일 읽기
csv_file = sample_data_dir / "sample_data_integrated_2024_integrated.csv"

print(f"원본 파일 검증: {csv_file}")
print("=" * 60)

# CSV 파일 읽기
df = pd.read_csv(csv_file)

print(f"전체 데이터 행 수: {len(df):,}")
print(f"컬럼: {df.columns.tolist()}")
print()

# 데이터 타입별 확인
demand_data = df[df['type'] == 'demand']
print(f"수요(demand) 데이터 행 수: {len(demand_data):,}")

# 기업별 데이터 개수 확인
companies = demand_data['plant_name'].unique()
print(f"기업 수: {len(companies)}")
print()

# value 컬럼의 단위 확인 (kWh인지 확인)
print("원본 value 값 샘플 (처음 10개):")
print(demand_data['value'].head(10).tolist())
print()

# 전체 수요 합계 계산 (kWh 단위)
total_demand_kwh = demand_data['value'].sum()
print(f"원본 총 수요 (kWh): {total_demand_kwh:,.0f}")

# GWh로 변환
total_demand_gwh = total_demand_kwh / 1_000_000
print(f"원본 총 수요 (GWh): {total_demand_gwh:,.2f}")

# 10% 적용
total_demand_10pct = total_demand_gwh * 0.10
print(f"10% 적용 후 (GWh): {total_demand_10pct:,.2f}")

print()
print("=" * 60)

# 기업별 월별 집계
print("기업별 월별 집계 (상위 3개 기업):")
demand_data['datetime'] = pd.to_datetime(demand_data['datetime'])
demand_data['month'] = demand_data['datetime'].dt.to_period('M')

for i, company in enumerate(companies[:3]):
    company_data = demand_data[demand_data['plant_name'] == company]
    monthly_sum = company_data.groupby('month')['value'].sum() / 1_000_000  # GWh로 변환
    
    print(f"\n{company}:")
    print(f"  연간 총계: {monthly_sum.sum():,.2f} GWh")
    print(f"  10% 적용: {monthly_sum.sum() * 0.10:,.2f} GWh")
    print("  월별 데이터 (처음 3개월):")
    for month, value in monthly_sum.head(3).items():
        print(f"    {month}: {value:,.2f} GWh → 10% 적용: {value * 0.10:,.2f} GWh")

# 시간별 데이터 개수 확인
print()
print("=" * 60)
print("시간별 데이터 확인:")
sample_date = demand_data['datetime'].iloc[0].date()
sample_data = demand_data[demand_data['datetime'].dt.date == sample_date]
print(f"샘플 날짜 ({sample_date})의 데이터 포인트: {len(sample_data)}")
print(f"기업당 시간별 데이터: {len(sample_data) / len(companies):.0f} 개")