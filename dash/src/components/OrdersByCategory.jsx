import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#ef4444", "#f59e42", "#10b981", "#6366f1", "#fbbf24", "#3b82f6"];

const OrdersByCategory = ({ data }) => (
  <ResponsiveContainer width="100%" height={160}>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="category"
        cx="50%"
        cy="50%"
        outerRadius={60}
        fill="#ef4444"
        label
      >
        {data.map((entry, idx) => (
          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

export default OrdersByCategory;