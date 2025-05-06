import { WindFarmMonitoring } from '../../components/wind-farm-monitoring';

export default function MonitoringPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold px-4 py-4">風機監控系統</h1>
      <div className="px-2 h-[calc(100vh-130px)]">
        <WindFarmMonitoring />
      </div>
    </div>
  );
}
