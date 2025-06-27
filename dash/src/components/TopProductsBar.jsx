import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TopProductsBar = ({ data }) => (
  <ResponsiveContainer width="100%" height={160}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="product" fontSize={12} />
      <YAxis fontSize={12} />
      <Tooltip />
      <Bar dataKey="sales" fill="#ef4444" />
    </BarChart>
  </ResponsiveContainer>
);

export default TopProductsBar;