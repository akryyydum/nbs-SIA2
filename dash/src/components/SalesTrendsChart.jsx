import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SalesTrendsChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={160}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" fontSize={12} />
      <YAxis fontSize={12} />
      <Tooltip />
      <Line type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

export default SalesTrendsChart;